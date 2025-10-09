// Modal para detalhes do serviço - Trampay
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';

const ServiceDetailsModal = ({ visible, onClose, service, onEdit, onDelete }) => {
  if (!service) return null;

  // Função para formatar status
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { text: 'Concluído', color: '#4CAF50', icon: 'check-circle' };
      case 'cancelled':
        return { text: 'Cancelado', color: '#FF5722', icon: 'cancel' };
      case 'pending':
        return { text: 'Pendente', color: colors.primary, icon: 'schedule' };
      default:
        return { text: 'Desconhecido', color: colors.textLight, icon: 'help' };
    }
  };

  // Função para formatar pagamento
  const getPaymentInfo = (paid) => {
    return paid 
      ? { text: 'Pago', color: '#4CAF50', icon: 'paid' }
      : { text: 'Não pago', color: '#FF5722', icon: 'money-off' };
  };

  const statusInfo = getStatusInfo(service.status);
  const paymentInfo = getPaymentInfo(service.paid);

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
            <MaterialIcons name="close" size={24} color={colors.primaryDark} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Detalhes do Serviço</Text>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit && onEdit(service)}
          >
            <MaterialIcons name="edit" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Service Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informações do Serviço</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Serviço:</Text>
              <Text style={styles.infoValue}>{service.serviceName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cliente:</Text>
              <Text style={styles.infoValue}>{service.clientName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data:</Text>
              <Text style={styles.infoValue}>
                {new Date(service.date).toLocaleDateString('pt-BR')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Horário:</Text>
              <Text style={styles.infoValue}>{service.time}</Text>
            </View>

            {service.description && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Descrição:</Text>
                <Text style={styles.infoValue}>{service.description}</Text>
              </View>
            )}

            {service.price && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Preço:</Text>
                <Text style={[styles.infoValue, styles.priceValue]}>
                  R$ {service.price}
                </Text>
              </View>
            )}
          </View>

          {/* Status Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Status</Text>
            
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <MaterialIcons 
                  name={statusInfo.icon} 
                  size={24} 
                  color={statusInfo.color} 
                />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.text}
                </Text>
              </View>

              <View style={styles.statusItem}>
                <MaterialIcons 
                  name={paymentInfo.icon} 
                  size={24} 
                  color={paymentInfo.color} 
                />
                <Text style={[styles.statusText, { color: paymentInfo.color }]}>
                  {paymentInfo.text}
                </Text>
              </View>
            </View>
          </View>

          {/* Equipment & Stock Card */}
          {(service.equipment || service.stock) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recursos</Text>
              
              {service.equipment && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Equipamentos:</Text>
                  <Text style={styles.infoValue}>{service.equipment}</Text>
                </View>
              )}

              {service.stock && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Produtos do estoque:</Text>
                  <Text style={styles.infoValue}>{service.stock}</Text>
                </View>
              )}
            </View>
          )}

          {/* Timestamps Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Histórico</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Criado em:</Text>
              <Text style={styles.infoValue}>
                {new Date(service.createdAt).toLocaleString('pt-BR')}
              </Text>
            </View>

            {service.completedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {service.status === 'completed' ? 'Concluído em:' : 'Cancelado em:'}
                </Text>
                <Text style={styles.infoValue}>
                  {new Date(service.completedAt).toLocaleString('pt-BR')}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {onEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit(service)}
              >
                <MaterialIcons name="edit" size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>
            )}

            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onDelete(service)}
              >
                <MaterialIcons name="delete" size={20} color={colors.error} />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                  Excluir
                </Text>
              </TouchableOpacity>
            )}
          </View>

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

  editButton: {
    padding: spacing.sm,
    borderRadius: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.lg,
  },

  infoRow: {
    marginBottom: spacing.md,
  },

  infoLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },

  infoValue: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  priceValue: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 18,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  statusItem: {
    alignItems: 'center',
    flex: 1,
  },

  statusText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    marginTop: spacing.xs,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: spacing.sm,
  },

  deleteButton: {
    borderColor: colors.error,
  },

  actionButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary,
  },

  deleteButtonText: {
    color: colors.error,
  },

  bottomSpacer: {
    height: spacing.xl,
  },
});

export default ServiceDetailsModal;