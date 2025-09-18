// Arquivo de estilos globais do Trampay
// Cores e configurações baseadas no design system fornecido
import { Platform } from 'react-native';

export const colors = {
  // Cores principais do design system
  primary: '#ffc236',      // Amarelo principal
  primaryDark: '#2d4e75',  // Azul escuro principal  
  secondary: '#e2eeff',    // Azul claro
  darkBlue: '#10375c',     // Azul muito escuro
  lightGray: '#f4f4f4',   // Cinza claro
  darkNavy: '#001f3d',     // Azul marinho muito escuro
  
  // Cores de sistema
  white: '#ffffff',
  black: '#000000',
  text: '#2d4e75',
  textLight: '#999999',
  placeholder: '#999999',
  border: '#e0e0e0',
  background: '#ffffff',
  error: '#ff4444',
  success: '#00C851',
  warning: '#ffbb33'
};

export const fonts = {
  // Usando fontes modernas e elegantes do sistema
  family: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  regular: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto-Medium', 
  semibold: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto-Medium',
  bold: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto-Bold'
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
};

// Estilos globais reutilizáveis
export const globalStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md
  },
  
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg
  },
  
  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm
  },
  
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.placeholder,
    textAlign: 'center',
    marginBottom: spacing.xl
  },
  
  input: {
    width: '100%',
    height: 56,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: spacing.md
  },
  
  button: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  
  buttonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.white
  },
  
  secondaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text
  },
  
  linkText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primaryDark,
    textAlign: 'center'
  },
  
  errorText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.error,
    marginBottom: spacing.sm
  },
  
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.xl
  },
  
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center'
  }
};