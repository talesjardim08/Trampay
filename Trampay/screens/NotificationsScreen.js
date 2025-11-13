// Tela de Notificações do Trampay
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import api from '../services/api';
import { colors, fonts, spacing } from '../styles';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      const items = response.data?.items || [];
      setNotifications(items);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/notifications');
      const items = response.data?.items || [];
      setNotifications(items);
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const removeNotification = async (id) => {
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
          onPress: async () => {
            try {
              await api.delete(`/notifications/${id}`);
              setNotifications(prev => prev.filter(n => n.id !== id));
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível deletar.');
            }
          }
        }
      ]
    );
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
  };

  const groupNotificationsByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const grouped = {
      hoje: [],
      proximos: [],
      futuros: []
    };

    notifications.forEach(notification => {
      const createdDate = new Date(notification.created_at);
      const dateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());

      if (dateOnly.getTime() === today.getTime()) {
        grouped.hoje.push(notification);
      } else if (dateOnly < nextWeek) {
        grouped.proximos.push(notification);
      } else {
        grouped.futuros.push(notification);
      }
    });

    return grouped;
  };

  const groupedNotifications = groupNotificationsByDate();

  const renderNotification = (notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationItem,
        !notification.is_read && styles.unreadNotification
      ]}
      onPress={() => markAsRead(notification.id)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        {notification.body && (
          <Text style={styles.notificationDescription}>{notification.body}</Text>
        )}
        <Text style={styles.notificationTime}>{getTimeAgo(notification.created_at)}</Text>
      </View>
      
      <View style={styles.notificationActions}>
        {!notification.is_read && <View style={styles.unreadDot} />}
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeNotification(notification.id)}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
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

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {groupedNotifications.hoje.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hoje</Text>
                {groupedNotifications.hoje.map(renderNotification)}
              </View>
            )}

            {groupedNotifications.proximos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mais Próximos</Text>
                {groupedNotifications.proximos.map(renderNotification)}
              </View>
            )}

            {groupedNotifications.futuros.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Futuros</Text>
                {groupedNotifications.futuros.map(renderNotification)}
              </View>
            )}

            {notifications.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <MaterialIcons name="notifications-none" size={64} color={colors.textLight} />
                <Text style={styles.emptyStateText}>
                  Nenhuma notificação no momento
                </Text>
              </View>
            )}
          </>
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl * 3,
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
    marginTop: spacing.md,
  },
});

export default NotificationsScreen;
