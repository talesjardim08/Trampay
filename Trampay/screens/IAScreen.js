// src/screens/IAScreen.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  TextInput,
  Button,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../services/api";
import { AuthContext } from "../AuthContext";

export default function IAScreen({ navigation }) {
  const { isPro } = useContext(AuthContext);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    if (!isPro) {
      Alert.alert(
        "Recurso Premium",
        "A IA é um recurso exclusivo para usuários PRO.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Assinar PRO", onPress: () => navigation.navigate("AssinePro") },
        ]
      );
    }
  }, [isPro]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    if (!isPro) {
      Alert.alert("Erro", "Apenas usuários PRO podem usar a IA.");
      return;
    }

    setLoading(true);
    const userMessage = message.trim();
    setMessage("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await api.post("/ai/chat", {
        message: userMessage,
        chatId: currentChatId,
      });

      if (res.data.chatId && !currentChatId) {
        setCurrentChatId(res.data.chatId);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.response },
      ]);
    } catch (e) {
      console.error("Erro ao enviar mensagem:", e);
      Alert.alert("Erro", "Não foi possível enviar a mensagem.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erro ao processar mensagem." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async () => {
    if (!isPro) {
      Alert.alert("Erro", "Apenas usuários PRO podem usar OCR.");
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permissão Negada", "Você precisa permitir o acesso às fotos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLoadingImage(true);
        
        const formData = new FormData();
        formData.append("file", {
          uri: result.assets[0].uri,
          name: "image.jpg",
          type: "image/jpeg",
        });

        const res = await api.post("/ai/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setMessages((prev) => [
          ...prev,
          { role: "user", content: "[Imagem enviada para OCR]" },
          { role: "assistant", content: res.data.ocr || "Texto extraído da imagem." },
        ]);

        if (res.data.chatId) {
          setCurrentChatId(res.data.chatId);
        }
      }
    } catch (e) {
      console.error("Erro ao fazer upload:", e);
      Alert.alert("Erro", "Não foi possível processar a imagem.");
    } finally {
      setLoadingImage(false);
    }
  };

  const newChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  if (!isPro) {
    return (
      <View style={styles.container}>
        <Text style={styles.blockedText}>🔒 Recurso Premium</Text>
        <Text style={styles.subtitle}>A IA é exclusiva para usuários PRO.</Text>
        <TouchableOpacity
          style={styles.proButton}
          onPress={() => navigation.navigate("AssinePro")}
        >
          <Text style={styles.proButtonText}>Assinar PRO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>IA Assistant 🤖</Text>
        <TouchableOpacity onPress={newChat}>
          <Text style={styles.newChatButton}>Novo Chat</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chatContainer}>
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.messageBubble,
              msg.role === "user" ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text style={styles.messageText}>{msg.content}</Text>
          </View>
        ))}
        {loading && (
          <View style={styles.aiBubble}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Digite sua mensagem..."
          style={styles.input}
          multiline
          editable={!loading && !loadingImage}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={loading || loadingImage || !message.trim()}
        >
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={uploadImage}
        disabled={loadingImage || loading}
      >
        <Text style={styles.uploadButtonText}>
          {loadingImage ? "Processando..." : "📷 Analisar Imagem (OCR)"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  newChatButton: {
    color: "#007AFF",
    fontSize: 14,
  },
  chatContainer: {
    flex: 1,
    padding: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 15,
    marginVertical: 5,
    maxWidth: "80%",
  },
  userBubble: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  aiBubble: {
    backgroundColor: "#e5e5ea",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
    color: "#000",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  uploadButton: {
    backgroundColor: "#34C759",
    padding: 15,
    margin: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  blockedText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 100,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    color: "#666",
  },
  proButton: {
    backgroundColor: "#FFD700",
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  proButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});
