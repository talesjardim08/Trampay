import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

export default function HomeScreen({ route, navigation, onLogout }) {
  // Recebe dados do usuário da navegação ou define como objeto vazio
  const { user } = route.params || { user: {} };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao Trampay!</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nome:</Text>
        <Text style={styles.value}>{user.nome || "Não informado"}</Text>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email || "Não informado"}</Text>

        <Text style={styles.label}>Senha:</Text>
        <Text style={styles.value}>{user.senha || "Não informada"}</Text>
      </View>

      <Button title="Sair" onPress={onLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    marginBottom: 20,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: "#555",
  },
});
