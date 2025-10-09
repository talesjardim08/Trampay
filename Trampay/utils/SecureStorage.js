// Utilitário de armazenamento seguro para dados PII sensíveis - Trampay
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Campos considerados dados pessoais sensíveis que devem ser criptografados
const SENSITIVE_FIELDS = ['name', 'cpf', 'phone', 'email', 'clientName'];

class SecureStorage {
  
  /**
   * Verifica se um objeto contém dados sensíveis
   */
  static hasSensitiveData(obj) {
    if (!obj || typeof obj !== 'object') return false;
    
    const checkObject = (item) => {
      if (Array.isArray(item)) {
        return item.some(element => checkObject(element));
      }
      
      if (typeof item === 'object' && item !== null) {
        return Object.keys(item).some(key => 
          SENSITIVE_FIELDS.includes(key) || checkObject(item[key])
        );
      }
      
      return false;
    };
    
    return checkObject(obj);
  }

  /**
   * Separa dados sensíveis dos não sensíveis
   */
  static separateData(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.separateData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sensitiveData = {};
      const publicData = {};
      
      Object.keys(data).forEach(key => {
        if (SENSITIVE_FIELDS.includes(key)) {
          sensitiveData[key] = data[key];
        } else if (typeof data[key] === 'object') {
          const separated = this.separateData(data[key]);
          if (this.hasSensitiveData(separated)) {
            sensitiveData[key] = separated;
          } else {
            publicData[key] = separated;
          }
        } else {
          publicData[key] = data[key];
        }
      });
      
      return { sensitiveData, publicData };
    }
    
