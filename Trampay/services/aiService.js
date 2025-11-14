// Serviço de IA - Trampay
import api from './api';

/**
 * Envia mensagem para o chat de IA
 * @param {string} message - Mensagem do usuário
 * @param {number|null} chatId - ID do chat existente (opcional)
 * @param {string|null} title - Título do chat (opcional, para novo chat)
 * @returns {Promise<{chatId: number, response: string}>}
 */
export const sendChatMessage = async (message, chatId = null, title = null) => {
  try {
    const response = await api.post('/ai/chat', {
      message,
      chatId,
      title,
    });
    return response.data;
  } catch (error) {
    console.error('[AI Service] Erro ao enviar mensagem:', error);
    throw error;
  }
};

/**
 * Busca lista de chats do usuário
 * @returns {Promise<Array>}
 */
export const fetchChats = async () => {
  try {
    const response = await api.get('/ai/chats');
    return response.data || [];
  } catch (error) {
    console.error('[AI Service] Erro ao buscar chats:', error);
    throw error;
  }
};

/**
 * Busca detalhes de um chat específico
 * @param {number} chatId - ID do chat
 * @returns {Promise<Object>}
 */
export const fetchChat = async (chatId) => {
  try {
    const response = await api.get(`/ai/chats/${chatId}`);
    return response.data;
  } catch (error) {
    console.error('[AI Service] Erro ao buscar chat:', error);
    throw error;
  }
};

/**
 * Busca mensagens de um chat
 * @param {number} chatId - ID do chat
 * @returns {Promise<Array>}
 */
export const fetchChatMessages = async (chatId) => {
  try {
    const response = await api.get(`/ai/chats/${chatId}/messages`);
    return response.data || [];
  } catch (error) {
    console.error('[AI Service] Erro ao buscar mensagens:', error);
    throw error;
  }
};

/**
 * Deleta um chat
 * @param {number} chatId - ID do chat
 * @returns {Promise<void>}
 */
export const deleteChat = async (chatId) => {
  try {
    await api.delete(`/ai/chats/${chatId}`);
  } catch (error) {
    console.error('[AI Service] Erro ao deletar chat:', error);
    throw error;
  }
};

/**
 * Analisa imagem usando OCR (Optical Character Recognition)
 * @param {Object} imageFile - Arquivo de imagem (File ou objeto compatível)
 * @returns {Promise<{success: boolean, text: string, filename: string, message: string}>}
 */
export const analyzeImage = async (imageFile) => {
  try {
    const formData = new FormData();
    
    // Verifica se é um objeto File ou precisa ser convertido
    if (imageFile.uri) {
      // React Native: converte URI para blob
      const response = await fetch(imageFile.uri);
      const blob = await response.blob();
      formData.append('file', blob, imageFile.name || 'image.jpg');
    } else {
      // Web: usa File diretamente
      formData.append('file', imageFile);
    }

    const response = await api.post('/ai/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('[AI Service] Erro ao analisar imagem:', error);
    
    // Trata erros específicos
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 403) {
        throw new Error('Este recurso é exclusivo para usuários PRO');
      }
      
      if (status === 400 && data?.error) {
        throw new Error(data.error);
      }
    }
    
    throw new Error('Erro ao processar imagem. Tente novamente.');
  }
};

/**
 * Helper: Valida se o arquivo é uma imagem válida
 * @param {File} file - Arquivo para validar
 * @returns {boolean}
 */
export const isValidImageFile = (file) => {
  if (!file) return false;
  
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  // Verifica tipo
  if (file.type && !validTypes.includes(file.type.toLowerCase())) {
    return false;
  }
  
  // Verifica tamanho
  if (file.size && file.size > maxSize) {
    return false;
  }
  
  return true;
};

/**
 * Helper: Formata mensagens para exibição
 * @param {Array} messages - Array de mensagens
 * @returns {Array}
 */
export const formatMessages = (messages) => {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.created_at,
  }));
};

export default {
  sendChatMessage,
  fetchChats,
  fetchChat,
  fetchChatMessages,
  deleteChat,
  analyzeImage,
  isValidImageFile,
  formatMessages,
};
