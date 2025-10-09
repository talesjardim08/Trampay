// Modal para visualizar histórico de serviços do cliente - Trampay
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';
import SecureStorage from '../utils/SecureStorage';

const ClientHistoryModal = ({ visible, onClose, client }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carrega histórico de serviços do cliente quando o modal abre
  useEffect(() => {
    if (visible && client) {
      loadClientServices();
    }
  }, [visible, client]);

  const loadClientServices = async () => {
    setLoading(true);
    try {
      const savedServices = await SecureStorage.getItem('userServices');
      if (savedServices) {
        // Filtra serviços do cliente específico
        const clientServices = savedServices.filter(service => 
          service.clientName === client.name || service.clientId === client.id
        );
        
        // Ordena por data (mais recente primeiro)
        const sortedServices = clientServices.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        setServices(sortedServices);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de serviços:', error);
      setServices([]);
    }
    setLoading(false);
  };

  // Função para formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para calcular total gasto
  const calculateTotal = () => {
    return services
      .filter(service => service.paid)
      .reduce((total, service) => total + (parseFloat(service.price) || 0), 0);
  };

  // Renderiza item do histórico
  const renderServiceItem = ({ item: service }) => (
    <View style={styles.serviceItem}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.serviceName}</Text>
          <Text style={styles.serviceDate}>{formatDate(service.date)} • {service.time}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.servicePrice}>R$ {parseFloat(service.price || 0).toFixed(2)}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: service.paid ? colors.success : colors.warning }
          ]}>
            <Text style={styles.statusText}>
              {service.paid ? 'Pago' : 'Pendente'}
            </Text>
          </View>
        </View>
      </View>
      
      {service.notes && (
        <Text style={styles.serviceNotes}>{service.notes}</Text>
      )}
    </View>
  );

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
          
          <Text style={styles.headerTitle}>Histórico de serviços</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Client Info */}
        {client && (
          <View style={styles.clientInfo}>
            <View style={styles.clientHeader}>
              <View style={styles.clientAvatar}>
                <MaterialIcons name="person" size={24} color={colors.white} />
              </View>
              <View style={styles.clientDetails}>
                <Text style={styles.clientName}>{client.name}</Text>
                <Text style={styles.clientContact}>{client.phone} • {client.email}</Text>
              </View>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{services.length}</Text>
                <Text style={styles.statLabel}>Serviços</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>R$ {calculateTotal().toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total gasto</Text>
              </View>
            </View>
          </View>
        )}

        {/* Services List */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando histórico...</Text>
            </View>
          ) : services.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Histórico de serviços</Text>
              <FlatList
                data={services}
                renderItem={renderServiceItem}
                keyExtractor={(item) => item.id}
                style={styles.servicesList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={80} color={colors.textLight} />
              <Text style={styles.emptyStateTitle}>Nenhum serviço encontrado</Text>
              <Text style={styles.emptyStateText}>
                Este cliente ainda não possui histórico de serviços.
              </Text>
            </View>
          )}
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

  clientInfo: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  clientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  clientDetails: {
    flex: 1,
  },

  clientName: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },

  clientContact: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },

  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.lightGray,
    marginHorizontal: spacing.md,
  },

  statNumber: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },

  statLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.lg,
  },

  servicesList: {
    flex: 1,
  },

  serviceItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  serviceInfo: {
    flex: 1,
    marginRight: spacing.md,
  },

  serviceName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },

  serviceDate: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },

  priceContainer: {
    alignItems: 'flex-end',
  },

  servicePrice: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },

  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.white,
  },

  serviceNotes: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  emptyStateTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  emptyStateText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ClientHistoryModal;