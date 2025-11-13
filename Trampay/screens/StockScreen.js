// Tela de Gestão de Estoque - Trampay
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../services/api';
import { colors, fonts, spacing } from '../styles';
import AddStockItemModal from '../components/AddStockItemModal';
import StockItemDetailsModal from '../components/StockItemDetailsModal';

const StockScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [stockItems, setStockItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStockItems();
  }, []);

  const loadStockItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory');
      const rawItems = response.data.items || [];
      
      const normalizedStock = rawItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        category: item.category || 'Geral',
        quantity: item.quantity || 0,
        unit: item.unit || 'un',
        costPrice: item.cost_price || 0,
        sellingPrice: item.selling_price || 0,
        minStock: item.min_stock || 0,
        photoUrl: item.photo_url || '',
        createdAt: item.created_at
      }));
      
      setStockItems(normalizedStock);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
      Alert.alert('Erro', 'Não foi possível carregar o estoque');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      const payload = {
        name: itemData.name,
        description: itemData.description || '',
        category: itemData.category || 'Geral',
        quantity: parseFloat(itemData.quantity) || 0,
        unit: itemData.unit || 'un',
        costPrice: parseFloat(itemData.costPrice) || 0,
        sellingPrice: parseFloat(itemData.sellingPrice) || 0,
        minStock: parseFloat(itemData.minStock) || 0,
        photoUrl: itemData.photoUrl || null
      };
      
      await api.post('/inventory', payload);
      await loadStockItems();
      setAddModalVisible(false);
      
      if (payload.quantity === 0) {
        Alert.alert('Atenção!', `O item "${payload.name}" foi cadastrado com quantidade 0.`);
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o item');
    }
  };

  const handleEditItem = async (itemData) => {
    try {
      const payload = {
        name: itemData.name,
        description: itemData.description || '',
        category: itemData.category || 'Geral',
        quantity: parseFloat(itemData.quantity) || 0,
        unit: itemData.unit || 'un',
        costPrice: parseFloat(itemData.costPrice) || 0,
        sellingPrice: parseFloat(itemData.sellingPrice) || 0,
        minStock: parseFloat(itemData.minStock) || 0,
        photoUrl: itemData.photoUrl
      };
      
      await api.put(`/inventory/${itemData.id}`, payload);
      await loadStockItems();
      setDetailsModalVisible(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Erro ao editar item:', error);
      Alert.alert('Erro', 'Não foi possível editar o item');
    }
  };

  const handleDeleteItem = (item) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir o item "${item.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/inventory/${item.id}`);
              await loadStockItems();
            } catch (error) {
              console.error('Erro ao deletar item:', error);
              Alert.alert('Erro', 'Não foi possível deletar o item');
            }
          }
        }
      ]
    );
  };

  // Abrir detalhes do item
  const openItemDetails = (item) => {
    setSelectedItem(item);
    setDetailsModalVisible(true);
  };

  // Filtrar itens pela pesquisa
  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Contar itens com quantidade zero
  const zeroQuantityItems = stockItems.filter(item => item.quantity === 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estoque</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Workflow Bar */}
      <View style={styles.workflowBar}>
        <TouchableOpacity
          style={[styles.workflowTab, activeTab === 'list' && styles.workflowTabActive]}
          onPress={() => setActiveTab('list')}
        >
          <MaterialIcons 
            name="inventory-2" 
            size={20} 
            color={activeTab === 'list' ? colors.primaryDark : colors.white} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.workflowTab, activeTab === 'settings' && styles.workflowTabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <MaterialIcons 
            name="settings" 
            size={20} 
            color={activeTab === 'settings' ? colors.primaryDark : colors.white} 
          />
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'list' ? (
        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquise aqui"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <MaterialIcons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
          </View>

          {/* Zero Quantity Alert */}
          {zeroQuantityItems.length > 0 && (
            <View style={styles.alertContainer}>
              <MaterialIcons name="warning" size={20} color={colors.warning} />
              <Text style={styles.alertText}>
                {zeroQuantityItems.length} item(s) com estoque zerado
              </Text>
            </View>
          )}

          {/* Stock Items List */}
          <ScrollView style={styles.stockList} showsVerticalScrollIndicator={false}>
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.stockItem,
                  item.quantity === 0 && styles.stockItemZero
                ]}
                onPress={() => openItemDetails(item)}
              >
                <MaterialIcons 
                  name="inventory-2" 
                  size={24} 
                  color={item.quantity === 0 ? colors.warning : colors.primaryDark} 
                />
                <View style={styles.stockItemInfo}>
                  <Text style={[
                    styles.stockItemName,
                    item.quantity === 0 && styles.stockItemNameZero
                  ]}>
                    {item.name}
                    {item.quantity === 0 && ' ⚠️'}
                  </Text>
                  <Text style={[
                    styles.stockItemQuantity,
                    item.quantity === 0 && styles.stockItemQuantityZero
                  ]}>
                    Qtd: {item.quantity}
                    {item.quantity === 0 && ' - ESTOQUE ESGOTADO'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteItem(item)}
                >
                  <MaterialIcons name="delete" size={20} color={colors.danger} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {filteredItems.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialIcons name="inventory-2" size={48} color={colors.textLight} />
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Add Item Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Novo Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Settings Tab Content
        <View style={styles.settingsContent}>
          <View style={styles.settingsCard}>
            <MaterialIcons name="inventory" size={24} color={colors.primaryDark} />
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsTitle}>Total de Itens</Text>
              <Text style={styles.settingsValue}>{stockItems.length}</Text>
            </View>
          </View>

          <View style={styles.settingsCard}>
            <MaterialIcons name="warning" size={24} color={colors.warning} />
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsTitle}>Itens com Estoque Zero</Text>
              <Text style={styles.settingsValue}>{zeroQuantityItems.length}</Text>
            </View>
          </View>

          <View style={styles.settingsCard}>
            <MaterialIcons name="attach-money" size={24} color={colors.success} />
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsTitle}>Valor Total do Estoque</Text>
              <Text style={styles.settingsValue}>
                R$ {stockItems.reduce((total, item) => total + (item.costPrice * item.quantity), 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Modals */}
      <AddStockItemModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddItem}
        services={services}
      />

      <StockItemDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        item={selectedItem}
        onEdit={handleEditItem}
        services={services}
      />
    </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: 'center',
    marginRight: 32,
  },
  headerSpacer: {
    width: 32,
  },
  workflowBar: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 25,
    padding: 4,
  },
  workflowTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 21,
  },
  workflowTabActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingRight: 40,
    fontSize: 16,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.sm + 2,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  alertText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.warning,
  },
  stockList: {
    flex: 1,
    marginBottom: spacing.md,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stockItemZero: {
    borderColor: colors.warning,
    backgroundColor: colors.warningLight,
  },
  stockItemInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  stockItemName: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  stockItemQuantity: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: 2,
  },
  stockItemNameZero: {
    color: colors.warning,
    fontFamily: fonts.bold,
  },
  stockItemQuantityZero: {
    color: colors.warning,
    fontFamily: fonts.bold,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: spacing.md,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  settingsContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsInfo: {
    marginLeft: spacing.md,
  },
  settingsTitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
  settingsValue: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginTop: 2,
  },
});

export default StockScreen;