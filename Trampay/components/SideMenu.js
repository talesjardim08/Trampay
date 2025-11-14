// project/Trampay-main/Trampay/components/SideMenu.js
import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, StatusBar, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';
import { AuthContext } from '../AuthContext';

const SideMenu = ({ navigation, onClose }) => {
  const { user, isPro, loading, handleLogout } = useContext(AuthContext);

  const handleNavigation = (screen) => {
    const premiumScreens = [
      'TrampayIA',
      'CambioTrading',
      'CryptoTrading',
      'StocksTrading',
      'CurrencyTrading',
      'Precificacao',
    ];

    if (!isPro && premiumScreens.includes(screen)) {
      if (onClose) onClose();
      return navigation.navigate('AssinePro');
    }

    if (onClose) onClose();
    navigation.navigate(screen);
  };

  const handleLogoutPress = async () => {
    Alert.alert('Confirmação', 'Você deseja mesmo sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await handleLogout();
          if (onClose) onClose();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const userName = user?.displayName || user?.legalName || (user?.email ? user.email.split('@')[0] : '') || 'Usuário';

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
            {isPro && (
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('EditProfile')}>
            <View style={styles.menuItemRow}>
              <Ionicons name="person-circle" size={20} color={colors.primaryDark} />
              <Text style={styles.menuItemText}>Editar meus dados</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('TrampayIA')}>
            <View style={styles.menuItemRow}>
              <Ionicons name="chatbubbles" size={20} color={colors.primaryDark} />
              <Text style={styles.menuItemText}>Trampay I.A</Text>
            </View>
            {!isPro && <Text style={styles.lockedText}>Exclusivo Pro</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('TaxSimulator')}>
            <View style={styles.menuItemRow}>
              <MaterialIcons name="calculate" size={20} color={colors.primaryDark} />
              <Text style={styles.menuItemText}>Simulador de impostos e taxas</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('AssinePro')}>
            <View style={styles.menuItemRow}>
              <MaterialIcons name="star" size={20} color={colors.primaryDark} />
              <Text style={styles.menuItemText}>{isPro ? 'Minha Assinatura PRO' : 'Assine o Pro'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('Settings')}>
            <View style={styles.menuItemRow}>
              <Ionicons name="settings" size={20} color={colors.primaryDark} />
              <Text style={styles.menuItemText}>Configurações</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogoutPress}>
            <View style={styles.menuItemRow}>
              <MaterialIcons name="logout" size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>Sair da conta</Text>
            </View>
          </TouchableOpacity>
        </View>

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
            {!isPro && <Text style={styles.lockedBadge}>PRO</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: '#e0f2f1' }]}
            onPress={() => handleNavigation('CambioTrading')}
          >
            <View style={styles.featureIcon}>
              <MaterialIcons
                name="trending-up"
                size={20}
                color={colors.primaryDark}
              />
            </View>
            <Text style={styles.featureText}>Trading</Text>
            {!isPro && <Text style={styles.lockedBadge}>PRO</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose || (() => navigation.goBack())}
        >
          <Text style={styles.closeButtonText}>Fechar Menu</Text>
        </TouchableOpacity>
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
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1,
  },
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
  profileInitial: { 
    fontSize: 18, 
    fontFamily: fonts.bold, 
    color: colors.primaryDark,
  },
  profileText: { flex: 1 },
  greeting: { 
    color: colors.white, 
    fontSize: 16, 
    fontFamily: fonts.regular,
  },
  userName: { 
    color: colors.white, 
    fontSize: 18, 
    fontFamily: fonts.bold,
  },
  premiumBadge: {
    color: '#ffcc00',
    fontSize: 12,
    fontFamily: fonts.medium,
    marginTop: 4,
  },
  notificationIcon: { 
    position: 'relative', 
    padding: spacing.sm,
  },
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
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl * 2 },
  menuContainer: { 
    paddingHorizontal: spacing.lg, 
    paddingTop: spacing.lg,
  },
  menuItem: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemText: { 
    fontSize: 16, 
    fontFamily: fonts.medium, 
    color: colors.text,
  },
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
    justifyContent: 'space-between',
  },
  featureCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 100,
    marginHorizontal: 4,
    position: 'relative',
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
  lockedBadge: {
    fontSize: 10,
    color: colors.error,
    fontFamily: fonts.bold,
    marginTop: 4,
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