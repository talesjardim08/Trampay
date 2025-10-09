// Modal para confirmação de pagamento e conclusão do serviço - Trampay
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';

const PaymentConfirmationModal = ({ visible, onClose, service, onComplete }) => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [completionStatus, setCompletionStatus] = useState(null);

  // Função para confirmar conclusão do serviço
  const handleConfirm = () => {
    if (paymentStatus === null) {
      Alert.alert('Atenção', 'Por favor, informe se o serviço foi pago.');
      return;
    }

    if (completionStatus === null) {
      Alert.alert('Atenção', 'Por favor, informe se o serviço foi concluído.');
      return;
    }

    const completion = {
      paid: paymentStatus,
      status: completionStatus ? 'completed' : 'cancelled',
      completedAt: new Date().toISOString()
    };

    onComplete(service.id, completion);
    
    // Reset states
    setPaymentStatus(null);
    setCompletionStatus(null);
  };

  // Função para cancelar
  const handleCancel = () => {
    setPaymentStatus(null);
    setCompletionStatus(null);
    onClose();
  };

  if (!service) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCancel}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Voltar</Text>
            
            <View style={styles.headerSpacer} />
          </View>

          {/* Service Info */}
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle}>Serviço</Text>
            <Text style={styles.serviceName}>{service.serviceName}</Text>
            <Text style={styles.clientName}>{service.clientName}</Text>
            
            <View style={styles.timeContainer}>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Data: {service.date.split('-').reverse().join('/')}</Text>
              </View>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Horário: {service.time}</Text>
              </View>
            </View>

            {/* Edit Button */}
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editText}>Editar</Text>
              <MaterialIcons name="edit" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Payment Section */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Pagamento do Serviço</Text>
            <Text style={styles.serviceName}>{service.serviceName}</Text>
            <Text style={styles.clientName}>{service.clientName}</Text>
            
            <View style={styles.timeContainer}>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Data: {service.date.split('-').reverse().join('/')}</Text>
              </View>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Horário: {service.time}</Text>
              </View>
            </View>

            {/* Payment Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  styles.paidButton,
                  paymentStatus === true && styles.selectedButton
                ]}
                onPress={() => setPaymentStatus(true)}
              >
                <Text style={[
                  styles.buttonText,
                  paymentStatus === true && styles.selectedButtonText
                ]}>
                  Foi pago
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  styles.notPaidButton,
                  paymentStatus === false && styles.selectedButton
                ]}
                onPress={() => setPaymentStatus(false)}
              >
                <Text style={[
                  styles.buttonText,
                  paymentStatus === false && styles.selectedButtonText
                ]}>
                  Não foi
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Completion Section */}
          <View style={styles.completionSection}>
            <Text style={styles.completionTitle}>Status do Serviço</Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.completionButton,
                  styles.completedButton,
                  completionStatus === true && styles.selectedCompletionButton
                ]}
                onPress={() => setCompletionStatus(true)}
              >
                <Text style={[
                  styles.completionButtonText,
                  completionStatus === true && styles.selectedCompletionButtonText
                ]}>
                  Concluído
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.completionButton,
                  styles.cancelledButton,
                  completionStatus === false && styles.selectedCompletionButton
                ]}
                onPress={() => setCompletionStatus(false)}
              >
                <Text style={[
                  styles.completionButtonText,
                  completionStatus === false && styles.selectedCompletionButtonText
                ]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profit Section */}
          <View style={styles.profitSection}>
            <Text style={styles.profitTitle}>Lucro e despesa previstos</Text>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.background,
    borderRadius: 20,
    overflow: 'hidden',
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
  },

  headerSpacer: {
    width: 40,
  },

  serviceInfo: {
    backgroundColor: colors.lightGray,
    padding: spacing.lg,
    alignItems: 'center',
  },

  serviceTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },

  serviceName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  clientName: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textLight,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  timeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  timeItem: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },

  timeLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  editText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary,
  },

  paymentSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  paymentButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  paidButton: {
    backgroundColor: colors.primary,
  },

  notPaidButton: {
    backgroundColor: '#ff6b6b',
  },

  selectedButton: {
    borderColor: colors.primaryDark,
    borderWidth: 3,
  },

  buttonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },

  selectedButtonText: {
    color: colors.white,
  },

  completionSection: {
    padding: spacing.lg,
    alignItems: 'center',
  },

  completionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.md,
  },

  completionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  completedButton: {
    backgroundColor: colors.primary,
  },

  cancelledButton: {
    backgroundColor: '#ff6b6b',
  },

  selectedCompletionButton: {
    borderColor: colors.primaryDark,
    borderWidth: 3,
  },

  completionButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },

  selectedCompletionButtonText: {
    color: colors.white,
  },

  profitSection: {
    backgroundColor: colors.secondary,
    padding: spacing.lg,
    alignItems: 'center',
  },

  profitTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    textAlign: 'center',
  },

  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },

  confirmButtonText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
  },
});

export default PaymentConfirmationModal;