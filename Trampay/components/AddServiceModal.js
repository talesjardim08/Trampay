// Modal para adicionar novo serviço - Trampay
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';

const AddServiceModal = ({ visible, onClose, onAdd, clients, serviceTemplates }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    clientName: '',
    clientId: '',
    serviceName: '',
    description: '',
    price: '',
    equipment: '',
    stock: ''
  });
  const [errors, setErrors] = useState({});
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  // Função para atualizar dados do formulário
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Remove erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Função para converter DD/MM/YYYY para YYYY-MM-DD
  const convertDateToISO = (dateStr) => {
    if (!dateStr || dateStr.length !== 10) return null;
    
    const [day, month, year] = dateStr.split('/');
    if (!day || !month || !year) return null;
    
    // Validar se a data é válida
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() != year || date.getMonth() !== month - 1 || date.getDate() != day) {
      return null;
    }
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.date.trim()) {
      newErrors.date = 'Data é obrigatória';
    } else {
      const isoDate = convertDateToISO(formData.date);
      if (!isoDate) {
        newErrors.date = 'Data inválida';
      } else {
        // Verificar se a data não é no passado
        const today = new Date();
        const serviceDate = new Date(isoDate);
        today.setHours(0, 0, 0, 0);
        serviceDate.setHours(0, 0, 0, 0);
        
        if (serviceDate < today) {
          newErrors.date = 'Data não pode ser no passado';
        }
      }
    }

    if (!formData.time.trim()) {
      newErrors.time = 'Horário é obrigatório';
    } else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.time)) {
        newErrors.time = 'Horário inválido';
      }
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Cliente é obrigatório';
    }

    if (!formData.serviceName.trim()) {
      newErrors.serviceName = 'Serviço é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para adicionar serviço
  const handleAdd = () => {
    if (!validateForm()) return;

    // Converter a data para o formato ISO antes de salvar
    const isoDate = convertDateToISO(formData.date);
    
    const serviceDataWithISODate = {
      ...formData,
      date: isoDate // Salvar no formato YYYY-MM-DD
    };

    onAdd(serviceDataWithISODate);
    
    // Reset form
    setFormData({
      date: '',
      time: '',
      clientName: '',
      clientId: '',
      serviceName: '',
      description: '',
      price: '',
      equipment: '',
      stock: ''
    });
    setErrors({});
  };

  // Função para selecionar cliente
  const selectClient = (client) => {
    updateFormData('clientName', client.name);
    updateFormData('clientId', client.id);
    setShowClientDropdown(false);
  };

  // Função para selecionar serviço do template
  const selectService = (template) => {
    updateFormData('serviceName', template.name);
    updateFormData('description', template.serviceDescription || template.description || '');
    updateFormData('price', template.defaultPrice ? template.defaultPrice.toString() : '');
    updateFormData('equipment', template.requiredProducts || '');
    updateFormData('stock', template.requiredProducts || '');
    setShowServiceDropdown(false);
  };

  // Função para formatar data
  const formatDate = (text) => {
    // Remove tudo que não é número
    const cleaned = text.replace(/\D/g, '');
    
    // Limita a 8 dígitos (DDMMYYYY)
    const limited = cleaned.substring(0, 8);
    
    let formatted = '';
    
    if (limited.length <= 2) {
      formatted = limited;
    } else if (limited.length <= 4) {
      formatted = limited.substring(0, 2) + '/' + limited.substring(2);
    } else {
      formatted = limited.substring(0, 2) + '/' + 
                  limited.substring(2, 4) + '/' + 
                  limited.substring(4);
    }
    
    return formatted;
  };

  // Função para formatar hora
  const formatTime = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + ':' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Adicionar novo serviço</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Data */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Data:</Text>
            <TextInput
              style={[styles.input, errors.date && styles.inputError]}
              placeholder="00/00/0000"
              value={formData.date}
              onChangeText={(text) => updateFormData('date', formatDate(text))}
              keyboardType="numeric"
              maxLength={10}
            />
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          {/* Horário */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Horário:</Text>
            <TextInput
              style={[styles.input, errors.time && styles.inputError]}
              placeholder="00:00"
              value={formData.time}
              onChangeText={(text) => updateFormData('time', formatTime(text))}
              keyboardType="numeric"
              maxLength={5}
            />
            {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
          </View>

          {/* Cliente */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cliente:</Text>
            <TouchableOpacity 
              style={[styles.dropdown, errors.clientName && styles.inputError]}
              onPress={() => setShowClientDropdown(!showClientDropdown)}
            >
              <Text style={[styles.dropdownText, !formData.clientName && styles.placeholder]}>
                {formData.clientName || 'Selecionar'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.textLight} />
            </TouchableOpacity>
            
            {showClientDropdown && (
              <View style={styles.dropdownList}>
                {clients.length > 0 ? clients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={styles.dropdownItem}
                    onPress={() => selectClient(client)}
                  >
                    <Text style={styles.dropdownItemText}>{client.name}</Text>
                  </TouchableOpacity>
                )) : (
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>Nenhum cliente cadastrado</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {errors.clientName && <Text style={styles.errorText}>{errors.clientName}</Text>}
          </View>

          {/* Serviço */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Serviço:</Text>
            <TouchableOpacity 
              style={[styles.dropdown, errors.serviceName && styles.inputError]}
              onPress={() => setShowServiceDropdown(!showServiceDropdown)}
            >
              <Text style={[styles.dropdownText, !formData.serviceName && styles.placeholder]}>
                {formData.serviceName || 'Selecionar'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.textLight} />
            </TouchableOpacity>
            
            {showServiceDropdown && (
              <View style={styles.dropdownList}>
                {serviceTemplates.length > 0 ? serviceTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={styles.dropdownItem}
                    onPress={() => selectService(template)}
                  >
                    <Text style={styles.dropdownItemText}>{template.name}</Text>
                    <Text style={styles.dropdownItemSubtext}>R$ {template.defaultPrice || '0,00'}</Text>
                  </TouchableOpacity>
                )) : (
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>Nenhum serviço cadastrado</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {errors.serviceName && <Text style={styles.errorText}>{errors.serviceName}</Text>}
          </View>

          {/* Campos adicionais se houver serviço selecionado */}
          {formData.serviceName && (
            <>
              {/* Descrição */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Descrição:</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Detalhes do serviço..."
                  value={formData.description}
                  onChangeText={(text) => updateFormData('description', text)}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Preço */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Preço:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0,00"
                  value={formData.price}
                  onChangeText={(text) => updateFormData('price', text)}
                  keyboardType="numeric"
                />
              </View>

              {/* Equipamento */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Equipamento:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Equipamentos necessários..."
                  value={formData.equipment}
                  onChangeText={(text) => updateFormData('equipment', text)}
                />
              </View>

              {/* Estoque */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Produtos do estoque:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Produtos utilizados..."
                  value={formData.stock}
                  onChangeText={(text) => updateFormData('stock', text)}
                />
              </View>
            </>
          )}

          {/* Botão Adicionar */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
          >
            <Text style={styles.addButtonText}>Adicionar</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  backButton: {
    padding: spacing.sm,
    borderRadius: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    textAlign: 'center',
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  inputContainer: {
    marginBottom: spacing.lg,
    position: 'relative',
  },

  label: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },

  input: {
    height: 50,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },

  textArea: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.lightGray,
    textAlignVertical: 'top',
    minHeight: 80,
  },

  dropdown: {
    height: 50,
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropdownText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.white,
  },

  placeholder: {
    color: colors.lightGray,
  },

  dropdownList: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 200,
    zIndex: 1000,
  },

  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  dropdownItemText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  dropdownItemSubtext: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: 2,
  },

  inputError: {
    borderColor: colors.error,
    backgroundColor: '#fff5f5',
  },

  errorText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },

  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  addButtonText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
  },

  bottomSpacer: {
    height: spacing.xl,
  },
});

export default AddServiceModal;