// Side Menu do Trampay
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';

const SideMenu = ({ navigation, user, onLogout, onClose }) => {
  const userName = user?.name || user?.email?.split('@')[0] || 'Usuário';

  const menuItems = [
    {
      id: 3,
      title: 'Editar meus dados',
      onPress: () => {
        if (onClose) onClose();
        navigation.navigate('EditProfile');
      }
    },
    {
      id: 4,
      title: 'Trampay I.A',
      onPress: () => {
        if (onClose) onClose();
        navigation.navigate('TrampayIA');
      }
    },
    {
      id: 5,
      title: 'Simulador de impostos e taxas específicas',
      onPress: () => {
        if (onClose) onClose();
        navigation.navigate('TaxSimulator');
      }
    },
    {
      id: 6,
      title: 'Assine o pro',
      onPress: () => {
        if (onClose) onClose();
        navigation.navigate('SubscribePro');
      }
    },
    {
      id: 7,
      title: 'Sair da minha conta',
      onPress: () => {
        Alert.alert(
          'Confirmação',
          'Você deseja mesmo sair?',
          [
            {
              text: 'Cancelar',
              style: 'cancel'
            },
            {
              text: 'Sair',
              style: 'destructive',
              onPress: () => {
                if (onLogout) {
                  onLogout();
                }
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      }
    }
  ];

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
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.notificationIcon}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications" size={20} color={colors.white} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <Text style={styles.menuItemText}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Feature Cards */}
      <View style={styles.featureCards}>
        <TouchableOpacity 
          style={[styles.featureCard, { backgroundColor: '#e8f4fd' }]}
          onPress={() => {
            if (onClose) onClose();
            navigation.navigate('Precificacao');
          }}
        >
          <View style={styles.featureIcon}>
            <MaterialIcons name="attach-money" size={20} color={colors.primaryDark} />
          </View>
          <Text style={styles.featureText}>Precificação</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.featureCard, { backgroundColor: '#e0f2f1' }]}
          onPress={() => {
            if (onClose) onClose();
            navigation.navigate('Services');
          }}
        >
          <View style={styles.featureIcon}>
            <MaterialIcons name="business-center" size={20} color={colors.primaryDark} />
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

  profileText: {
    flex: 1,
  },

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

  notificationIcon: {
    position: 'relative',
    padding: spacing.sm,
  },

  notificationText: {
    fontSize: 20,
    color: colors.white,
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

  menuContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  menuItem: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  menuItemText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  menuItemSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: spacing.xs,
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

  featureIconText: {
    fontSize: 20,
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