// Side Menu do Trampay — versão completa e integrada
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';
import api from '../services/api'; // Usa o backend .NET (ajusta a baseURL se necessário)

const SideMenu = ({ navigation, user: initialUser, onLogout, onClose }) => {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);

  // 🔗 Buscar dados reais do usuário no backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
      } catch (err) {
        console.error('Erro ao buscar dados do usuário:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ⚠️ Bloqueia acesso às telas Premium se o usuário não for assinante
  const handleNavigation = (screen) => {
    const premiumScreens = [
      'TrampayIA',
      'CambioTrading',
      'CryptoTrading',
      'StocksTrading',
      'CurrencyTrading',
    ];

    if (!user?.isPremium && premiumScreens.includes(screen)) {
      if (onClose) onClose();
      return navigation.navigate('SubscribePro');
    }

    if (onClose) onClose();
    navigation.navigate(screen);
  };

  // 🔒 Logout completo
  const handleLogout = async () => {
    Alert.alert('Confirmação', 'Você deseja mesmo sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          if (onLogout) onLogout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const userName =
    user?.name || user?.email?.split('@')[0] || 'Usuário';

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profileIcon}>
            <View style={styles.profileIconInner}>
              <Text style={styles.profileInitial}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.userName}>{userName}</Text>
            {user?.isPremium && (
              <Text style={styles.premiumBadge}>Usuário Premium ⭐</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.notificationIcon}
          onPress={() => handleNavigation('Notifications')}
        >
          <Ionicons name="notifications" size={20} color={colors.white} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigation('EditProfile')}
        >
          <Text style={styles.menuItemText}>Editar meus dados</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigation('TrampayIA')}
        >
          <Text style={styles.menuItemText}>Trampay I.A</Text>
          {!user?.isPremium && <Text style={styles.lockedText}>Exclusivo Pro</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigation('TaxSimulator')}
        >
          <Text style={styles.menuItemText}>Simulador de impostos e taxas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigation('SubscribePro')}
        >
          <Text style={styles.menuItemText}>Assine o Pro</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Text style={[styles.menuItemText, { color: colors.error }]}>Sair da conta</Text>
        </TouchableOpacity>
      </View>

      {/* Feature Cards */}
      <View style={styles.featureCards}>
        <TouchableOpacity
          style={[styles.featureCard, { backgroundColor: '#e8f4fd' }]}
          onPress={() => handleNavigation('Precificacao')}
        >
          <View style={styles.featureIcon}>
            <MaterialIcons
              name="attach-money"
              size={20}
              color={colors.primaryDark}
            />
          </View>
          <Text style={styles.featureText}>Precificação</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.featureCard, { backgroundColor: '#e0f2f1' }]}
          onPress={() => handleNavigation('Services')}
        >
          <View style={styles.featureIcon}>
            <MaterialIcons
              name="business-center"
              size={20}
              color={colors.primaryDark}
            />
          </View>
          <Text style={styles.featureText}>Serviços</Text>
        </TouchableOpacity>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose || (() => navigation.goBack())}
      >
        <Text style={styles.closeButtonText}>Fechar Menu</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  profileIcon: {
    width: 50,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileIconInner: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: { fontSize: 18, fontFamily: fonts.bold, color: colors.primaryDark },
  profileText: { flex: 1 },
  greeting: { color: colors.white, fontSize: 16, fontFamily: fonts.regular },
  userName: { color: colors.white, fontSize: 18, fontFamily: fonts.bold },
  premiumBadge: {
    color: '#ffcc00',
    fontSize: 12,
    fontFamily: fonts.medium,
    marginTop: 4,
  },
  notificationIcon: { position: 'relative', padding: spacing.sm },
  notificationBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 8,
    height: 8,
    backgroundColor: colors.error,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.white,
  },
  menuContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  menuItem: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  menuItemText: { fontSize: 16, fontFamily: fonts.medium, color: colors.text },
  lockedText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  featureCards: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  featureCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 'auto',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
});

export default SideMenu;
