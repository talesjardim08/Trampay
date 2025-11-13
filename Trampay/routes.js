import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from './SplashScreen';
import LoginScreen from './LoginScreen';
import CreateAccountScreen from './CreateAccountScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import TwoFactorAuthScreen from './TwoFactorAuthScreen';
import HomeScreen from './HomeScreen';

import SideMenu from './components/SideMenu';
import EditProfileScreen from './screens/EditProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';

import MyBusinessScreen from './screens/MyBussinessScreen';
import ServicesScreen from './screens/ServicesScreen';
import ClientsScreen from './screens/ClientScreen';
import InventoryScreen from './screens/IventoryScreen';
import StockScreen from './screens/StockScreen';
import EquipmentsScreen from './screens/EquipmentsScreen';
import CashFlowScreen from './screens/CashFlowScreen';
import PricingScreen from './screens/PricingScreen';

import TradingHomeScreen from './screens/TradingHomeScreen';
import CurrencyScreen from './screens/CurrencyScreen';
import CryptoScreen from './screens/CryptoScreen';
import StocksScreen from './screens/StocksScreen';

import TaxSimulatorScreen from './screens/TaxSimulatorScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProUpgradeScreen from './screens/ProUpgradeScreen';

const Stack = createStackNavigator();

const AppRoutes = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
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
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen}
          options={{ 
            animationEnabled: false,
            gestureEnabled: false 
          }}
        />

        <Stack.Screen 
          name="Login"
          component={LoginScreen}
          options={{ title: 'Login' }}
        />

        <Stack.Screen 
          name="CreateAccount"
          component={CreateAccountScreen}
          options={{ 
            title: 'Criar Conta',
            headerShown: false
          }}
        />

        <Stack.Screen 
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ 
            title: 'Esqueci a Senha',
            headerShown: false
          }}
        />

        <Stack.Screen 
          name="TwoFactorAuth"
          component={TwoFactorAuthScreen}
          options={{ 
            title: 'Verificação 2FA',
            headerShown: false
          }}
        />

        <Stack.Screen 
          name="Home"
          component={HomeScreen}
          options={{ 
            title: 'Home',
            headerShown: false,
            gestureEnabled: false
          }}
        />

        <Stack.Screen 
          name="SideMenu" 
          component={SideMenu}
          options={{ headerShown: false, presentation: 'modal' }}
        />
        
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />
        
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
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ProUpgrade" 
          component={ProUpgradeScreen}
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