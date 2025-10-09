// Tela de Notificações do Trampay
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Serviço - Cliente - Hoje',
      description: 'Novo agendamento confirmado',
      time: '2 min atrás',
      type: 'hoje',
      read: false
    },
    {
      id: 2,
      title: 'Serviço - Cliente - Hoje',
      description: 'Pagamento recebido',
      time: '5 min atrás',
      type: 'hoje',
      read: false
    },
    {
      id: 3,
      title: 'Serviço - Cliente - Amanhã',
      description: 'Lembrete de agendamento',
      time: '1 hora atrás',
      type: 'proximos',
      read: true
    },
    {
      id: 4,
      title: 'Serviço - Cliente - 00\\00\\0000',
      description: 'Agendamento cancelado',
      time: '2 horas atrás',
      type: 'futuros',
      read: true
    }
  ]);

  // Carrega notificações salvas ao iniciar
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('userNotifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const saveNotifications = async (updatedNotifications) => {
    try {
      await AsyncStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Erro ao salvar notificações:', error);
    }
  };

  const removeNotification = (notificationId) => {
    Alert.alert(
      'Remover Notificação',
      'Tem certeza que deseja remover esta notificação?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const updatedNotifications = notifications.filter(n => n.id !== notificationId);
            setNotifications(updatedNotifications);
            saveNotifications(updatedNotifications);
            Alert.alert('Sucesso', 'Notificação removida!');
          }
        }
      ]
    );
  };

  const groupedNotifications = {
    hoje: notifications.filter(n => n.type === 'hoje'),
    proximos: notifications.filter(n => n.type === 'proximos'),
    futuros: notifications.filter(n => n.type === 'futuros')
  };

  const renderNotification = (notification) => (
    <View
      key={notification.id}
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification
      ]}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationDescription}>{notification.description}</Text>
        <Text style={styles.notificationTime}>{notification.time}</Text>
      </View>
      
      <View style={styles.notificationActions}>
        {!notification.read && <View style={styles.unreadDot} />}
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeNotification(notification.id)}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Notificações</Text>
        
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications" size={20} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Hoje */}
        {groupedNotifications.hoje.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hoje</Text>
            {groupedNotifications.hoje.map(renderNotification)}
          </View>
        )}

        {/* Mais Próximos */}
        {groupedNotifications.proximos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mais Próximos</Text>
            {groupedNotifications.proximos.map(renderNotification)}
          </View>
        )}

        {/* Futuros */}
        {groupedNotifications.futuros.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Futuros</Text>
            {groupedNotifications.futuros.map(renderNotification)}
          </View>
        )}

        {/* Empty State */}
        {notifications.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Nenhuma notificação no momento
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  backButton: {
    padding: spacing.sm,
  },

  backButtonText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontFamily: fonts.medium,
  },

  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
  },

  notificationIcon: {
    padding: spacing.sm,
  },


  content: {
    flex: 1,
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.lightGray,
  },

  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    alignItems: 'center',
  },

  unreadNotification: {
    backgroundColor: '#f8f9ff',
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },

  notificationDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },

  notificationTime: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },

  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },

  removeButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: '#fee',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
  },

  emptyStateText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default NotificationsScreen;