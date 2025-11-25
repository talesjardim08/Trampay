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
  TouchableWithoutFeedback,
  SafeAreaView,
  StatusBar
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
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

    setMessages((prev) => [{ role: "user", content: userMessage }, ...prev]);

    try {
      const res = await api.post("/ai/chat", {
        message: userMessage,
        chatId: currentChatId,
      });

      const aiResponse = res.data?.response ?? "[Sem resposta]";

      if (res.data?.chatId && !currentChatId) {
        setCurrentChatId(res.data.chatId);
        setChats((prev) => [{ id: res.data.chatId, title: "Chat IA", updated_at: new Date().toISOString(), message_count: 0 }, ...prev]);
      }

      setMessages((prev) => [{ role: "assistant", content: aiResponse }, ...prev]);

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
      setTimeout(() => {
        try { listRef.current?.scrollToOffset({ offset: 0, animated: true }); } catch {}
      }, 150);
    }
  };

  const newChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setShowFAQ(true);
  };

  const selectChat = async (chatId) => {
    setCurrentChatId(chatId);
    await loadMessages(chatId);
    setShowChats(false);
    setShowFAQ(false);
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

  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setString(text);
      Alert.alert("Copiado", "Texto copiado para a área de transferência.");
    } catch (e) {
      console.warn("Clipboard error:", e);
    }
  };

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
          <Text selectable style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
          {isLocal && <Text style={styles.localBadge}>Resposta rápida</Text>}
        </TouchableOpacity>
        {isUser && <View style={styles.avatar}><Text style={styles.avatarText}>EU</Text></View>}
      </View>
    );
  };

  if (!isPro) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.containerBlocked}>
          <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.backButtonBlocked}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.blockedText}>🔒 Recurso Premium</Text>
          <Text style={styles.subtitle}>A IA é exclusiva para usuários PRO.</Text>
          <TouchableOpacity style={styles.proButton} onPress={() => navigation.navigate("AssinePro")}>
            <Text style={styles.proButtonText}>Assinar PRO</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header simplificado - apenas botão voltar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>IA Assistant</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowChats(true)} style={styles.iconButton}>
              <MaterialIcons name="chat-bubble-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={newChat} style={styles.iconButton}>
              <MaterialIcons name="add-circle-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        {showFAQ && messages.length === 0 && (
          <View style={styles.faqContainer}>
            <Text style={styles.faqTitle}>💡 Perguntas Frequentes</Text>
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
              <TouchableOpacity 
                style={styles.suggestionChip} 
                onPress={() => setMessage("Me ajude a precificar um serviço de pintura residencial de 50m².")}
              >
                <Text style={styles.suggestionText}>Precificação</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.suggestionChip} 
                onPress={() => setMessage("Organize meu fluxo de caixa do mês com entradas e saídas previstas.")}
              >
                <Text style={styles.suggestionText}>Fluxo de Caixa</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Modal de conversas */}
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
                    <MaterialIcons name="delete-outline" size={20} color={colors.error} />
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

        {/* Lista de mensagens */}
        <View style={styles.chatContainer}>
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={MessageRow}
            keyExtractor={(_, idx) => String(idx)}
            inverted={true}
            contentContainerStyle={styles.messagesList}
            ListFooterComponent={
              typing ? (
                <View style={styles.typingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.typingText}>IA está escrevendo...</Text>
                </View>
              ) : null
            }
          />
        </View>

        {/* Input de mensagem - fixo na parte inferior */}
        <View style={styles.inputContainer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Digite sua mensagem..."
            style={styles.input}
            multiline
            maxLength={1000}
            editable={!loading}
            placeholderTextColor={colors.textLight}
          />
          <TouchableOpacity
            style={[styles.sendButton, (loading || !message.trim()) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={loading || !message.trim()}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <MaterialIcons name="send" size={22} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  containerBlocked: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: colors.background,
    padding: spacing.lg
  },
  backButtonBlocked: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    padding: spacing.sm,
    zIndex: 10
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.md, 
    paddingTop: spacing.lg,
    backgroundColor: colors.white, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 }
  },
  backButton: { 
    padding: spacing.xs 
  },
  title: { 
    fontSize: 18, 
    fontFamily: fonts.bold, 
    color: colors.text,
    flex: 1,
    marginLeft: spacing.sm
  },
  headerActions: { 
    flexDirection: "row", 
    gap: spacing.sm 
  },
  iconButton: {
    padding: spacing.xs
  },

  faqContainer: { 
    backgroundColor: colors.white, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: borderRadius.lg, 
    margin: spacing.md, 
    padding: spacing.md, 
    shadowColor: "#000", 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 3 
  },
  faqTitle: { 
    fontFamily: fonts.bold, 
    color: colors.text, 
    fontSize: 18, 
    marginBottom: spacing.xs 
  },
  faqSubtitle: { 
    fontFamily: fonts.regular, 
    color: colors.textLight, 
    fontSize: 13, 
    marginBottom: spacing.md 
  },
  faqCard: { 
    backgroundColor: "#f8f9fa", 
    borderRadius: borderRadius.md, 
    padding: spacing.md, 
    marginBottom: spacing.sm, 
    borderLeftWidth: 3, 
    borderLeftColor: colors.primary 
  },
  faqQuestion: { 
    fontFamily: fonts.medium, 
    color: colors.textDark, 
    fontSize: 14 
  },
  divider: { 
    height: 1, 
    backgroundColor: colors.border, 
    marginVertical: spacing.lg 
  },
  contextTitle: { 
    fontFamily: fonts.bold, 
    color: colors.text, 
    fontSize: 16, 
    marginBottom: spacing.xs 
  },
  contextText: { 
    fontFamily: fonts.regular, 
    color: colors.textLight, 
    marginTop: spacing.xs, 
    fontSize: 13 
  },
  suggestionsRow: { 
    flexDirection: 'row', 
    gap: spacing.sm, 
    marginTop: spacing.md, 
    flexWrap: 'wrap' 
  },
  suggestionChip: { 
    backgroundColor: colors.primary, 
    borderRadius: 999, 
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.sm 
  },
  suggestionText: { 
    color: colors.white, 
    fontFamily: fonts.medium, 
    fontSize: 13 
  },

  chatContainer: { 
    flex: 1,
    backgroundColor: colors.background
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.lg
  },

  messageRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    marginVertical: spacing.xs,
    maxWidth: '85%'
  },
  rowUser: { 
    justifyContent: 'flex-end',
    alignSelf: 'flex-end'
  },
  rowAi: { 
    justifyContent: 'flex-start',
    alignSelf: 'flex-start'
  },
  avatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: colors.secondary, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginHorizontal: spacing.xs 
  },
  avatarText: { 
    fontFamily: fonts.bold, 
    color: colors.textDark,
    fontSize: 12
  },
  messageBubble: { 
    padding: spacing.md, 
    borderRadius: borderRadius.lg, 
    maxWidth: "100%", 
    shadowColor: "#000", 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    elevation: 2 
  },
  userBubble: { 
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4
  },
  aiBubble: { 
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4
  },
  messageText: { 
    fontSize: 15, 
    fontFamily: fonts.regular, 
    color: colors.textDark,
    lineHeight: 20
  },
  userMessageText: {
    color: colors.white
  },
  localBadge: { 
    fontSize: 11, 
    fontFamily: fonts.medium, 
    color: colors.success, 
    marginTop: spacing.xs, 
    fontStyle: 'italic' 
  },

  typingRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: spacing.sm, 
    marginTop: spacing.xs 
  },
  typingText: { 
    marginLeft: spacing.sm, 
    color: colors.textLight,
    fontFamily: fonts.regular,
    fontSize: 14
  },

  inputContainer: { 
    flexDirection: "row", 
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white, 
    borderTopWidth: 1, 
    borderTopColor: colors.border,
    alignItems: 'flex-end'
  },
  input: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: borderRadius.lg, 
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.sm, 
    marginRight: spacing.sm, 
    maxHeight: 100, 
    minHeight: 44, 
    color: colors.textDark, 
    backgroundColor: colors.background,
    fontFamily: fonts.regular,
    fontSize: 15
  },
  sendButton: { 
    backgroundColor: colors.primary, 
    borderRadius: borderRadius.lg, 
    width: 44,
    height: 44,
    justifyContent: "center", 
    alignItems: "center",
    elevation: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  sendButtonDisabled: {
    opacity: 0.5
  },

  modalBackdrop: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)" 
  },
  modalContent: { 
    maxHeight: "70%", 
    backgroundColor: colors.white, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: spacing.lg 
  },
  modalTitle: { 
    fontSize: 20, 
    fontFamily: fonts.bold, 
    marginBottom: spacing.md,
    color: colors.text
  },
  chatItemRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  chatItem: { 
    flex: 1 
  },
  chatTitle: { 
    fontSize: 16, 
    fontFamily: fonts.semibold, 
    color: colors.text 
  },
  chatMeta: { 
    fontSize: 12, 
    color: colors.textLight,
    marginTop: 2
  },
  chatDelete: { 
    marginLeft: spacing.md, 
    padding: spacing.sm
  },
  emptyChats: { 
    textAlign: "center", 
    color: colors.textLight, 
    marginTop: spacing.lg,
    fontFamily: fonts.regular
  },

  blockedText: { 
    fontSize: 24, 
    fontFamily: fonts.bold, 
    textAlign: "center", 
    marginTop: 60,
    color: colors.text
  },
  subtitle: { 
    fontSize: 16, 
    textAlign: "center", 
    marginTop: spacing.md, 
    color: colors.textLight,
    fontFamily: fonts.regular
  },
  proButton: { 
    backgroundColor: "#FFD700", 
    padding: spacing.lg, 
    margin: spacing.lg, 
    borderRadius: borderRadius.lg, 
    alignItems: "center",
    minWidth: 200
  },
  proButtonText: { 
    fontSize: 18, 
    fontFamily: fonts.bold, 
    color: "#000" 
  },

  modalClose: { 
    marginTop: spacing.md, 
    backgroundColor: colors.primary, 
    padding: spacing.md, 
    borderRadius: borderRadius.lg, 
    alignItems: "center" 
  },
  modalCloseText: { 
    color: colors.white, 
    fontFamily: fonts.medium,
    fontSize: 16
  },
});
