// Modal de detalhes e edição do equipamento - Trampay
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, spacing } from '../styles';

const EquipmentDetailsModal = ({ visible, onClose, equipment, onEdit, services }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    purchasePrice: '',
    value: '',
    attachedService: '',
    serviceId: '',
    photo: null,
    maintenanceDates: ['']
  });
  const [errors, setErrors] = useState({});
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Carregar dados do equipamento quando o modal abre
  useEffect(() => {
    if (equipment) {
      // Converter datas de manutenção para DD/MM/AA para exibição
      const displayMaintenanceDates = equipment.maintenanceDates ? 
        equipment.maintenanceDates.map(dateStr => {
          try {
            // Se já está em formato DD/MM/AA, usar diretamente
            if (dateStr.includes('/') && dateStr.length <= 8) {
              return dateStr;
            }
            
            // Se é ISO (YYYY-MM-DD), converter para DD/MM/AA
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear().toString().slice(-2);
              return `${day}/${month}/${year}`;
            }
            
            return dateStr; // Retornar como está se não conseguir converter
          } catch (error) {
            console.error('Erro ao converter data:', dateStr, error);
            return dateStr;
          }
        }) : [''];

      setFormData({
        name: equipment.name,
        quantity: equipment.quantity,
        purchasePrice: equipment.purchasePrice?.toString() || '',
        value: equipment.value?.toString() || '',
        attachedService: equipment.attachedService || '',
        serviceId: equipment.serviceId || '',
        photo: equipment.photo || null,
        maintenanceDates: displayMaintenanceDates.length > 0 ? displayMaintenanceDates : ['']
      });
      setIsEditing(false);
    }
  }, [equipment]);

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

  // Função para ajustar quantidade
  const adjustQuantity = (increment) => {
    const newQuantity = Math.max(0, formData.quantity + increment);
    updateFormData('quantity', newQuantity);
  };

  // Função para selecionar serviço
  const selectService = (service) => {
    updateFormData('attachedService', service.name);
    updateFormData('serviceId', service.id);
    setShowServiceDropdown(false);
  };

  // Função para selecionar foto
  const pickImage = async () => {
    if (!isEditing) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'É necessário permitir o acesso à galeria de fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateFormData('photo', result.assets[0]);
    }
  };

  // Função para formatar data de manutenção
  const formatMaintenanceDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    
    let formatted = '';
    if (cleaned.length <= 2) {
      formatted = cleaned;
    } else if (cleaned.length <= 4) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    } else {
      formatted = cleaned.substring(0, 2) + '/' + 
                  cleaned.substring(2, 4) + '/' + 
                  cleaned.substring(4, 6);
    }
    
    return formatted;
  };

  // Função para atualizar data de manutenção específica
  const updateMaintenanceDate = (index, value) => {
    const newDates = [...formData.maintenanceDates];
    newDates[index] = formatMaintenanceDate(value);
    updateFormData('maintenanceDates', newDates);
  };

  // Função para adicionar nova data de manutenção
  const addMaintenanceDate = () => {
    const newDates = [...formData.maintenanceDates, ''];
    updateFormData('maintenanceDates', newDates);
  };

  // Função para remover data de manutenção
  const removeMaintenanceDate = (index) => {
    if (formData.maintenanceDates.length > 1) {
      const newDates = formData.maintenanceDates.filter((_, i) => i !== index);
      updateFormData('maintenanceDates', newDates);
    }
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.purchasePrice.trim()) {
      newErrors.purchasePrice = 'Preço de compra é obrigatório';
    } else if (isNaN(parseFloat(formData.purchasePrice))) {
      newErrors.purchasePrice = 'Preço deve ser um número válido';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Valor do item é obrigatório';
    } else if (isNaN(parseFloat(formData.value))) {
      newErrors.value = 'Valor deve ser um número válido';
    }

    if (!formData.attachedService.trim()) {
      newErrors.attachedService = 'Serviço é obrigatório';
    }

    // Validar datas de manutenção
    const validDates = formData.maintenanceDates.filter(date => date.trim() !== '');
    if (validDates.length === 0) {
      newErrors.maintenanceDates = 'Pelo menos uma data de manutenção é obrigatória';
    } else {
      // Validar formato das datas
      const dateRegex = /^\d{2}\/\d{2}\/\d{2}$/;
      const invalidDates = validDates.filter(date => !dateRegex.test(date));
      if (invalidDates.length > 0) {
        newErrors.maintenanceDates = 'Data de manutenção inválida (DD/MM/AA)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para adicionar registro de uso
  const addUsageRecord = (description, clientName = '') => {
    const usageRecord = {
      date: new Date().toISOString(),
      description: description || 'Uso manual do equipamento',
      serviceName: formData.attachedService,
      clientName
    };

    const updatedUsageHistory = [...(equipment.usageHistory || []), usageRecord];

    const updatedEquipment = {
      ...equipment,
      usageHistory: updatedUsageHistory
    };

    onEdit(updatedEquipment);
  };

  // Função para salvar edição
  const handleSave = () => {
    if (!validateForm()) return;

    // Converter datas de manutenção para formato ISO
    const validMaintenanceDates = formData.maintenanceDates
      .filter(date => date.trim() !== '')
      .map(date => {
        const [day, month, year] = date.split('/');
        return `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      });

    const updatedEquipment = {
      ...equipment,
      ...formData,
      purchasePrice: parseFloat(formData.purchasePrice),
      value: parseFloat(formData.value),
      maintenanceDates: validMaintenanceDates
    };

    onEdit(updatedEquipment);
    setIsEditing(false);
  };

  // Função para cancelar edição
  const handleCancel = () => {
    // Restaurar dados originais usando a mesma lógica do useEffect
    const displayMaintenanceDates = equipment.maintenanceDates ? 
      equipment.maintenanceDates.map(dateStr => {
        try {
          // Se já está em formato DD/MM/AA, usar diretamente
          if (dateStr.includes('/') && dateStr.length <= 8) {
            return dateStr;
          }
          
          // Se é ISO (YYYY-MM-DD), converter para DD/MM/AA
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear().toString().slice(-2);
            return `${day}/${month}/${year}`;
          }
          
          return dateStr; // Retornar como está se não conseguir converter
        } catch (error) {
          console.error('Erro ao converter data:', dateStr, error);
          return dateStr;
        }
      }) : [''];

    setFormData({
      name: equipment.name,
      quantity: equipment.quantity,
      purchasePrice: equipment.purchasePrice?.toString() || '',
      value: equipment.value?.toString() || '',
      attachedService: equipment.attachedService || '',
      serviceId: equipment.serviceId || '',
      photo: equipment.photo || null,
      maintenanceDates: displayMaintenanceDates.length > 0 ? displayMaintenanceDates : ['']
    });
    setErrors({});
    setIsEditing(false);
  };

  // Gerar histórico de uso baseado nos dados reais do equipamento
  const generateUsageHistory = () => {
    if (!equipment || !equipment.usageHistory) {
      return { thisWeek: [], future: [] };
    }
    
    const today = new Date();
    const weekStart = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const weekEnd = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    const thisWeek = [];
    const future = [];
    
    // Processar histórico real se existir
    equipment.usageHistory.forEach(usage => {
      try {
        const usageDate = new Date(usage.date);
        const formattedDate = usageDate.toLocaleDateString('pt-BR');
        const dayName = usageDate.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
        
        const historyItem = {
          service: usage.description || usage.serviceName || 'Uso do equipamento',
          date: formattedDate,
          day: dayName,
          client: usage.clientName || ''
        };
        
        if (usageDate >= weekStart && usageDate <= today) {
          thisWeek.push(historyItem);
        } else if (usageDate > today && usageDate <= weekEnd) {
          future.push(historyItem);
        }
      } catch (error) {
        console.error('Erro ao processar histórico de uso:', usage, error);
      }
    });
    
    // Se não há histórico real, mostrar mensagem informativa
    if (thisWeek.length === 0 && future.length === 0) {
      thisWeek.push({
        service: 'Nenhum uso registrado ainda',
        date: today.toLocaleDateString('pt-BR'),
        day: today.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(),
        client: ''
      });
    }

    return { thisWeek, future };
  };

  const usageHistory = generateUsageHistory();

  if (!equipment) return null;

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
            <MaterialIcons name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Detalhes do Equipamento</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <Text style={styles.equipmentTitle}>Equipamento "{equipment.name}"</Text>

          {/* Nome */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
              />
            ) : (
              <View style={styles.displayField}>
                <Text style={styles.displayText}>{formData.name}</Text>
              </View>
            )}
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Quantidade */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Quantidade:</Text>
            {isEditing ? (
              <View style={styles.quantityContainer}>
                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{formData.quantity}</Text>
                </View>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => adjustQuantity(1)}
                >
                  <MaterialIcons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => adjustQuantity(-1)}
                >
                  <MaterialIcons name="remove" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.quantityContainer}>
                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{formData.quantity}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Preço de Compra */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preço de Compra:</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, errors.purchasePrice && styles.inputError]}
                placeholder="R$ 0,00"
                value={formData.purchasePrice}
                onChangeText={(text) => updateFormData('purchasePrice', text)}
                keyboardType="numeric"
              />
            ) : (
              <View style={styles.displayField}>
                <Text style={styles.displayText}>R$ {formData.purchasePrice || '0,00'}</Text>
              </View>
            )}
            {errors.purchasePrice && <Text style={styles.errorText}>{errors.purchasePrice}</Text>}
          </View>

          {/* Valor do Item */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Valor do Item:</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, errors.value && styles.inputError]}
                placeholder="R$ 0,00"
                value={formData.value}
                onChangeText={(text) => updateFormData('value', text)}
                keyboardType="numeric"
              />
            ) : (
              <View style={styles.displayField}>
                <Text style={styles.displayText}>R$ {formData.value || '0,00'}</Text>
              </View>
            )}
            {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}
          </View>

          {/* Serviço Atrelado */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Serviço Atrelado:</Text>
            {isEditing ? (
              <>
                <TouchableOpacity 
                  style={[styles.dropdown, errors.attachedService && styles.inputError]}
                  onPress={() => setShowServiceDropdown(!showServiceDropdown)}
                >
                  <Text style={[styles.dropdownText, !formData.attachedService && styles.placeholder]}>
                    {formData.attachedService || 'Selecionar'}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.white} />
                </TouchableOpacity>
                
                {showServiceDropdown && (
                  <View style={styles.dropdownList}>
                    {services.length > 0 ? services.map((service) => (
                      <TouchableOpacity
                        key={service.id}
                        style={styles.dropdownItem}
                        onPress={() => selectService(service)}
                      >
                        <Text style={styles.dropdownItemText}>{service.name}</Text>
                      </TouchableOpacity>
                    )) : (
                      <TouchableOpacity style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText}>Nenhum serviço cadastrado</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {errors.attachedService && <Text style={styles.errorText}>{errors.attachedService}</Text>}
              </>
            ) : (
              <View style={styles.dropdown}>
                <Text style={styles.dropdownText}>
                  {formData.attachedService || 'Nenhum serviço selecionado'}
                </Text>
              </View>
            )}
          </View>

          {/* Datas de Manutenção */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Datas de Manutenção:</Text>
            {isEditing ? (
              <>
                {formData.maintenanceDates.map((date, index) => (
                  <View key={index} style={styles.maintenanceRow}>
                    <View style={styles.maintenanceDateContainer}>
                      <TextInput
                        style={[styles.maintenanceDateInput, errors.maintenanceDates && styles.inputError]}
                        placeholder="DD/MM/AA"
                        value={date}
                        onChangeText={(text) => updateMaintenanceDate(index, text)}
                        keyboardType="numeric"
                        maxLength={8}
                      />
                    </View>
                    <View style={styles.maintenanceActions}>
                      <TouchableOpacity
                        style={styles.maintenanceButton}
                        onPress={addMaintenanceDate}
                      >
                        <MaterialIcons name="add" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      {formData.maintenanceDates.length > 1 && (
                        <TouchableOpacity
                          style={styles.maintenanceButton}
                          onPress={() => removeMaintenanceDate(index)}
                        >
                          <MaterialIcons name="remove" size={20} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                {errors.maintenanceDates && <Text style={styles.errorText}>{errors.maintenanceDates}</Text>}
              </>
            ) : (
              <View style={styles.maintenanceDatesDisplay}>
                {formData.maintenanceDates.filter(date => date.trim()).map((date, index) => (
                  <View key={index} style={styles.maintenanceDateChip}>
                    <Text style={styles.maintenanceDateText}>{date}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Foto do equipamento */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Foto do equipamento:</Text>
            <TouchableOpacity 
              style={[styles.photoContainer, !isEditing && styles.photoDisabled]}
              onPress={pickImage}
            >
              {formData.photo ? (
                <Image source={{ uri: formData.photo.uri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <MaterialIcons name="add-a-photo" size={32} color={colors.primaryDark} />
                  <MaterialIcons name="file-download" size={16} color={colors.primaryDark} style={styles.downloadIcon} />
                </View>
              )}
            </TouchableOpacity>
            
            {isEditing && (
              <TouchableOpacity style={styles.editPhotoButton}>
                <Text style={styles.editPhotoText}>Editar</Text>
                <MaterialIcons name="edit" size={16} color={colors.primaryDark} />
              </TouchableOpacity>
            )}
          </View>

          {/* ID do equipamento */}
          <View style={styles.idContainer}>
            <Text style={styles.idLabel}>Código ID do equipamento: {equipment.id}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Concluído</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editButtonText}>Editar Equipamento</Text>
                  <MaterialIcons name="edit" size={16} color={colors.textDark} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.useButton}
                  onPress={() => {
                    Alert.alert(
                      'Registrar Uso',
                      `Registrar uso do equipamento "${equipment.name}"?`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { 
                          text: 'Confirmar',
                          onPress: () => addUsageRecord(`Uso de ${equipment.name}`)
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.useButtonText}>Registrar Uso</Text>
                  <MaterialIcons name="build-circle" size={16} color={colors.white} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Usage History */}
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Histórico de uso deste equipamento:</Text>
            
            {/* This Week */}
            <View style={styles.historyGroup}>
              <Text style={styles.historyGroupTitle}>Essa Semana</Text>
              {usageHistory.thisWeek.map((usage, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyText}>
                    {usage.service}   Dia {usage.date} - {usage.day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Future */}
            <View style={styles.historyGroup}>
              <Text style={styles.historyGroupTitle}>Futuros</Text>
              {usageHistory.future.map((usage, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyText}>
                    {usage.service}   Dia {usage.date} - {usage.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  equipmentTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: colors.border,
  },
  displayField: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  displayText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textDark,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityDisplay: {
    backgroundColor: colors.primaryDark,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 60,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  quantityText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  quantityButton: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.sm,
    marginLeft: spacing.xs,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.white,
  },
  placeholder: {
    color: colors.textLight,
  },
  dropdownList: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginTop: spacing.xs,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textDark,
  },
  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  maintenanceDateContainer: {
    flex: 1,
  },
  maintenanceDateInput: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.white,
    textAlign: 'center',
  },
  maintenanceActions: {
    flexDirection: 'row',
    marginLeft: spacing.sm,
  },
  maintenanceButton: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.sm,
    marginLeft: spacing.xs,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  maintenanceDatesDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  maintenanceDateChip: {
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  maintenanceDateText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  photoContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  photoDisabled: {
    opacity: 0.7,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadIcon: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 8,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  editPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  editPhotoText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primaryDark,
    marginRight: spacing.xs,
  },
  idContainer: {
    marginBottom: spacing.lg,
  },
  idLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textLight,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginRight: spacing.xs,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  useButton: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  useButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginRight: spacing.xs,
  },
  historySection: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  historyTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  historyGroup: {
    marginBottom: spacing.lg,
  },
  historyGroupTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  historyItem: {
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  historyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textDark,
  },
});

export default EquipmentDetailsModal;