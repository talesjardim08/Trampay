import React, { useState, useEffect } from "react";
import { View, TextInput, Button, ScrollView, Text, Image } from "react-native";
import api from "../authService";

export default function IAScreen() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/ai/chat", { message });
      setChat([...chat, { sender: "user", text: message }, { sender: "ai", text: res.data.response }]);
      setMessage("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/ai/chats").then(r => setChat(r.data || []));
  }, []);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <ScrollView>
        {chat.map((c, i) => (
          <Text key={i} style={{ color: c.sender === "ai" ? "blue" : "black" }}>
            {c.sender.toUpperCase()}: {c.text}
          </Text>
        ))}
      </ScrollView>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Digite sua mensagem"
        style={{ borderWidth: 1, padding: 8, marginVertical: 5 }}
      />
      <Button title={loading ? "Enviando..." : "Enviar"} onPress={sendMessage} />
    </View>
  );
}
