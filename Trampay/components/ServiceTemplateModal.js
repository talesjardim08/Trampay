// Modal para criar templates de serviços - Trampay
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

const ServiceTemplateModal = ({ visible, onClose, onAdd, clients = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultPrice: '',
    estimatedDuration: '',
    requiredProducts: '',
    defaultQuantity: '',
    serviceDescription: '',
    isHandled: false,
    selectedClients: []
  });
  const [errors, setErrors] = useState({});
  const [showClientDropdown, setShowClientDropdown] = useState(false);

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

  // Função para toggle de seleção de cliente
  const toggleClientSelection = (clientId) => {
    setFormData(prev => {
      const currentSelected = prev.selectedClients || [];
      const isSelected = currentSelected.includes(clientId);
      
      const newSelectedClients = isSelected
        ? currentSelected.filter(id => id !== clientId)
        : [...currentSelected, clientId];
      
      return {
        ...prev,
        selectedClients: newSelectedClients
      };
    });
  };

  // Função para obter nomes dos clientes selecionados
  const getSelectedClientsNames = () => {
    if (!formData.selectedClients || formData.selectedClients.length === 0) {
      return 'Nenhum cliente selecionado';
    }
    
    const selectedNames = formData.selectedClients
      .map(clientId => clients.find(client => client.id === clientId)?.name)
      .filter(Boolean);
    
    if (selectedNames.length === 0) return 'Nenhum cliente selecionado';
    if (selectedNames.length === 1) return selectedNames[0];
    if (selectedNames.length <= 3) return selectedNames.join(', ');
    return `${selectedNames.slice(0, 2).join(', ')} e mais ${selectedNames.length - 2}`;
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};

    // Validação do nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome do serviço é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validação da descrição
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    // Validação do preço
    if (!formData.defaultPrice.trim()) {
      newErrors.defaultPrice = 'Preço padrão é obrigatório';
    } else {
      const price = parseFloat(formData.defaultPrice.replace(',', '.'));
      if (isNaN(price) || price <= 0) {
        newErrors.defaultPrice = 'Preço deve ser um valor válido maior que zero';
      }
    }

    // Validação da duração
    if (!formData.estimatedDuration.trim()) {
      newErrors.estimatedDuration = 'Duração estimada é obrigatória';
    }

    // Validação da descrição do serviço
    if (!formData.serviceDescription.trim()) {
      newErrors.serviceDescription = 'Descrição detalhada do serviço é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para adicionar template
  const handleAdd = () => {
    if (!validateForm()) return;

    const newTemplate = {
      id: Date.now().toString(),
      ...formData,
      defaultPrice: parseFloat(formData.defaultPrice.replace(',', '.')),
      defaultQuantity: formData.defaultQuantity ? parseInt(formData.defaultQuantity) : 1,
      createdAt: new Date().toISOString()
    };

    onAdd(newTemplate);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      defaultPrice: '',
      estimatedDuration: '',
      requiredProducts: '',
      defaultQuantity: '',
      serviceDescription: '',
      isHandled: false,
      selectedClients: []
    });
    setErrors({});
    setShowClientDropdown(false);
  };

  // Função para cancelar
  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      defaultPrice: '',
      estimatedDuration: '',
      requiredProducts: '',
      defaultQuantity: '',
      serviceDescription: '',
      isHandled: false,
      selectedClients: []
    });
    setErrors({});
    setShowClientDropdown(false);
    onClose();
  };

  // Função para formatar preço
  const formatPrice = (text) => {
    // Remove tudo que não é número, vírgula ou ponto
    const cleaned = text.replace(/[^\d,.]/g, '');
    // Garantir apenas um separador decimal
    const parts = cleaned.split(/[,.]/);
    if (parts.length > 2) {
      return parts[0] + ',' + parts.slice(1).join('');
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
            onPress={handleCancel}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Novo template de serviço</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Nome do Serviço */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome do serviço:</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Ex: Corte de cabelo"
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Descrição */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descrição:</Text>
            <TextInput
              style={[styles.input, errors.description && styles.inputError]}
              placeholder="Breve descrição do serviço"
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              autoCapitalize="sentences"
              returnKeyType="next"
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Preço Padrão */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preço padrão (R$):</Text>
            <TextInput
              style={[styles.input, errors.defaultPrice && styles.inputError]}
              placeholder="0,00"
              value={formData.defaultPrice}
              onChangeText={(text) => updateFormData('defaultPrice', formatPrice(text))}
              keyboardType="numeric"
              returnKeyType="next"
            />
            {errors.defaultPrice && <Text style={styles.errorText}>{errors.defaultPrice}</Text>}
          </View>

          {/* Duração Estimada */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Duração estimada:</Text>
            <TextInput
              style={[styles.input, errors.estimatedDuration && styles.inputError]}
              placeholder="Ex: 45 minutos"
              value={formData.estimatedDuration}
              onChangeText={(text) => updateFormData('estimatedDuration', text)}
              returnKeyType="next"
            />
            {errors.estimatedDuration && <Text style={styles.errorText}>{errors.estimatedDuration}</Text>}
          </View>

          {/* Produtos do Estoque */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Produtos do estoque (opcional):</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Shampoo, Condicionador, Tinta"
              value={formData.requiredProducts}
              onChangeText={(text) => updateFormData('requiredProducts', text)}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Quantidade */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Quantidade padrão:</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              value={formData.defaultQuantity}
              onChangeText={(text) => updateFormData('defaultQuantity', text.replace(/\D/g, ''))}
              keyboardType="numeric"
              maxLength={3}
              returnKeyType="next"
            />
          </View>

          {/* Clientes Recomendados */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Clientes recomendados (opcional):</Text>
            <TouchableOpacity 
              style={styles.clientSelector}
              onPress={() => setShowClientDropdown(!showClientDropdown)}
            >
              <Text style={[styles.clientSelectorText, !formData.selectedClients?.length && styles.placeholder]}>
                {getSelectedClientsNames()}
              </Text>
              <MaterialIcons 
                name={showClientDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color={colors.textLight} 
              />
            </TouchableOpacity>
            
            {showClientDropdown && (
              <View style={styles.clientDropdown}>
                {clients.length > 0 ? (
                  clients.map((client) => {
                    const isSelected = formData.selectedClients?.includes(client.id);
                    return (
                      <TouchableOpacity
                        key={client.id}
                        style={styles.clientDropdownItem}
                        onPress={() => toggleClientSelection(client.id)}
                      >
                        <View style={styles.clientItemContent}>
                          <Text style={styles.clientItemText}>{client.name}</Text>
                          <MaterialIcons 
                            name={isSelected ? "check-box" : "check-box-outline-blank"} 
                            size={20} 
                            color={isSelected ? colors.primary : colors.textLight} 
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.clientDropdownItem}>
                    <Text style={styles.emptyClientText}>Nenhum cliente cadastrado</Text>
                  </View>
                )}
              </View>
            )}
            
            <Text style={styles.helperText}>
              Selecione clientes que costumam usar este serviço para facilitar agendamentos futuros
            </Text>
          </View>

          {/* Descrição Detalhada */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descrição detalhada do serviço:</Text>
            <TextInput
              style={[styles.textArea, errors.serviceDescription && styles.inputError]}
              placeholder="Descreva o que está incluído no serviço, processos, cuidados especiais..."
              value={formData.serviceDescription}
              onChangeText={(text) => updateFormData('serviceDescription', text)}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              autoCapitalize="sentences"
              returnKeyType="done"
            />
            {errors.serviceDescription && <Text style={styles.errorText}>{errors.serviceDescription}</Text>}
          </View>

          {/* Serviço Manuseável */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => updateFormData('isHandled', !formData.isHandled)}
            >
              <MaterialIcons 
                name={formData.isHandled ? "check-box" : "check-box-outline-blank"} 
                size={24} 
                color={formData.isHandled ? colors.primary : colors.textLight} 
              />
              <Text style={styles.checkboxLabel}>Serviço manuseável/manipulável</Text>
            </TouchableOpacity>
          </View>

          {/* Botão Adicionar */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
          >
            <Text style={styles.addButtonText}>Criar template</Text>
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
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  textArea: {
    minHeight: 100,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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

  checkboxContainer: {
    marginBottom: spacing.lg,
  },

  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkboxLabel: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
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

  // Estilos para multi-select de clientes
  clientSelector: {
    height: 50,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  clientSelectorText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
  },

  placeholder: {
    color: colors.textLight,
  },

  clientDropdown: {
    position: 'absolute',
    top: 85,
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
    borderWidth: 1,
    borderColor: colors.lightGray,
  },

  clientDropdownItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  clientItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  clientItemText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    flex: 1,
  },

  emptyClientText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  helperText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
});

export default ServiceTemplateModal;