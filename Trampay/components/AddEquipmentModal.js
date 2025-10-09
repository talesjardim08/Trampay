// Modal para adicionar equipamento - Trampay
import React, { useState } from 'react';
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

const AddEquipmentModal = ({ visible, onClose, onAdd, services }) => {
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

  // Função para adicionar equipamento
  const handleAdd = () => {
    if (!validateForm()) return;

    // Converter datas de manutenção para formato ISO
    const validMaintenanceDates = formData.maintenanceDates
      .filter(date => date.trim() !== '')
      .map(date => {
        const [day, month, year] = date.split('/');
        return `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      });

    const equipmentData = {
      ...formData,
      purchasePrice: parseFloat(formData.purchasePrice),
      value: parseFloat(formData.value),
      maintenanceDates: validMaintenanceDates
    };

    onAdd(equipmentData);
    
    // Reset form
    setFormData({
      name: '',
      quantity: 0,
      purchasePrice: '',
      value: '',
      attachedService: '',
      serviceId: '',
      photo: null,
      maintenanceDates: ['']
    });
    setErrors({});
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
            <MaterialIcons name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Adicionar novo Equipamento</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Nome do objeto */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome do objeto:</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder=""
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Quantidade */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Quantidade:</Text>
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
          </View>

          {/* Serviço Atrelado */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Serviço Atrelado:</Text>
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
          </View>

          {/* Foto do item */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Foto do(s) item(s):</Text>
            <TouchableOpacity 
              style={styles.photoContainer}
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
          </View>

          {/* Valor do item */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Valor do item (R$):</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefix, errors.value && styles.inputError]}
              placeholder="0,00"
              value={formData.value}
              onChangeText={(text) => updateFormData('value', text)}
              keyboardType="numeric"
            />
            <Text style={styles.inputPrefix}>R$</Text>
            {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}
          </View>

          {/* Preço de Compra */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preço de Compra (R$):</Text>
            <TextInput
              style={[styles.input, errors.purchasePrice && styles.inputError]}
              placeholder="R$ 0,00"
              value={formData.purchasePrice}
              onChangeText={(text) => updateFormData('purchasePrice', text)}
              keyboardType="numeric"
            />
            {errors.purchasePrice && <Text style={styles.errorText}>{errors.purchasePrice}</Text>}
          </View>

          {/* Manutenção */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Manutenção</Text>
            {formData.maintenanceDates.map((date, index) => (
              <View key={index} style={styles.maintenanceRow}>
                <View style={styles.maintenanceDateContainer}>
                  <Text style={styles.maintenanceDateLabel}>Data:</Text>
                  <TextInput
                    style={[styles.maintenanceDateInput, errors.maintenanceDates && styles.inputError]}
                    placeholder="00/00/00"
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
          </View>
        </ScrollView>

        {/* Add Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
          >
            <Text style={styles.addButtonText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
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
  inputContainer: {
    marginBottom: spacing.lg,
    position: 'relative',
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
  inputWithPrefix: {
    paddingLeft: 35,
  },
  inputPrefix: {
    position: 'absolute',
    left: spacing.md,
    top: 32,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textLight,
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
  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  maintenanceDateContainer: {
    flex: 1,
  },
  maintenanceDateLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textDark,
    marginBottom: spacing.xs,
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
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
});

export default AddEquipmentModal;