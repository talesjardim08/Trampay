// Tela de Clientes - Trampay
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  FlatList
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { colors, fonts, spacing } from '../styles';

// Componentes
import AddClientModal from '../components/AddClientModal';
import EditClientModal from '../components/EditClientModal';
import ClientHistoryModal from '../components/ClientHistoryModal';

const ClientsScreen = ({ navigation }) => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  // Filtra clientes baseado na pesquisa
  useEffect(() => {
    filterClients();
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      const rawClients = response.data.items || [];
      
      const normalizedClients = rawClients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.contact_email || '',
        phone: client.contact_phone || '',
        cpf: client.cpf || '',
        address: client.address || '',
        notes: client.notes || '',
        createdAt: client.created_at
      }));
      
      setClients(normalizedClients);
      setFilteredClients(normalizedClients);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os clientes');
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.cpf.includes(searchQuery) ||
      client.phone.includes(searchQuery) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredClients(filtered);
  };

  const handleAddClient = async (clientData) => {
    try {
      const payload = {
        name: clientData.name,
        contactEmail: clientData.email || null,
        contactPhone: clientData.phone || null,
        notes: clientData.notes || null
      };
      
      await api.post('/clients', payload);
      await loadClients();
      setModalVisible(false);
      Alert.alert('Sucesso', 'Cliente adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o cliente');
    }
  };

  const handleDeleteClient = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    
    Alert.alert(
      'Excluir Cliente',
      `Tem certeza que deseja excluir ${client?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/clients/${clientId}`);
              await loadClients();
              Alert.alert('Sucesso', 'Cliente removido com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir cliente:', error);
              Alert.alert('Erro', 'Não foi possível excluir o cliente');
            }
          }
        }
      ]
    );
  };

  // Função para visualizar detalhes do cliente
  const handleClientPress = (client) => {
    Alert.alert(
      'Detalhes do Cliente',
      `Nome: ${client.name}\nCPF: ${client.cpf}\nIdade: ${client.age} anos\nTelefone: ${client.phone}\nEmail: ${client.email}`,
      [
        {
          text: 'Ver Histórico',
          onPress: () => {
            setSelectedClient(client);
            setHistoryModalVisible(true);
          }
        },
        {
          text: 'Editar',
          onPress: () => {
            setSelectedClient(client);
            setEditModalVisible(true);
          }
        },
        {
          text: 'Fechar',
          style: 'cancel'
        }
      ]
    );
  };

  const handleEditClient = async (updatedClient) => {
    try {
      const payload = {
        name: updatedClient.name,
        contactEmail: updatedClient.email || null,
        contactPhone: updatedClient.phone || null,
        notes: updatedClient.notes || null
      };
      
      await api.put(`/clients/${updatedClient.id}`, payload);
      await loadClients();
      setEditModalVisible(false);
      setSelectedClient(null);
      Alert.alert('Sucesso', 'Cliente atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao editar cliente:', error);
      Alert.alert('Erro', 'Não foi possível editar o cliente');
    }
  };

  const renderClientItem = ({ item: client }) => (
    <View style={styles.clientItem}>
      <TouchableOpacity
        style={styles.clientContent}
        onPress={() => handleClientPress(client)}
      >
        {/* Avatar */}
        <View style={styles.clientAvatar}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="person" size={24} color={colors.primaryDark} />
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientDetails}>
            {client.phone} • {client.email}
          </Text>
          <Text style={styles.clientCpf}>CPF: {client.cpf}</Text>
        </View>
      </TouchableOpacity>

      {/* Delete Button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteClient(client.id)}
      >
        <MaterialIcons name="delete-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Clientes</Text>
        
        <View style={styles.headerSpacer} />
      </View>


      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquise aqui"
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Client List */}
        {filteredClients.length > 0 ? (
          <FlatList
            data={filteredClients}
            renderItem={renderClientItem}
            keyExtractor={(item) => item.id}
            style={styles.clientsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="people-outline" size={80} color={colors.textLight} />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum cliente cadastrado'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'Tente uma busca diferente' 
                : 'Adicione seu primeiro cliente para começar'
              }
            </Text>
          </View>
        )}

        {/* Add Client Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Novo cliente</Text>
        </TouchableOpacity>
      </View>

      {/* Add Client Modal */}
      <AddClientModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddClient}
      />

      {/* Edit Client Modal */}
      <EditClientModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedClient(null);
        }}
        onUpdate={handleEditClient}
        client={selectedClient}
      />

      {/* Client History Modal */}
      <ClientHistoryModal
        visible={historyModalVisible}
        onClose={() => {
          setHistoryModalVisible(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  backButton: {
    padding: spacing.sm,
    borderRadius: 8,
  },

  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    textAlign: 'center',
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  searchIcon: {
    marginRight: spacing.sm,
  },

  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  clientsList: {
    flex: 1,
  },

  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  clientContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  clientAvatar: {
    marginRight: spacing.md,
  },

  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },

  clientInfo: {
    flex: 1,
  },

  clientName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },

  clientDetails: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },

  clientCpf: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },

  deleteButton: {
    padding: spacing.sm,
    backgroundColor: '#fee',
    borderRadius: 8,
    marginLeft: spacing.sm,
  },

  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  addButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  emptyStateTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  emptyStateText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ClientsScreen;