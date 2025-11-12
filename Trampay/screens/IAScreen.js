// src/screens/IAScreen.js
import React, { useContext, useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import * as ImagePicker from 'expo-image-picker';

const IAScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const res = await api.get('/ai/chats');
      setChats(res.data || []);
    } catch (e) {
      console.warn(e);
      Alert.alert('Erro', 'Não foi possível carregar chats.');
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const res = await api.get(`/ai/chats/${chatId}/messages`);
      setMessages(res.data || []);
      setSelectedChat(chatId);
    } catch (e) {
      console.warn(e);
      Alert.alert('Erro', 'Não foi possível carregar mensagens.');
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const body = { chatId: selectedChat, message: input };
      const res = await api.post('/ai/chat', body);
      if (res.data) {
        // recarrega mensagens
        await loadMessages(res.data.chatId);
        setInput('');
      }
    } catch (e) {
      console.warn(e);
      Alert.alert('Erro', 'Falha ao enviar mensagem.');
    } finally {
      setLoading(false);
    }
  };

  const pickImageAndUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão', 'Permissão de galeria negada.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ base64: false, quality: 0.8 });
    if (result.cancelled) return;

    const localUri = result.uri;
    const fileName = localUri.split('/').pop();
    const match = /\.(\w+)$/.exec(fileName ?? '');
    const type = match ? `image/${match[1]}` : `image`;

    const formData = new FormData();
    formData.append('File', {
      uri: localUri,
      name: fileName,
      type,
    });

    try {
      const res = await api.upload('/ai/image', formData);
      if (res.data) {
        // open chat created
        await loadChats();
        if (res.data.chatId) {
          await loadMessages(res.data.chatId);
        }
      }
    } catch (e) {
      console.warn(e);
      Alert.alert('Erro', 'Falha ao enviar imagem.');
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.msg, item.role === 'assistant' ? styles.assistant : styles.user]}>
      <Text>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.sectionTitle}>Seus Chats</Text>
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chatItem} onPress={() => loadMessages(item.id)}>
              <Text numberOfLines={1} style={{ fontWeight: '600' }}>{item.title || `Chat ${item.id}`}</Text>
              <Text style={{ fontSize: 12 }}>{item.message_count} mensagens</Text>
            </TouchableOpacity>
          )}
        />
        <Button title="Novo Chat" onPress={() => {
          setSelectedChat(null);
          setMessages([]);
        }} />
      </View>

      <View style={styles.right}>
        <View style={styles.chatHeader}>
          <Text style={{ fontWeight: '700' }}>{selectedChat ? `Chat ${selectedChat}` : 'Novo Chat'}</Text>
          <Button title="Enviar Imagem" onPress={pickImageAndUpload} />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          style={styles.messages}
        />

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Digite sua mensagem..."
            style={styles.input}
          />
          <Button title="Enviar" onPress={sendMessage} disabled={loading} />
        </View>
      </View>
    </View>
  );
};

export default IAScreen;

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  left: { width: 220, borderRightWidth: 1, borderRightColor: '#ddd', padding: 8 },
  right: { flex: 1, padding: 8 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  chatItem: { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  messages: { flex: 1 },
  msg: { marginVertical: 6, padding: 10, borderRadius: 8, maxWidth: '80%' },
  assistant: { backgroundColor: '#eef', alignSelf: 'flex-start' },
  user: { backgroundColor: '#fde', alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginRight: 8 },
});
