// Tela de Serviços com calendário e agenda - Trampay
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';
import SecureStorage from '../utils/SecureStorage';

// Componentes dos modals
import AddServiceModal from '../components/AddServiceModal';
import ServiceDetailsModal from '../components/ServiceDetailsModal';
import PaymentConfirmationModal from '../components/PaymentConfirmationModal';
import ServiceTemplateModal from '../components/ServiceTemplateModal';

const ServicesScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [services, setServices] = useState([]);
  const [serviceTemplates, setServiceTemplates] = useState([]);
  const [clients, setClients] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [templateDetailsModalVisible, setTemplateDetailsModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' ou 'roster'

  // Carrega dados salvos ao iniciar
  useEffect(() => {
    loadData();
  }, []);

  // Executa migração de dados na inicialização
  useEffect(() => {
    const performMigration = async () => {
      try {
        const results = await SecureStorage.migrateAllSensitiveData();
        console.log('Resultados da migração:', results);
      } catch (error) {
        console.error('Erro na migração de dados:', error);
      }
    };
    performMigration();
  }, []);

  const loadData = async () => {
    try {
      // Usa SecureStorage para dados sensíveis e AsyncStorage para templates
      const [savedServices, savedTemplates, savedClients] = await Promise.all([
        SecureStorage.getItem('userServices'),
        AsyncStorage.getItem('serviceTemplates'),
        SecureStorage.getItem('userClients')
      ]);

      if (savedServices) setServices(savedServices);
      if (savedTemplates) setServiceTemplates(JSON.parse(savedTemplates));
      if (savedClients) setClients(savedClients);
    } catch (error) {
      console.error('Erro ao carregar dados seguros:', error);
      // Fallback para AsyncStorage em caso de erro
      try {
        const [fallbackServices, fallbackTemplates, fallbackClients] = await Promise.all([
          AsyncStorage.getItem('userServices'),
          AsyncStorage.getItem('serviceTemplates'),
          AsyncStorage.getItem('userClients')
        ]);

        if (fallbackServices) setServices(JSON.parse(fallbackServices));
        if (fallbackTemplates) setServiceTemplates(JSON.parse(fallbackTemplates));
        if (fallbackClients) setClients(JSON.parse(fallbackClients));
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
      }
    }
  };

  const saveData = async () => {
    try {
      // Usa SecureStorage para dados sensíveis e AsyncStorage para templates
      await Promise.all([
        SecureStorage.setItem('userServices', services),
        AsyncStorage.setItem('serviceTemplates', JSON.stringify(serviceTemplates)),
        SecureStorage.setItem('userClients', clients)
      ]);
    } catch (error) {
      console.error('Erro ao salvar dados seguros:', error);
      // Em caso de erro crítico, exibe alerta de segurança
      Alert.alert(
        'Erro de Segurança',
        'Não foi possível salvar os dados de forma segura. Por favor, tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  // Salva dados sempre que houver mudanças
  useEffect(() => {
    saveData();
  }, [services, serviceTemplates, clients]);

  // Função para gerar calendário
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Função para verificar se uma data tem serviços
  const hasServices = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return services.some(service => service.date === dateStr);
  };

  // Função para obter serviços de uma data
  const getServicesForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return services.filter(service => service.date === dateStr);
  };

  // Função para agrupar serviços por período
  const getGroupedServices = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const groups = {
      today: [],
      thisWeek: [],
      future: []
    };

    services.forEach(service => {
      const serviceDate = new Date(service.date);
      if (serviceDate.toDateString() === today.toDateString()) {
        groups.today.push(service);
      } else if (serviceDate <= nextWeek) {
        groups.thisWeek.push(service);
      } else {
        groups.future.push(service);
      }
    });

    return groups;
  };

  // Função para adicionar novo serviço
  const handleAddService = (serviceData) => {
    const newService = {
      id: Date.now().toString(),
      ...serviceData,
      status: 'pending',
      paid: false,
      createdAt: new Date().toISOString()
    };
    setServices([...services, newService]);
    setModalVisible(false);
  };

  // Função para abrir detalhes do serviço
  const handleServicePress = (service) => {
    setSelectedService(service);
    const serviceDate = new Date(service.date);
    const now = new Date();
    
    // Se o serviço é hoje ou já passou, mostra opções de conclusão
    if (serviceDate <= now) {
      setPaymentModalVisible(true);
    }
  };

  // Função para marcar serviço como pago/concluído
  const handleServiceCompletion = (serviceId, completion) => {
    const updatedServices = services.map(service => 
      service.id === serviceId 
        ? { ...service, ...completion }
        : service
    );
    setServices(updatedServices);
    setPaymentModalVisible(false);
    setSelectedService(null);
  };

  // Função para adicionar template de serviço
  const handleAddTemplate = (templateData) => {
    const updatedTemplates = [...serviceTemplates, templateData];
    setServiceTemplates(updatedTemplates);
    setTemplateModalVisible(false);
  };

  // Função para excluir template
  const handleDeleteTemplate = (templateId) => {
    Alert.alert(
      'Excluir Template',
      'Tem certeza que deseja excluir este template?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            const updatedTemplates = serviceTemplates.filter(t => t.id !== templateId);
            setServiceTemplates(updatedTemplates);
          }
        }
      ]
    );
  };

  // Função para abrir detalhes do template
  const handleViewTemplateDetails = (template) => {
    setSelectedTemplate(template);
    setTemplateDetailsModalVisible(true);
  };

  // Função para obter nomes dos clientes do template
  const getTemplateClientsNames = (selectedClients) => {
    if (!selectedClients || selectedClients.length === 0) {
      return 'Nenhum cliente específico';
    }
    
    const clientNames = selectedClients
      .map(clientId => clients.find(client => client.id === clientId)?.name)
      .filter(Boolean);
    
    if (clientNames.length === 0) return 'Clientes não encontrados';
    if (clientNames.length === 1) return clientNames[0];
    if (clientNames.length <= 3) return clientNames.join(', ');
    return `${clientNames.slice(0, 2).join(', ')} e mais ${clientNames.length - 2}`;
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const groupedServices = getGroupedServices();

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
        
        <Text style={styles.headerTitle}>Serviços</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Switch */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <MaterialIcons 
            name="calendar-today" 
            size={20} 
            color={activeTab === 'calendar' ? colors.primaryDark : colors.white} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'roster' && styles.activeTab]}
          onPress={() => setActiveTab('roster')}
        >
          <MaterialIcons 
            name="list" 
            size={20} 
            color={activeTab === 'roster' ? colors.primaryDark : colors.white} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'calendar' ? (
          <>
            {/* Calendar */}
            <View style={styles.calendarContainer}>
              {/* Calendar Header */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() - 1);
                    setCurrentMonth(newMonth);
                  }}
                >
                  <MaterialIcons name="chevron-left" size={24} color={colors.primaryDark} />
                </TouchableOpacity>
                
                <Text style={styles.monthYear}>
                  {monthNames[currentMonth.getMonth()]}
                </Text>
                
                <TouchableOpacity
                  onPress={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() + 1);
                    setCurrentMonth(newMonth);
                  }}
                >
                  <MaterialIcons name="chevron-right" size={24} color={colors.primaryDark} />
                </TouchableOpacity>
              </View>

              {/* Week Days */}
              <View style={styles.weekDaysContainer}>
                {weekDays.map((day, index) => (
                  <Text key={index} style={styles.weekDay}>{day}</Text>
                ))}
              </View>

              {/* Calendar Days */}
              <View style={styles.calendarGrid}>
                {generateCalendar().map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const hasServicesOnDate = hasServices(date);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarDay,
                        !isCurrentMonth && styles.otherMonthDay,
                        isToday && styles.today,
                        isSelected && styles.selectedDay,
                        hasServicesOnDate && styles.dayWithServices
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[
                        styles.dayText,
                        !isCurrentMonth && styles.otherMonthText,
                        (isToday || isSelected) && styles.selectedDayText,
                        hasServicesOnDate && styles.dayWithServicesText
                      ]}>
                        {date.getDate()}
                      </Text>
                      {hasServicesOnDate && <View style={styles.serviceDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Add Service Button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addButtonText}>Marcar serviço</Text>
            </TouchableOpacity>

            {/* Services Agenda */}
            <View style={styles.agendaContainer}>
              <Text style={styles.agendaTitle}>Sua Agenda de Serviços</Text>
              
              {/* Today */}
              {groupedServices.today.length > 0 && (
                <View style={styles.agendaSection}>
                  <Text style={styles.sectionTitle}>Essa Semana</Text>
                  {groupedServices.today.map(service => (
                    <TouchableOpacity
                      key={service.id}
                      style={styles.serviceItem}
                      onPress={() => handleServicePress(service)}
                    >
                      <Text style={styles.serviceText}>
                        {service.serviceName} - {service.clientName} Dia {service.date.split('-')[2]}/{service.date.split('-')[1]} - {service.time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* This Week */}
              {groupedServices.thisWeek.length > 0 && (
                <View style={styles.agendaSection}>
                  <Text style={styles.sectionTitle}>Próxima Semana</Text>
                  {groupedServices.thisWeek.map(service => (
                    <TouchableOpacity
                      key={service.id}
                      style={styles.serviceItem}
                      onPress={() => handleServicePress(service)}
                    >
                      <Text style={styles.serviceText}>
                        {service.serviceName} - {service.clientName} Dia {service.date.split('-')[2]}/{service.date.split('-')[1]} - {service.time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Future */}
              {groupedServices.future.length > 0 && (
                <View style={styles.agendaSection}>
                  <Text style={styles.sectionTitle}>Futuros</Text>
                  {groupedServices.future.map(service => (
                    <TouchableOpacity
                      key={service.id}
                      style={styles.serviceItem}
                      onPress={() => handleServicePress(service)}
                    >
                      <Text style={styles.serviceText}>
                        {service.serviceName} - {service.clientName} Dia {service.date.split('-')[2]}/{service.date.split('-')[1]} - {service.time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Empty State */}
              {services.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Nenhum serviço agendado ainda.{'\n'}
                    Adicione seu primeiro serviço!
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          // Service Roster/Templates Tab
          <View style={styles.rosterContainer}>
            <Text style={styles.rosterTitle}>Plantel de Serviços</Text>
            <Text style={styles.rosterSubtitle}>
              Gerencie seus templates de serviços para agendamentos mais rápidos
            </Text>

            {/* Add Template Button */}
            <TouchableOpacity
              style={styles.addTemplateButton}
              onPress={() => setTemplateModalVisible(true)}
            >
              <MaterialIcons name="add" size={20} color={colors.white} />
              <Text style={styles.addTemplateButtonText}>Novo template</Text>
            </TouchableOpacity>

            {/* Templates List */}
            {serviceTemplates.length > 0 ? (
              <View style={styles.templatesContainer}>
                {serviceTemplates.map((template) => (
                  <View key={template.id} style={styles.templateItem}>
                    <View style={styles.templateHeader}>
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName}>{template.name}</Text>
                        <Text style={styles.templateDescription}>{template.description}</Text>
                      </View>
                      <View style={styles.templateActions}>
                        <Text style={styles.templatePrice}>R$ {template.defaultPrice.toFixed(2)}</Text>
                        <TouchableOpacity
                          style={styles.viewDetailsButton}
                          onPress={() => handleViewTemplateDetails(template)}
                        >
                          <MaterialIcons name="visibility" size={20} color={colors.primaryDark} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteTemplateButton}
                          onPress={() => handleDeleteTemplate(template.id)}
                        >
                          <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.templateDetails}>
                      <View style={styles.templateDetailItem}>
                        <MaterialIcons name="schedule" size={16} color={colors.textLight} />
                        <Text style={styles.templateDetailText}>{template.estimatedDuration}</Text>
                      </View>
                      
                      {template.requiredProducts && (
                        <View style={styles.templateDetailItem}>
                          <MaterialIcons name="inventory" size={16} color={colors.textLight} />
                          <Text style={styles.templateDetailText}>{template.requiredProducts}</Text>
                        </View>
                      )}
                      
                      {template.isHandled && (
                        <View style={styles.templateDetailItem}>
                          <MaterialIcons name="build" size={16} color={colors.primaryDark} />
                          <Text style={[styles.templateDetailText, { color: colors.primaryDark }]}>
                            Manuseável
                          </Text>
                        </View>
                      )}
                    </View>

                    {template.serviceDescription && (
                      <Text style={styles.templateFullDescription} numberOfLines={2}>
                        {template.serviceDescription}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyTemplatesState}>
                <MaterialIcons name="list-alt" size={80} color={colors.textLight} />
                <Text style={styles.emptyTemplatesTitle}>Nenhum template criado</Text>
                <Text style={styles.emptyTemplatesText}>
                  Crie templates de serviços para facilitar agendamentos futuros
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Service Modal */}
      <AddServiceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddService}
        clients={clients}
        serviceTemplates={serviceTemplates}
      />

      {/* Service Template Modal */}
      <ServiceTemplateModal
        visible={templateModalVisible}
        onClose={() => setTemplateModalVisible(false)}
        onAdd={handleAddTemplate}
        clients={clients}
      />

      {/* Payment Confirmation Modal */}
      {selectedService && (
        <PaymentConfirmationModal
          visible={paymentModalVisible}
          onClose={() => {
            setPaymentModalVisible(false);
            setSelectedService(null);
          }}
          service={selectedService}
          onComplete={handleServiceCompletion}
        />
      )}

      {/* Template Details Modal */}
      {selectedTemplate && (
        <Modal
          visible={templateDetailsModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setTemplateDetailsModalVisible(false);
            setSelectedTemplate(null);
          }}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => {
                  setTemplateDetailsModalVisible(false);
                  setSelectedTemplate(null);
                }}
              >
                <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
              </TouchableOpacity>
              
              <Text style={styles.modalHeaderTitle}>Detalhes do Template</Text>
              
              <View style={styles.modalHeaderSpacer} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Nome e Descrição */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Informações Básicas</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Nome:</Text>
                  <Text style={styles.detailValue}>{selectedTemplate.name}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Descrição:</Text>
                  <Text style={styles.detailValue}>{selectedTemplate.description}</Text>
                </View>
              </View>

              {/* Preço e Duração */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Preço e Tempo</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Preço Padrão:</Text>
                  <Text style={styles.detailValuePrice}>R$ {selectedTemplate.defaultPrice.toFixed(2)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Duração Estimada:</Text>
                  <Text style={styles.detailValue}>{selectedTemplate.estimatedDuration}</Text>
                </View>
                {selectedTemplate.defaultQuantity && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Quantidade Padrão:</Text>
                    <Text style={styles.detailValue}>{selectedTemplate.defaultQuantity}</Text>
                  </View>
                )}
              </View>

              {/* Produtos e Recursos */}
              {(selectedTemplate.requiredProducts || selectedTemplate.isHandled) && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Recursos Necessários</Text>
                  {selectedTemplate.requiredProducts && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Produtos do Estoque:</Text>
                      <Text style={styles.detailValue}>{selectedTemplate.requiredProducts}</Text>
                    </View>
                  )}
                  {selectedTemplate.isHandled && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Tipo de Serviço:</Text>
                      <Text style={[styles.detailValue, styles.handledService]}>Manuseável/Manipulável</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Clientes Recomendados */}
              {selectedTemplate.selectedClients && selectedTemplate.selectedClients.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Clientes Recomendados</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Clientes:</Text>
                    <Text style={styles.detailValue}>{getTemplateClientsNames(selectedTemplate.selectedClients)}</Text>
                  </View>
                </View>
              )}

              {/* Descrição Detalhada */}
              {selectedTemplate.serviceDescription && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Descrição Completa</Text>
                  <Text style={styles.fullDescription}>{selectedTemplate.serviceDescription}</Text>
                </View>
              )}

              {/* Data de Criação */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Informações do Sistema</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Criado em:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedTemplate.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.modalBottomSpacer} />
            </ScrollView>
          </View>
        </Modal>
      )}
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

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 25,
    padding: 4,
  },

  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 20,
  },

  activeTab: {
    backgroundColor: colors.primary,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  calendarContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.lg,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  monthYear: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },

  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },

  weekDay: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textLight,
    textAlign: 'center',
    width: 40,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  today: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
  },

  selectedDay: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },

  dayWithServices: {
    backgroundColor: '#e8f4fd',
    borderRadius: 20,
  },

  otherMonthDay: {
    opacity: 0.3,
  },

  dayText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  selectedDayText: {
    color: colors.white,
    fontFamily: fonts.bold,
  },

  dayWithServicesText: {
    color: colors.primaryDark,
    fontFamily: fonts.bold,
  },

  otherMonthText: {
    color: colors.textLight,
  },

  serviceDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
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

  agendaContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },

  agendaTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.lg,
  },

  agendaSection: {
    marginBottom: spacing.lg,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  serviceItem: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  serviceText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },

  emptyStateText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },

  rosterContainer: {
    paddingTop: spacing.lg,
  },

  rosterTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  rosterSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  addTemplateButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  addTemplateButtonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 16,
    marginLeft: spacing.sm,
  },

  templatesContainer: {
    flex: 1,
  },

  templateItem: {
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

  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },

  templateInfo: {
    flex: 1,
    marginRight: spacing.md,
  },

  templateName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },

  templateDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },

  templateActions: {
    alignItems: 'flex-end',
  },

  templatePrice: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },

  deleteTemplateButton: {
    padding: spacing.xs,
    backgroundColor: '#fee',
    borderRadius: 6,
  },

  templateDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },

  templateDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  templateDetailText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginLeft: spacing.xs,
  },

  templateFullDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  emptyTemplatesState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  emptyTemplatesTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  emptyTemplatesText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },

  // Estilos para botão "Ver detalhes"
  viewDetailsButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 8,
  },

  // Estilos para modal de detalhes do template
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  modalBackButton: {
    padding: spacing.sm,
    borderRadius: 8,
  },

  modalHeaderTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    textAlign: 'center',
  },

  modalHeaderSpacer: {
    width: 40,
  },

  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  detailSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
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

  detailSectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: spacing.sm,
  },

  detailItem: {
    marginBottom: spacing.md,
  },

  detailLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },

  detailValue: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 22,
  },

  detailValuePrice: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },

  handledService: {
    color: colors.primaryDark,
    fontFamily: fonts.medium,
  },

  fullDescription: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'justify',
  },

  modalBottomSpacer: {
    height: spacing.xl,
  },
});

export default ServicesScreen;