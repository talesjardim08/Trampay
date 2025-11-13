import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../AuthContext';
import { colors, fonts, spacing } from '../styles';

const ProUpgradeScreen = ({ navigation }) => {
  const { isPro } = useContext(AuthContext);

  const handleUpgrade = () => {
    Alert.alert(
      'Upgrade PRO',
      'Esta funcionalidade de pagamento será implementada em breve. Entre em contato com o suporte para mais informações.',
      [{ text: 'OK' }]
    );
  };

  const features = [
    {
      icon: 'trending-up',
      title: 'Trading Avançado',
      description: 'Acompanhe câmbio, criptomoedas e ações em tempo real'
    },
    {
      icon: 'smart-toy',
      title: 'Assistente IA',
      description: 'Chatbot inteligente para ajudar com dúvidas financeiras'
    },
    {
      icon: 'document-scanner',
      title: 'OCR de Documentos',
      description: 'Digitalize recibos e documentos automaticamente'
    },
    {
      icon: 'analytics',
      title: 'Relatórios Premium',
      description: 'Análises avançadas e insights sobre seu negócio'
    },
    {
      icon: 'cloud-upload',
      title: 'Backup na Nuvem',
      description: 'Seus dados seguros e sincronizados em todos os dispositivos'
    },
    {
      icon: 'support-agent',
      title: 'Suporte Prioritário',
      description: 'Atendimento exclusivo e respostas rápidas'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trampay PRO</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.heroSection}
        >
          <MaterialIcons name="workspace-premium" size={80} color={colors.white} />
          <Text style={styles.heroTitle}>Trampay PRO</Text>
          <Text style={styles.heroSubtitle}>
            Desbloqueie todo o potencial do seu negócio
          </Text>
          
          <View style={styles.priceCard}>
            <Text style={styles.priceCurrency}>R$</Text>
            <Text style={styles.priceValue}>29,90</Text>
            <Text style={styles.pricePeriod}>/mês</Text>
          </View>

          <Text style={styles.promoText}>7 dias grátis para novos assinantes</Text>
        </LinearGradient>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Recursos Exclusivos</Text>
          
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialIcons name={feature.icon} size={32} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            </View>
          ))}
        </View>

        <View style={styles.testimonialsSection}>
          <Text style={styles.sectionTitle}>O que nossos usuários dizem</Text>
          
          <View style={styles.testimonialCard}>
            <View style={styles.testimonialHeader}>
              <MaterialIcons name="person" size={40} color={colors.primary} />
              <View style={styles.testimonialInfo}>
                <Text style={styles.testimonialName}>Maria Silva</Text>
                <Text style={styles.testimonialRole}>Vendedora Autônoma</Text>
              </View>
            </View>
            <Text style={styles.testimonialText}>
              "O Trampay PRO revolucionou meu negócio! Consigo acompanhar todas as minhas vendas e o assistente IA me ajuda a tomar decisões melhores."
            </Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialIcons key={star} name="star" size={20} color="#FFB300" />
              ))}
            </View>
          </View>

          <View style={styles.testimonialCard}>
            <View style={styles.testimonialHeader}>
              <MaterialIcons name="person" size={40} color={colors.primary} />
              <View style={styles.testimonialInfo}>
                <Text style={styles.testimonialName}>João Santos</Text>
                <Text style={styles.testimonialRole}>Barbeiro</Text>
              </View>
            </View>
            <Text style={styles.testimonialText}>
              "Vale cada centavo! Os relatórios me mostram exatamente onde posso melhorar e o OCR economiza muito tempo."
            </Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialIcons key={star} name="star" size={20} color="#FFB300" />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.guaranteeSection}>
          <MaterialIcons name="verified-user" size={48} color={colors.primary} />
          <Text style={styles.guaranteeTitle}>Garantia de 30 dias</Text>
          <Text style={styles.guaranteeText}>
            Não gostou? Devolvemos seu dinheiro sem perguntas. Simples assim.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.upgradeButton, isPro && styles.upgradeButtonDisabled]}
          onPress={handleUpgrade}
          disabled={isPro}
        >
          <LinearGradient
            colors={isPro ? ['#9E9E9E', '#757575'] : [colors.primary, colors.primaryDark]}
            style={styles.upgradeButtonGradient}
          >
            <Text style={styles.upgradeButtonText}>
              {isPro ? 'Você já é PRO' : 'Assinar Trampay PRO'}
            </Text>
            {!isPro && <MaterialIcons name="arrow-forward" size={24} color={colors.white} />}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.white
  },
  content: {
    flex: 1
  },
  heroSection: {
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center'
  },
  heroTitle: {
    fontSize: 36,
    fontFamily: fonts.bold,
    color: colors.white,
    marginTop: spacing.md
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.sm,
    opacity: 0.9
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 16
  },
  priceCurrency: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 8
  },
  priceValue: {
    fontSize: 56,
    fontFamily: fonts.bold,
    color: colors.white
  },
  pricePeriod: {
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.white,
    marginBottom: 12,
    opacity: 0.9
  },
  promoText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
    marginTop: spacing.md,
    backgroundColor: '#4CAF50',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20
  },
  featuresSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.lg
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  featureIcon: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 28
  },
  featureContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginBottom: 4
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    lineHeight: 20
  },
  testimonialsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl
  },
  testimonialCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  testimonialInfo: {
    marginLeft: spacing.md
  },
  testimonialName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark
  },
  testimonialRole: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight
  },
  testimonialText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textDark,
    lineHeight: 22,
    marginBottom: spacing.md,
    fontStyle: 'italic'
  },
  ratingContainer: {
    flexDirection: 'row'
  },
  guaranteeSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl
  },
  guaranteeTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginTop: spacing.md,
    marginBottom: spacing.sm
  },
  guaranteeText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  upgradeButtonDisabled: {
    opacity: 0.6
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl
  },
  upgradeButtonText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
    marginRight: spacing.sm
  }
});

export default ProUpgradeScreen;
