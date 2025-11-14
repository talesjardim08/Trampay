import React, { useState, useEffect, useContext } from "react";
import { View, TextInput, ScrollView, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, FlatList } from "react-native";
import { colors, fonts, spacing, borderRadius } from "../styles";
import api from "../services/api";
import { AuthContext } from "../AuthContext";

export default function IAScreen({ navigation }) {
  const { isPro } = useContext(AuthContext);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [showChats, setShowChats] = useState(false);

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

  useEffect(() => {
    const loadChats = async () => {
      if (!isPro) return;
      try {
        const res = await api.get("/ai/chats");
        setChats(res.data || []);
      } catch {}
    };
    loadChats();
  }, [isPro]);

  const loadMessages = async (chatId) => {
    try {
      const res = await api.get(`/ai/chats/${chatId}/messages`);
      const mapped = (res.data || []).map((m) => ({ role: m.role, content: m.content }));
      setMessages(mapped);
    } catch {}
  };

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
        setChats((prev) => [{ id: res.data.chatId, title: "Chat IA", updated_at: new Date().toISOString(), message_count: 0 }, ...prev]);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.response },
      ]);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível enviar a mensagem.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erro ao processar mensagem." },
      ]);
    } finally {
      setLoading(false);
    }
  };


  const newChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  const selectChat = async (chatId) => {
    setCurrentChatId(chatId);
    await loadMessages(chatId);
    setShowChats(false);
  };

  const deleteChat = async (chatId) => {
    try {
      await api.delete(`/ai/chats/${chatId}`);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (currentChatId === chatId) {
        newChat();
      }
    } catch {}
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
        <Text style={styles.title}>IA Assistant</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowChats(!showChats)} style={styles.headerButton}><Text style={styles.headerButtonText}>Conversas</Text></TouchableOpacity>
          <TouchableOpacity onPress={newChat} style={styles.headerButton}><Text style={styles.headerButtonText}>Novo Chat</Text></TouchableOpacity>
        </View>
      </View>

      {showChats && (
        <View style={styles.chatsPanel}>
          <FlatList
            data={chats}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.chatItemRow}>
                <TouchableOpacity style={styles.chatItem} onPress={() => selectChat(item.id)}>
                  <Text style={styles.chatTitle}>{item.title || "Chat IA"}</Text>
                  <Text style={styles.chatMeta}>{item.message_count} mensagens</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chatDelete} onPress={() => deleteChat(item.id)}>
                  <Text style={styles.chatDeleteText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

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
            <ActivityIndicator size="small" color={colors.primary} />
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
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={loading || !message.trim()}
        >
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>

      {null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  headerButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  headerButtonText: { color: colors.white, fontFamily: fonts.medium },
  chatsPanel: { backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  chatItemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chatItem: { flex: 1 },
  chatTitle: { fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  chatMeta: { fontSize: 12, color: colors.textLight },
  chatDelete: { marginLeft: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: colors.lightGray, borderRadius: borderRadius.sm },
  chatDeleteText: { color: colors.error, fontFamily: fonts.medium },
  chatContainer: { flex: 1, padding: spacing.sm },
  messageBubble: { padding: spacing.md, borderRadius: borderRadius.lg, marginVertical: spacing.xs, maxWidth: "80%" },
  userBubble: { backgroundColor: colors.primaryDark, alignSelf: "flex-end" },
  aiBubble: { backgroundColor: colors.lightGray, alignSelf: "flex-start" },
  messageText: { fontSize: 16, fontFamily: fonts.regular, color: colors.text },
  inputContainer: { flexDirection: "row", padding: spacing.sm, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm, maxHeight: 100 },
  sendButton: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, justifyContent: "center" },
  sendButtonText: { color: colors.white, fontFamily: fonts.bold },
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