    return data;
  }

  /**
   * Combina dados sensíveis e públicos de volta
   */
  static combineData(publicData, sensitiveData) {
    if (Array.isArray(publicData)) {
      return publicData.map((item, index) => {
        if (sensitiveData && sensitiveData[index]) {
          return this.combineData(item, sensitiveData[index]);
        }
        return item;
      });
    }
    
    if (typeof publicData === 'object' && publicData !== null) {
      return {
        ...publicData,
        ...sensitiveData
      };
    }
    
    return publicData;
  }

  /**
   * Salva dados de forma segura - dados sensíveis no SecureStore, demais no AsyncStorage
   */
  static async setItem(key, data) {
    try {
      if (!this.hasSensitiveData(data)) {
        // Se não há dados sensíveis, salva normalmente no AsyncStorage
        await AsyncStorage.setItem(key, JSON.stringify(data));
        return;
      }

      let processedData = data;
      let sensitiveDataStore = {};

      if (Array.isArray(data)) {
        // Para arrays, processa cada item individualmente
        const publicArray = [];
        
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          const separated = this.separateData(item);
          
          if (separated.sensitiveData && Object.keys(separated.sensitiveData).length > 0) {
            sensitiveDataStore[i] = separated.sensitiveData;
            publicArray.push({
              ...separated.publicData,
              _hasSecureData: true,
              _secureDataIndex: i
            });
          } else {
            publicArray.push(item);
          }
        }
        
        processedData = publicArray;
      } else {
        // Para objetos únicos
        const separated = this.separateData(data);
        if (separated.sensitiveData && Object.keys(separated.sensitiveData).length > 0) {
          sensitiveDataStore = separated.sensitiveData;
          processedData = {
            ...separated.publicData,
            _hasSecureData: true
          };
        }
      }

      // Salva dados sensíveis no SecureStore
      if (Object.keys(sensitiveDataStore).length > 0) {
        await SecureStore.setItemAsync(`${key}_secure`, JSON.stringify(sensitiveDataStore));
      }

      // Salva dados públicos no AsyncStorage
      await AsyncStorage.setItem(key, JSON.stringify(processedData));
      
    } catch (error) {
      console.error('Erro ao salvar dados seguros:', error);
      throw new Error(`Falha ao salvar dados: ${error.message}`);
    }
  }

  /**
   * Recupera dados de forma segura - combina dados do AsyncStorage e SecureStore
   */
  static async getItem(key) {
    try {
      // Recupera dados públicos do AsyncStorage
      const publicDataStr = await AsyncStorage.getItem(key);
      if (!publicDataStr) return null;
      
      const publicData = JSON.parse(publicDataStr);
      
      // Verifica se há dados sensíveis para recuperar
      const hasSecureData = Array.isArray(publicData) 
        ? publicData.some(item => item && item._hasSecureData)
        : publicData && publicData._hasSecureData;

      if (!hasSecureData) {
        return publicData;
      }

      // Recupera dados sensíveis do SecureStore
      const sensitiveDataStr = await SecureStore.getItemAsync(`${key}_secure`);
      if (!sensitiveDataStr) {
        // Remove flags de dados seguros se não encontrou os dados sensíveis
        return this.cleanSecureFlags(publicData);
      }

      const sensitiveData = JSON.parse(sensitiveDataStr);

      // Combina os dados
      if (Array.isArray(publicData)) {
        return publicData.map((item, index) => {
          if (item && item._hasSecureData && sensitiveData[index]) {
            const cleanItem = this.cleanSecureFlags(item);
            return this.combineData(cleanItem, sensitiveData[index]);
          }
          return item;
        });
      } else {
        const cleanPublicData = this.cleanSecureFlags(publicData);
        return this.combineData(cleanPublicData, sensitiveData);
      }
      
    } catch (error) {
      console.error('Erro ao recuperar dados seguros:', error);
      throw new Error(`Falha ao recuperar dados: ${error.message}`);
    }
  }

  /**
   * Remove flags internos de dados seguros
   */
  static cleanSecureFlags(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.cleanSecureFlags(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const cleaned = { ...data };
      delete cleaned._hasSecureData;
      delete cleaned._secureDataIndex;
      return cleaned;
    }
    
    return data;
  }

  /**
   * Remove dados tanto do AsyncStorage quanto do SecureStore
   */
  static async removeItem(key) {
    try {
      await Promise.all([
        AsyncStorage.removeItem(key),
        SecureStore.deleteItemAsync(`${key}_secure`).catch(() => {
          // Ignora erro se a chave não existir no SecureStore
        })
      ]);
    } catch (error) {
      console.error('Erro ao remover dados seguros:', error);
      throw new Error(`Falha ao remover dados: ${error.message}`);
    }
  }

  /**
   * Migra dados existentes do AsyncStorage para o armazenamento seguro
   */
  static async migrateExistingData(key) {
    try {
      console.log(`Iniciando migração para chave: ${key}`);
      
      // Verifica se já existe dados no formato seguro
      const existingPublicData = await AsyncStorage.getItem(key);
      if (existingPublicData) {
        const parsed = JSON.parse(existingPublicData);
        const hasSecureData = Array.isArray(parsed) 
          ? parsed.some(item => item && item._hasSecureData)
          : parsed && parsed._hasSecureData;
          
        if (hasSecureData) {
          console.log(`Dados já migrados para chave: ${key}`);
          return false; // Já migrado
        }
      }

      // Recupera dados não migrados
      const oldDataStr = await AsyncStorage.getItem(key);
      if (!oldDataStr) {
        console.log(`Nenhum dado encontrado para migrar na chave: ${key}`);
        return false;
      }

      const oldData = JSON.parse(oldDataStr);
      
      // Se não há dados sensíveis, não precisa migrar
      if (!this.hasSensitiveData(oldData)) {
        console.log(`Nenhum dado sensível encontrado na chave: ${key}`);
        return false;
      }

      console.log(`Migrando dados sensíveis para chave: ${key}`);
      
      // Salva usando o novo formato seguro
      await this.setItem(key, oldData);
      
      console.log(`Migração concluída para chave: ${key}`);
      return true;
      
    } catch (error) {
      console.error('Erro na migração de dados:', error);
      throw new Error(`Falha na migração: ${error.message}`);
    }
  }

  /**
   * Migra todas as chaves conhecidas com dados sensíveis
   */
  static async migrateAllSensitiveData() {
    const keysToMigrate = [
      'userClients',
      'userServices', 
      'serviceTemplates'
    ];

    const migrationResults = [];
    
    for (const key of keysToMigrate) {
      try {
        const migrated = await this.migrateExistingData(key);
        migrationResults.push({ key, migrated, success: true });
      } catch (error) {
        console.error(`Erro ao migrar ${key}:`, error);
        migrationResults.push({ key, migrated: false, success: false, error: error.message });
      }
    }

    return migrationResults;
  }
}

export default SecureStorage;