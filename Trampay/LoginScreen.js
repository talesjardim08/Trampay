import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { MaterialIcons } from "@expo/vector-icons";
import { loginUser } from "./components/authService"; 
import { colors, spacing, fonts } from "../styles"; 

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !senha) return Alert.alert("Atenção", "Preencha e-mail e senha");

    setLoading(true);
    try {
      const res = await loginUser({ Email: email.trim(), Senha: senha });

      if (res.token) {
        await SecureStore.setItemAsync("token", res.token);
        await SecureStore.setItemAsync("user", JSON.stringify(res.user));
        Alert.alert("Sucesso", "Login realizado com sucesso!");
        navigation.replace("Home");
      } else {
        Alert.alert("Erro", res.message || "Credenciais inválidas");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Falha ao autenticar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.primary, colors.backgroundGradientEnd || "#fff"]}
        style={styles.bg}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Animated.View style={[styles.container, { opacity: fade }]}>
            <Image
              source={require("../assets/logo_trampay_2025_2.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Bem-vindo de volta</Text>

            <View style={styles.card}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Digite seu e-mail"
              />

              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  secureTextEntry={secure}
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Digite sua senha"
                />
                <TouchableOpacity onPress={() => setSecure(!secure)} style={styles.eyeBtn}>
                  <MaterialIcons
                    name={secure ? "visibility-off" : "visibility"}
                    size={22}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                style={styles.forgot}
              >
                <Text style={styles.forgotText}>Esqueci minha senha</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryDark} />
                ) : (
                  <Text style={styles.primaryBtnText}>Entrar</Text>
                )}
              </TouchableOpacity>

              <View style={styles.row}>
                <Text style={styles.small}>Ainda não tem conta?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("CreateAccount")}>
                  <Text style={styles.link}> Criar conta</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  logo: {
    width: 160,
    height: 160,
    alignSelf: "center",
    marginBottom: 10,
    marginTop: 50,
  },
  container: { flex: 1, padding: spacing.lg },
  title: {
    textAlign: "center",
    fontSize: 22,
    color: colors.primaryDark,
    fontFamily: fonts.bold,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 18,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  label: { fontSize: 13, color: colors.primaryDark, marginBottom: 6, fontFamily: fonts.semibold },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
    backgroundColor: "#fff",
  },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  eyeBtn: { padding: 8, marginLeft: 8 },
  forgot: { alignSelf: "flex-end", marginTop: 4 },
  forgotText: { color: colors.primary, fontFamily: fonts.semibold },
  primaryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: colors.primaryDark, fontFamily: fonts.bold, fontSize: 16 },
  row: { flexDirection: "row", justifyContent: "center", marginTop: spacing.md },
  small: { color: colors.textLight },
  link: { color: colors.primary, fontFamily: fonts.semibold },
});
