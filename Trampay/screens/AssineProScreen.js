import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../AuthContext';
import api from '../services/api';
import { colors, fonts, spacing, typeScale } from '../styles';
import { useResponsive } from '../utils/responsive';

const AssineProScreen = ({ navigation }) => {
  const { activatePro, deactivatePro, isPro, loading: authLoading } = useContext(AuthContext);
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ isPremium: false, premiumUntil: null });

  useEffect(() => {
    let mounted = true;
    const loadStatus = async () => {
      try {
        const res = await api.get('/subscription/status');
        if (mounted) setStatus({ isPremium: !!res.data?.isPremium, premiumUntil: res.data?.premiumUntil || null });
      } catch {}
    };
    loadStatus();
    return () => { mounted = false; };
  }, [isPro]);

  const handleActivatePro = async () => {
    setLoading(true);
    try { await activatePro(); } catch {} finally { setLoading(false); }
  };

  if (isPro || status.isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow} accessibilityRole="header" accessibilityLabel="Assinatura PRO ativa">
          <Text style={styles.title}>Conta PRO</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>PRO</Text></View>
        </View>
        <Text style={styles.subtitle}>Sua assinatura está ativa.</Text>
        {status.premiumUntil && (
          <Text style={styles.until}>Válida até: {new Date(status.premiumUntil).toLocaleDateString()}</Text>
        )}
        <View style={[styles.actionsRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
          <TouchableOpacity style={styles.secondary} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deactivate} onPress={deactivatePro}>
            <Text style={styles.deactivateText}>Desativar PRO</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.benefitsGrid} accessibilityLabel="Benefícios PRO">
          <View style={styles.benefitCol}>
            <Text style={styles.benefitTitle}>Recursos Básicos</Text>
            <Text style={styles.benefitItem}>Gestão de clientes</Text>
            <Text style={styles.benefitItem}>Cadastro de serviços</Text>
            <Text style={styles.benefitItem}>Estoque e equipamentos</Text>
          </View>
          <View style={styles.benefitCol}>
            <Text style={styles.benefitTitle}>Recursos PRO</Text>
            <Text style={styles.benefitItem}>IA assistente com histórico</Text>
            <Text style={styles.benefitItem}>Análises e precificação avançadas</Text>
            <Text style={styles.benefitItem}>Suporte prioritário</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow} accessibilityRole="header" accessibilityLabel="Assinatura Trampay PRO">
        <Text style={styles.title}>Trampay PRO</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>PRO</Text></View>
      </View>
      <Text style={styles.subtitle}>Desbloqueie recursos avançados para o seu negócio.</Text>
      <View style={styles.benefitsGrid}>
        <View style={styles.benefitCol}>
          <Text style={styles.benefitTitle}>Básico</Text>
          <Text style={styles.benefitItem}>Gestão de clientes</Text>
          <Text style={styles.benefitItem}>Cadastro de serviços</Text>
          <Text style={styles.benefitItem}>Estoque e equipamentos</Text>
        </View>
        <View style={styles.benefitCol}>
          <Text style={styles.benefitTitle}>PRO</Text>
          <Text style={styles.benefitItem}>IA assistente com histórico</Text>
          <Text style={styles.benefitItem}>Precificação e análises</Text>
          <Text style={styles.benefitItem}>Suporte prioritário</Text>
        </View>
      </View>
      {loading || authLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <TouchableOpacity style={styles.cta} onPress={handleActivatePro}>
          <Text style={styles.ctaText}>Assinar PRO</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.secondary} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Voltar">
        <Text style={styles.secondaryText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AssineProScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { fontSize: typeScale.h1, fontFamily: fonts.bold, color: colors.text },
  subtitle: { fontSize: 14, marginTop: spacing.sm, textAlign: 'center', color: colors.text },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  badgeText: { color: colors.textDark, fontFamily: fonts.bold },
  actionsRow: { width: '100%', gap: spacing.md },
  benefitsGrid: { width: '100%', marginTop: spacing.xl, flexDirection: 'row', gap: spacing.lg },
  benefitCol: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md },
  benefitTitle: { fontSize: typeScale.h2, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.sm },
  benefitItem: { fontSize: typeScale.body, fontFamily: fonts.regular, color: colors.text, marginTop: 4 },
  cta: { marginTop: spacing.xl, backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: 12 },
  ctaText: { color: colors.white, fontSize: 18, fontFamily: fonts.bold },
  secondary: { marginTop: spacing.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: 12, borderWidth: 1, borderColor: colors.lightGray },
  secondaryText: { color: colors.text, fontSize: 16, fontFamily: fonts.medium },
  until: { marginTop: spacing.md, color: colors.text },
  deactivate: { marginTop: spacing.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: 12, backgroundColor: colors.error },
  deactivateText: { color: colors.white, fontSize: 16, fontFamily: fonts.bold }
});
