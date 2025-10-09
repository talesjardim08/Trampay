// Modal para adicionar item do estoque - Trampay
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

const AddStockItemModal = ({ visible, onClose, onAdd, services }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    costPrice: '',
    attachedService: '',
    serviceId: '',
    photo: null
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

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.costPrice.trim()) {
      newErrors.costPrice = 'Preço de custo é obrigatório';
    } else if (isNaN(parseFloat(formData.costPrice))) {
      newErrors.costPrice = 'Preço deve ser um número válido';
    }

    if (!formData.attachedService.trim()) {
      newErrors.attachedService = 'Serviço é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para adicionar item
  const handleAdd = () => {
    if (!validateForm()) return;

    const itemData = {
      ...formData,
      costPrice: parseFloat(formData.costPrice)
    };

    onAdd(itemData);
    
    // Reset form
    setFormData({
      name: '',
      quantity: 0,
      costPrice: '',
      attachedService: '',
      serviceId: '',
      photo: null
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
          
          <Text style={styles.headerTitle}>Adicionar novo Item</Text>
          
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

          {/* Preço de Custo */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preço de Custo:</Text>
            <TextInput
              style={[styles.input, errors.costPrice && styles.inputError]}
              placeholder="R$ 0,00"
              value={formData.costPrice}
              onChangeText={(text) => updateFormData('costPrice', text)}
              keyboardType="numeric"
            />
            {errors.costPrice && <Text style={styles.errorText}>{errors.costPrice}</Text>}
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

export default AddStockItemModal;