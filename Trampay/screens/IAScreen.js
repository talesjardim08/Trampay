import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Clipboard,
  TouchableWithoutFeedback
} from "react-native";
import { colors, fonts, spacing, borderRadius } from "../styles";
import api from "../services/api";
import { AuthContext } from "../AuthContext";

const FAQ_FINANCEIRO = [
  {
    pergunta: "O que é fluxo de caixa?",
    resposta: "Fluxo de caixa é o controle de todas as entradas e saídas de dinheiro do seu negócio. Ele mostra quanto dinheiro você tem disponível em um período específico e ajuda a planejar seus gastos e investimentos."
  },
  {
    pergunta: "Como calcular margem de lucro?",
    resposta: "Margem de lucro = ((Receita - Custos) / Receita) × 100. Por exemplo: se você vende um produto por R$100 e seus custos são R$60, sua margem é ((100-60)/100) × 100 = 40%."
  },
  {
    pergunta: "Dicas para reduzir despesas",
    resposta: "1. Negocie com fornecedores\n2. Reduza desperdícios\n3. Automatize processos repetitivos\n4. Renegocie contratos de serviços\n5. Controle rigorosamente pequenas despesas\n6. Compare preços antes de comprar"
  },
  {
    pergunta: "Como precificar meu serviço?",
    resposta: "Considere: 1) Custos diretos (materiais, mão de obra)\n2) Custos indiretos (aluguel, energia)\n3) Margem de lucro desejada (geralmente 20-40%)\n4) Pesquisa de mercado (preços da concorrência)\n5) Valor percebido pelo cliente"
  },
  {
    pergunta: "Como atrair mais clientes?",
    resposta: "1. Crie presença nas redes sociais\n2. Peça indicações a clientes satisfeitos\n3. Ofereça promoções para novos clientes\n4. Invista em marketing local\n5. Mostre depoimentos e cases de sucesso\n6. Mantenha qualidade no atendimento"
  }
];

