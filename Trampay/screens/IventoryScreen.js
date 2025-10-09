// Tela de Estoque e Equipamentos - Trampay (Stub temporário)
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

const InventoryScreen = ({ navigation }) => {
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
        
        <Text style={styles.headerTitle}>Meu estoque e equipamentos</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <MaterialIcons name="inventory" size={80} color={colors.primary} />
        
        <Text style={styles.title}>
          Estoque e Equipamentos
        </Text>
        
        <Text style={styles.description}>
          Esta funcionalidade será implementada em breve.{'\n\n'}
          Aqui você poderá gerenciar seu estoque de produtos e equipamentos utilizados nos serviços.
        </Text>

        <TouchableOpacity
          style={styles.backHomeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backHomeButtonText}>
            Voltar
          </Text>
        </TouchableOpacity>
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
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    textAlign: 'center',
    flex: 1,
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  description: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },

  backHomeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  backHomeButtonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});

export default InventoryScreen;