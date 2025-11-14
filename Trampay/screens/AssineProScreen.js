import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../AuthContext';
import api from '../services/api';
import { colors, fonts, spacing } from '../styles';

const AssineProScreen = ({ navigation }) => {
  const { activatePro, isPro, loading: authLoading } = useContext(AuthContext);
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
        <Text style={styles.title}>Você é PRO</Text>
        <Text style={styles.subtitle}>Sua assinatura está ativa.</Text>
        {status.premiumUntil && (
          <Text style={styles.until}>Válida até: {new Date(status.premiumUntil).toLocaleDateString()}</Text>
        )}
        <TouchableOpacity style={styles.secondary} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trampay PRO</Text>
      <Text style={styles.subtitle}>Desbloqueie recursos avançados para o seu negócio.</Text>
      <View style={styles.benefits}>
        <Text style={styles.benefit}>• IA assistente com histórico</Text>
        <Text style={styles.benefit}>• Precificação e análises</Text>
        <Text style={styles.benefit}>• Câmbio e Trading</Text>
        <Text style={styles.benefit}>• Suporte prioritário</Text>
      </View>
      {loading || authLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <TouchableOpacity style={styles.cta} onPress={handleActivatePro}>
          <Text style={styles.ctaText}>Assinar PRO</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.secondary} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AssineProScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { fontSize: 24, fontFamily: fonts.bold, color: colors.text },
  subtitle: { fontSize: 14, marginTop: spacing.sm, textAlign: 'center', color: colors.text },
  benefits: { width: '100%', marginTop: spacing.xl, gap: spacing.sm },
  benefit: { fontSize: 16, color: colors.text, textAlign: 'center', fontFamily: fonts.medium },
  cta: { marginTop: spacing.xl, backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: 12 },
  ctaText: { color: colors.white, fontSize: 18, fontFamily: fonts.bold },
  secondary: { marginTop: spacing.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: 12, borderWidth: 1, borderColor: colors.lightGray },
  secondaryText: { color: colors.text, fontSize: 16, fontFamily: fonts.medium },
  until: { marginTop: spacing.md, color: colors.text }
});