// Sistema de roteamento centralizado do Trampay
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importação das telas
import SplashScreen from './SplashScreen';
import LoginScreen from './LoginScreen';
import CreateAccountScreen from './CreateAccountScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import TwoFactorAuthScreen from './TwoFactorAuthScreen';
import HomeScreen from './HomeScreen';

// Importação dos componentes
import SideMenu from './components/SideMenu';
import EditProfileScreen from './screens/EditProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';

// Importação das telas de negócio
import MyBusinessScreen from './screens/MyBussinessScreen';
import ServicesScreen from './screens/ServicesScreen';
import ClientsScreen from './screens/ClientScreen';
import InventoryScreen from './screens/IventoryScreen';
import StockScreen from './screens/StockScreen';
import EquipmentsScreen from './screens/EquipmentsScreen';
import CashFlowScreen from './screens/CashFlowScreen';
import PricingScreen from './screens/PricingScreen';

// Importação das telas de Trading
import TradingHomeScreen from './screens/TradingHomeScreen';
import CurrencyScreen from './screens/CurrencyScreen';
import CryptoScreen from './screens/CryptoScreen';
import StocksScreen from './screens/StocksScreen';

// Importação da tela de Simulador de Impostos
import TaxSimulatorScreen from './screens/TaxSimulatorScreen';

const Stack = createStackNavigator();

// Componente principal de navegação
const AppRoutes = ({ 
  isLoading = true, 
  isAuthenticated = false,
  onSplashFinish,
  onLogin,
  onCreateAccount,
  user
}) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Remove header padrão para design customizado
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        {/* Tela Splash - Primeira tela mostrada */}
        <Stack.Screen 
          name="Splash" 
          options={{ 
            animationEnabled: false,
            gestureEnabled: false 
          }}
        >
          {props => (
            <SplashScreen 
              {...props} 
              onFinish={onSplashFinish}
            />
          )}
        </Stack.Screen>

        {/* Tela de Login */}
        <Stack.Screen 
          name="Login"
          options={{ title: 'Login' }}
        >
          {props => (
            <LoginScreen 
              {...props} 
              onLogin={onLogin}
            />
          )}
        </Stack.Screen>

        {/* Tela de Criação de Conta */}
        <Stack.Screen 
          name="CreateAccount"
          options={{ 
            title: 'Criar Conta',
            headerShown: false
          }}
        >
          {props => (
            <CreateAccountScreen 
              {...props} 
              onCreateAccount={onCreateAccount}
            />
          )}
        </Stack.Screen>

        {/* Tela de Esqueci a Senha */}
        <Stack.Screen 
          name="ForgotPassword"
          options={{ 
            title: 'Esqueci a Senha',
            headerShown: false
          }}
          component={ForgotPasswordScreen}
        />

        {/* Tela de Verificação em Duas Etapas */}
        <Stack.Screen 
          name="TwoFactorAuth"
          options={{ 
            title: 'Verificação 2FA',
            headerShown: false
          }}
          component={TwoFactorAuthScreen}
        />

        {/* Tela Home - será implementada nas próximas fases */}
        <Stack.Screen 
          name="Home"
          options={{ 
            title: 'Home',
            headerShown: false,
            gestureEnabled: false
          }}
        >
          {props => (
            <HomeScreen {...props} user={user} />
          )}
        </Stack.Screen>

        {/* Novas telas funcionais */}
        <Stack.Screen 
          name="SideMenu" 
          options={{ headerShown: false, presentation: 'modal' }}
        >
          {props => (
            <SideMenu {...props} user={user} />
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="EditProfile" 
          options={{ headerShown: false }}
        >
          {props => (
            <EditProfileScreen {...props} user={user} />
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen}
          options={{ headerShown: false }}
        />

        {/* Telas de Meu Negócio */}
        <Stack.Screen 
          name="MeuNegocio" 
          component={MyBusinessScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="Services" 
          component={ServicesScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="Clients" 
          component={ClientsScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="Inventory" 
          component={InventoryScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="Stock" 
          component={StockScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="Equipments" 
          component={EquipmentsScreen}
          options={{ headerShown: false }}
        />

        {/* Tela de Fluxo de Caixa */}
        <Stack.Screen 
          name="FluxoCaixa" 
          component={CashFlowScreen}
          options={{ headerShown: false }}
        />

        {/* Tela de Precificação */}
        <Stack.Screen 
          name="Precificacao" 
          component={PricingScreen}
          options={{ headerShown: false }}
        />
        {/* Telas de Trading e Câmbio */}
        <Stack.Screen 
          name="CambioTrading" 
          component={TradingHomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CurrencyTrading" 
          component={CurrencyScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CryptoTrading" 
          component={CryptoScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="StocksTrading" 
          component={StocksScreen}
          options={{ headerShown: false }}
        />
        {/* Tela de Simulador de Impostos */}
        <Stack.Screen 
          name="TaxSimulator" 
          component={TaxSimulatorScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="AdicionarTransacao" component={StubScreen} options={{ title: 'Adicionar Transação' }} />
        <Stack.Screen name="Logout" component={StubScreen} options={{ title: 'Logout' }} />
        
        {/* Telas PRO implementadas */}
        <Stack.Screen 
          name="TrampayIA" 
          component={require('./screens/IAScreen').default}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AssinePro" 
          component={require('./screens/AssineProScreen').default}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Tela stub temporária para funcionalidades ainda não implementadas
const StubScreen = ({ navigation, route }) => {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      padding: 20
    }}>
      <Text style={{
        fontSize: 24,
        fontFamily: 'Poppins-Bold',
        color: '#2d4e75',
        marginBottom: 20,
        textAlign: 'center'
      }}>
        {route.params?.title || route.name}
      </Text>
      
      <Text style={{
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: '#999999',
        textAlign: 'center',
        marginBottom: 30
      }}>
        Esta funcionalidade será{'\n'}
        implementada em breve.
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: '#ffc236',
          paddingHorizontal: 30,
          paddingVertical: 15,
          borderRadius: 12
        }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{
          color: '#ffffff',
          fontFamily: 'Poppins-SemiBold',
          fontSize: 16
        }}>
          Voltar
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AppRoutes;