export default function IAScreen({ navigation }) {
  const { isPro } = useContext(AuthContext);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [showChats, setShowChats] = useState(false);
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);
  const [showFAQ, setShowFAQ] = useState(true);

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
      } catch (e) {
        // não falhar feio, apenas log
        console.warn("Erro ao buscar chats:", e?.message || e);
      }
    };
    loadChats();
  }, [isPro]);

  const loadMessages = async (chatId) => {
    try {
      setLoading(true);
      const res = await api.get(`/ai/chats/${chatId}/messages`);
      const mapped = (res.data || []).map((m) => ({ role: m.role, content: m.content }));
      setMessages(mapped);
    } catch (e) {
      console.warn("Erro ao carregar mensagens:", e?.message || e);
      Alert.alert("Erro", "Não foi possível carregar as mensagens do chat.");
    } finally {
      setLoading(false);
    }
  };

  const handleFAQClick = (item) => {
    setMessages((prev) => [
      { role: "assistant", content: item.resposta, isLocal: true },
      { role: "user", content: item.pergunta },
      ...prev
    ]);
    setShowFAQ(false);
    setTimeout(() => {
      try { listRef.current?.scrollToOffset({ offset: 0, animated: true }); } catch {}
    }, 150);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    if (!isPro) {
      Alert.alert("Erro", "Apenas usuários PRO podem usar a IA.");
      return;
    }

    setLoading(true);
    setTyping(true);
    const userMessage = message.trim();
    setMessage("");
    setShowFAQ(false);

    // add user message immediately
    setMessages((prev) => [{ role: "user", content: userMessage }, ...prev]);

    try {
      const res = await api.post("/ai/chat", {
        message: userMessage,
        chatId: currentChatId,
      });

      // if backend returned error-like response (format our AiService produces), show it
      const aiResponse = res.data?.response ?? "[Sem resposta]";

      if (res.data?.chatId && !currentChatId) {
        setCurrentChatId(res.data.chatId);
        setChats((prev) => [{ id: res.data.chatId, title: "Chat IA", updated_at: new Date().toISOString(), message_count: 0 }, ...prev]);
      }

      // push assistant reply
      setMessages((prev) => [{ role: "assistant", content: aiResponse }, ...prev]);

      // if aiResponse looks like an error from backend, show toast/alert
      if (typeof aiResponse === "string" && aiResponse.startsWith("[Erro")) {
        Alert.alert("Erro do modelo", aiResponse);
      }
    } catch (e) {
      console.warn("Erro ao enviar mensagem:", e?.message || e);
      Alert.alert("Erro", "Não foi possível enviar a mensagem.");
      setMessages((prev) => [{ role: "assistant", content: "Erro ao processar mensagem." }, ...prev]);
    } finally {
      setLoading(false);
      setTyping(false);
      // scroll to bottom (FlatList is inverted; keep focus)
      setTimeout(() => {
        try { listRef.current?.scrollToOffset({ offset: 0, animated: true }); } catch {}
      }, 150);
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
    } catch (e) {
      console.warn("Erro ao deletar chat:", e?.message || e);
      Alert.alert("Erro", "Não foi possível excluir o chat.");
    }
  };

  // helper: copy message content
  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setString(text);
      Alert.alert("Copiado", "Texto copiado para a área de transferência.");
    } catch (e) {
      console.warn("Clipboard error:", e);
    }
  };

  // Message bubble component
  const MessageRow = ({ item }) => {
    const isUser = item.role === "user";
    const isLocal = item.isLocal === true;
    const bubbleStyle = isUser ? styles.userBubble : styles.aiBubble;
    const rowStyle = isUser ? styles.rowUser : styles.rowAi;

    return (
      <View style={[styles.messageRow, rowStyle]}>
        {!isUser && (
          <View style={[styles.avatar, isLocal && { backgroundColor: colors.success }]}>
            <Text style={styles.avatarText}>{isLocal ? "💡" : "AI"}</Text>
          </View>
        )}
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => copyToClipboard(item.content)}
          style={[styles.messageBubble, bubbleStyle, isLocal && { backgroundColor: "#e8f5e9" }]}
        >
          <Text selectable style={styles.messageText}>{item.content}</Text>
          {isLocal && <Text style={styles.localBadge}>Resposta rápida</Text>}
        </TouchableOpacity>
        {isUser && <View style={styles.avatar}><Text style={styles.avatarText}>ME</Text></View>}
      </View>
    );
  };

  if (!isPro) {
    return (
      <View style={styles.containerBlocked}>
        <Text style={styles.blockedText}>🔒 Recurso Premium</Text>
        <Text style={styles.subtitle}>A IA é exclusiva para usuários PRO.</Text>
        <TouchableOpacity style={styles.proButton} onPress={() => navigation.navigate("AssinePro")}>
          <Text style={styles.proButtonText}>Assinar PRO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <Text style={styles.title}>IA Assistant</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowChats(true)} style={styles.headerButton}><Text style={styles.headerButtonText}>Conversas</Text></TouchableOpacity>
          <TouchableOpacity onPress={newChat} style={styles.headerButtonOutline}><Text style={styles.headerButtonOutlineText}>Novo Chat</Text></TouchableOpacity>
        </View>
      </View>

      {showFAQ && messages.length === 0 && (
        <View style={styles.faqContainer}>
          <Text style={styles.faqTitle}>💡 Perguntas Frequentes - Respostas Rápidas</Text>
          <Text style={styles.faqSubtitle}>Toque em uma pergunta para ver a resposta instantaneamente</Text>
          {FAQ_FINANCEIRO.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqCard}
              onPress={() => handleFAQClick(item)}
            >
              <Text style={styles.faqQuestion}>❓ {item.pergunta}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.divider} />
          <Text style={styles.contextTitle}>Ou pergunte ao Assistente IA</Text>
          <Text style={styles.contextText}>Use a IA para perguntas personalizadas sobre seu negócio</Text>
          <View style={styles.suggestionsRow}>
            <TouchableOpacity style={styles.suggestionChip} onPress={() => setMessage("Me ajude a precificar um serviço de pintura residencial de 50m².")}>
              <Text style={styles.suggestionText}>Precificação</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.suggestionChip} onPress={() => setMessage("Organize meu fluxo de caixa do mês com entradas e saídas previstas.")}>
              <Text style={styles.suggestionText}>Fluxo de Caixa</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={showChats} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setShowChats(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Conversas</Text>
          <FlatList
            data={chats}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.chatItemRow}>
                <Pressable onPress={() => selectChat(item.id)} style={styles.chatItem}>
                  <Text style={styles.chatTitle}>{item.title || "Chat IA"}</Text>
                  <Text style={styles.chatMeta}>{item.message_count} mensagens</Text>
                </Pressable>
                <TouchableOpacity style={styles.chatDelete} onPress={() => deleteChat(item.id)}>
                  <Text style={styles.chatDeleteText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyChats}>Você ainda não tem conversas.</Text>}
          />
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowChats(false)}>
            <Text style={styles.modalCloseText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.chatContainer}>
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={MessageRow}
          keyExtractor={(_, idx) => String(idx)}
          inverted={true} // newest at bottom visually
          contentContainerStyle={{ padding: spacing.sm, paddingBottom: 20 }}
          ListFooterComponent={typing ? <View style={styles.typingRow}><ActivityIndicator size="small" color={colors.primary} /><Text style={styles.typingText}>IA está escrevendo...</Text></View> : null}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Digite sua mensagem..."
          style={styles.input}
          multiline
          editable={!loading}
          placeholderTextColor={colors.textLight}
        />
        <TouchableOpacity
          style={[styles.sendButton, (loading || !message.trim()) && { opacity: 0.6 }]}
          onPress={sendMessage}
          disabled={loading || !message.trim()}
        >
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.sendButtonText}>Enviar</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerBlocked: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  headerButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, marginLeft: spacing.sm },
  headerButtonText: { color: colors.white, fontFamily: fonts.medium },
  headerButtonOutline: { borderColor: colors.primary, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, marginLeft: spacing.sm },
  headerButtonOutlineText: { color: colors.primary, fontFamily: fonts.medium },

  faqContainer: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, margin: spacing.sm, padding: spacing.md, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  faqTitle: { fontFamily: fonts.bold, color: colors.text, fontSize: 18, marginBottom: spacing.xs },
  faqSubtitle: { fontFamily: fonts.regular, color: colors.textLight, fontSize: 14, marginBottom: spacing.md },
  faqCard: { backgroundColor: colors.secondary, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.primary },
  faqQuestion: { fontFamily: fonts.medium, color: colors.textDark, fontSize: 15 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  contextTitle: { fontFamily: fonts.bold, color: colors.text, fontSize: 16, marginBottom: spacing.xs },
  contextText: { fontFamily: fonts.regular, color: colors.textLight, marginTop: spacing.xs, fontSize: 14 },
  suggestionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  suggestionChip: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  suggestionText: { color: colors.white, fontFamily: fonts.medium, fontSize: 13 },

  chatContainer: { flex: 1 },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: spacing.xs },
  rowUser: { justifyContent: 'flex-end' },
  rowAi: { justifyContent: 'flex-start' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  avatarText: { fontFamily: fonts.bold, color: colors.textDark },
  messageBubble: { padding: spacing.md, borderRadius: borderRadius.lg, maxWidth: "75%", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  userBubble: { backgroundColor: colors.primaryDark, alignSelf: "flex-end" },
  aiBubble: { backgroundColor: colors.lightGray, alignSelf: "flex-start" },
  messageText: { fontSize: 16, fontFamily: fonts.regular, color: colors.text },
  localBadge: { fontSize: 11, fontFamily: fonts.medium, color: colors.success, marginTop: spacing.xs, fontStyle: 'italic' },

  typingRow: { flexDirection: "row", alignItems: "center", padding: 8, marginTop: 4 },
  typingText: { marginLeft: 8, color: colors.textLight },

  inputContainer: { flexDirection: "row", padding: spacing.sm, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm, maxHeight: 120, color: colors.text, backgroundColor: colors.white },
  sendButton: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, justifyContent: "center", alignItems: "center" },
  sendButtonText: { color: colors.white, fontFamily: fonts.bold },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { maxHeight: "60%", backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: spacing.md },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold, marginBottom: spacing.sm },
  chatItemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm },
  chatItem: { flex: 1 },
  chatTitle: { fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  chatMeta: { fontSize: 12, color: colors.textLight },
  chatDelete: { marginLeft: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: colors.lightGray, borderRadius: borderRadius.sm },
  chatDeleteText: { color: colors.error, fontFamily: fonts.medium },
  emptyChats: { textAlign: "center", color: colors.textLight, marginTop: spacing.sm },

  blockedText: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginTop: 60 },
  subtitle: { fontSize: 16, textAlign: "center", marginTop: 10, color: "#666" },
  proButton: { backgroundColor: "#FFD700", padding: 15, margin: 20, borderRadius: 10, alignItems: "center" },
  proButtonText: { fontSize: 18, fontWeight: "bold", color: "#000" },

  modalClose: { marginTop: spacing.sm, backgroundColor: colors.primary, padding: spacing.sm, borderRadius: borderRadius.md, alignItems: "center" },
  modalCloseText: { color: colors.white, fontFamily: fonts.medium },
});
