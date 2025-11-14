// Tela de Gestão de Equipamentos - Trampay
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../services/api';
import { listServices } from '../ServicesService';
import { colors, fonts, spacing } from '../styles';
import AddEquipmentModal from '../components/AddEquipmentModal';
import EquipmentDetailsModal from '../components/EquipmentDetailsModal';

const EquipmentsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [equipments, setEquipments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);

  useEffect(() => {
    loadEquipments();
    loadServicesSafe();
  }, []);

  const loadServicesSafe = async () => {
    try {
      const data = await listServices();
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setServices(items.map(s => ({ id: s.id, name: s.name || s.title || `Serviço ${s.id}` })));
    } catch (error) {
      console.error('Erro ao carregar serviços (EquipmentsScreen):', error);
      setServices([]);
    }
  };

  const loadEquipments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/equipment');
      const rawItems = response.data.items || [];
      
      const normalizedEquipments = rawItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        category: item.category || 'Equipamento',
        purchaseDate: item.purchase_date || '',
        purchasePrice: item.purchase_price || 0,
        status: item.status || 'active',
        photoUrl: item.photo_url || '',
        createdAt: item.created_at
      }));
      
      setEquipments(normalizedEquipments);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os equipamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = async (equipmentData) => {
    try {
      const payload = {
        name: equipmentData.name,
        description: equipmentData.description || '',
        category: equipmentData.category || 'Equipamento',
        purchaseDate: equipmentData.purchaseDate || null,
        purchasePrice: parseFloat(equipmentData.purchasePrice) || 0,
        status: equipmentData.status || 'active',
        photoUrl: equipmentData.photoUrl || null
      };
      
      await api.post('/equipment', payload);
      await loadEquipments();
      setAddModalVisible(false);
    } catch (error) {
      console.error('Erro ao adicionar equipamento:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o equipamento');
    }
  };

  const handleEditEquipment = async (equipmentData) => {
    try {
      const payload = {
        name: equipmentData.name,
        description: equipmentData.description || '',
        category: equipmentData.category || 'Equipamento',
        purchaseDate: equipmentData.purchaseDate,
        purchasePrice: parseFloat(equipmentData.purchasePrice) || 0,
        status: equipmentData.status || 'active',
        photoUrl: equipmentData.photoUrl
      };
      
      await api.put(`/equipment/${equipmentData.id}`, payload);
      await loadEquipments();
      setDetailsModalVisible(false);
      setSelectedEquipment(null);
    } catch (error) {
      console.error('Erro ao editar equipamento:', error);
      Alert.alert('Erro', 'Não foi possível editar o equipamento');
    }
  };

  const handleDeleteEquipment = (equipment) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir o equipamento "${equipment.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/equipment/${equipment.id}`);
              await loadEquipments();
            } catch (error) {
              console.error('Erro ao deletar equipamento:', error);
              Alert.alert('Erro', 'Não foi possível deletar o equipamento');
            }
          }
        }
      ]
    );
  };

  // Abrir detalhes do equipamento
  const openEquipmentDetails = (equipment) => {
    setSelectedEquipment(equipment);
    setDetailsModalVisible(true);
  };

  // Filtrar equipamentos pela pesquisa
  const filteredEquipments = equipments.filter(equipment =>
    equipment.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Verificar equipamentos com manutenção próxima (30 dias)
  const getEquipmentsNeedingMaintenance = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    return equipments.filter(equipment => {
      if (!equipment.maintenanceDates || equipment.maintenanceDates.length === 0) return false;
      
      return equipment.maintenanceDates.some(dateStr => {
        try {
          // Tentar como data ISO primeiro
          let maintenanceDate = new Date(dateStr);
          
          // Se inválida, tentar parser DD/MM/AA
          if (isNaN(maintenanceDate.getTime())) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const [day, month, year] = parts;
              const fullYear = year.length === 2 ? `20${year}` : year;
              maintenanceDate = new Date(fullYear, month - 1, day);
            }
          }
          
          return !isNaN(maintenanceDate.getTime()) && 
                 maintenanceDate <= thirtyDaysFromNow && 
                 maintenanceDate >= today;
        } catch (error) {
          console.error('Erro ao parsing data de manutenção:', dateStr, error);
          return false;
        }
      });
    });
  };

  const equipmentsNeedingMaintenance = getEquipmentsNeedingMaintenance();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Equipamentos</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Workflow Bar */}
      <View style={styles.workflowBar}>
        <TouchableOpacity
          style={[styles.workflowTab, activeTab === 'list' && styles.workflowTabActive]}
          onPress={() => setActiveTab('list')}
        >
          <MaterialIcons 
            name="build" 
            size={20} 
            color={activeTab === 'list' ? colors.primaryDark : colors.white} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.workflowTab, activeTab === 'settings' && styles.workflowTabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <MaterialIcons 
            name="settings" 
            size={20} 
            color={activeTab === 'settings' ? colors.primaryDark : colors.white} 
          />
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'list' ? (
        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquise aqui"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <MaterialIcons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
          </View>

          {/* Maintenance Alert */}
          {equipmentsNeedingMaintenance.length > 0 && (
            <View style={styles.alertContainer}>
              <MaterialIcons name="build-circle" size={20} color={colors.warning} />
              <Text style={styles.alertText}>
                {equipmentsNeedingMaintenance.length} equipamento(s) precisam de manutenção
              </Text>
            </View>
          )}

          {/* Equipments List */}
          <ScrollView style={styles.equipmentsList} showsVerticalScrollIndicator={false}>
            {filteredEquipments.map((equipment) => {
              const needsMaintenance = equipmentsNeedingMaintenance.some(e => e.id === equipment.id);
              
              return (
                <TouchableOpacity
                  key={equipment.id}
                  style={[
                    styles.equipmentItem,
                    needsMaintenance && styles.equipmentItemMaintenance
                  ]}
                  onPress={() => openEquipmentDetails(equipment)}
                >
                  <MaterialIcons 
                    name="build" 
                    size={24} 
                    color={needsMaintenance ? colors.warning : colors.primaryDark} 
                  />
                  <View style={styles.equipmentItemInfo}>
                    <Text style={styles.equipmentItemName}>{equipment.name}</Text>
                    <Text style={styles.equipmentItemValue}>
                      Valor: R$ {equipment.value ? equipment.value.toFixed(2) : '0,00'}
                      {needsMaintenance && ' ⚠️'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteEquipment(equipment)}
                  >
                    <MaterialIcons name="delete" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}

            {filteredEquipments.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialIcons name="build" size={48} color={colors.textLight} />
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento cadastrado'}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Add Equipment Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Novo Equipamento</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Settings Tab Content
        <View style={styles.settingsContent}>
          <View style={styles.settingsCard}>
            <MaterialIcons name="build" size={24} color={colors.primaryDark} />
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsTitle}>Total de Equipamentos</Text>
              <Text style={styles.settingsValue}>{equipments.length}</Text>
            </View>
          </View>

          <View style={styles.settingsCard}>
            <MaterialIcons name="build-circle" size={24} color={colors.warning} />
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsTitle}>Precisam de Manutenção</Text>
              <Text style={styles.settingsValue}>{equipmentsNeedingMaintenance.length}</Text>
            </View>
          </View>

          <View style={styles.settingsCard}>
            <MaterialIcons name="attach-money" size={24} color={colors.success} />
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsTitle}>Valor Total dos Equipamentos</Text>
              <Text style={styles.settingsValue}>
                R$ {equipments.reduce((total, equipment) => total + (equipment.value || 0), 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Modals */}
      <AddEquipmentModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddEquipment}
        services={services || []}
      />

      <EquipmentDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        equipment={selectedEquipment}
        onEdit={handleEditEquipment}
        services={services || []}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: 'center',
    marginRight: 32,
  },
  headerSpacer: {
    width: 32,
  },
  workflowBar: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 25,
    padding: 4,
  },
  workflowTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 21,
  },
  workflowTabActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingRight: 40,
    fontSize: 16,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.sm + 2,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  alertText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.warning,
  },
  equipmentsList: {
    flex: 1,
    marginBottom: spacing.md,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipmentItemMaintenance: {
    borderColor: colors.warning,
    backgroundColor: colors.warningLight,
  },
  equipmentItemInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  equipmentItemName: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  equipmentItemValue: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: spacing.md,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  settingsContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsInfo: {
    marginLeft: spacing.md,
  },
  settingsTitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
  settingsValue: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginTop: 2,
  },
});

export default EquipmentsScreen;
