// Tela principal do Meu Negócio - Trampay
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';

const MyBusinessScreen = ({ navigation }) => {
  const menuOptions = [
    {
      id: 1,
      title: 'Meus Serviços',
      subtitle: 'Agenda e gerenciamento',
      icon: 'business-center',
      onPress: () => navigation.navigate('Services')
    },
    {
      id: 2,
      title: 'Meus Clientes',
      subtitle: 'Cadastro e dados',
      icon: 'people',
      onPress: () => navigation.navigate('Clients')
    },
    {
      id: 3,
      title: 'Estoque',
      subtitle: 'Inventário e controle',
      icon: 'inventory',
      onPress: () => navigation.navigate('Stock')
    },
    {
      id: 4,
      title: 'Equipamentos',
      subtitle: 'Ferramentas e recursos',
      icon: 'build',
      onPress: () => navigation.navigate('Equipments')
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Meu negócio</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {menuOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.menuCard}
            onPress={option.onPress}
            activeOpacity={0.8}
          >
            <View style={styles.menuCardContent}>
              <MaterialIcons 
                name={option.icon} 
                size={24} 
                color={colors.white} 
                style={styles.menuIcon} 
              />
              <View style={styles.menuTextContent}>
                <Text style={styles.menuTitle}>{option.title}</Text>
                {option.subtitle && (
                  <Text style={styles.menuSubtitle}>{option.subtitle}</Text>
                )}
              </View>
              <MaterialIcons 
                name="chevron-right" 
                size={28} 
                color={colors.white} 
                style={styles.arrowIcon} 
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
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
    fontSize: 20,
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
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },

  menuCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    padding: spacing.xl,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  menuCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  menuIcon: {
    marginRight: spacing.md,
  },

  menuTextContent: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },

  menuSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.lightGray,
    lineHeight: 18,
  },

  arrowIcon: {
    marginLeft: spacing.sm,
  },
});

export default MyBusinessScreen;