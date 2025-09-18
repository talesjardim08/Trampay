// Sistema de roteamento centralizado do Trampay
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importação das telas
import SplashScreen from './SplashScreen';
import LoginScreen from './LoginScreen';
import CreateAccountScreen from './CreateAccountScreen';
import HomeScreen from './screens/homescreen';
//import ForgotPasswordScreen from './ForgotPasswordScreen';
//import TwoFactorAuthScreen from './TwoFactorAuthScreen';
//import HomeScreen from './HomeScreen';

// Importação dos componentes
//import SideMenu from './components/SideMenu';
//import EditProfileScreen from './screens/EditProfileScreen';
//import NotificationsScreen from './screens/NotificationsScreen';

// Importação das telas de negócio
//import MyBusinessScreen from './screens/MyBusinessScreen';
//import ServicesScreen from './screens/ServicesScreen';
//import ClientsScreen from './screens/ClientsScreen';
//import InventoryScreen from './screens/InventoryScreen';
//import StockScreen from './screens/StockScreen';
//import EquipmentsScreen from './screens/EquipmentsScreen';
//import CashFlowScreen from './screens/CashFlowScreen';
//import PricingScreen from './screens/PricingScreen';

// Importação das telas de Trading
//import TradingHomeScreen from './screens/TradingHomeScreen';
//import CurrencyScreen from './screens/CurrencyScreen';
//import CryptoScreen from './screens/CryptoScreen';
//import StocksScreen from './screens/StocksScreen';

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

        <Stack.Screen name="Home">
  {(props) => (
    <HomeScreen
      {...props}
      onLogout={() => {
        onLogout();
        props.navigation.navigate("Login");
      }}
    />
  )}
</Stack.Screen>

        {/* Tela de Esqueci a Senha */}
        {/*<Stack.Screen 
          name="ForgotPassword"
          options={{ 
            title: 'Esqueci a Senha',
            headerShown: false
          }}
          component={ForgotPasswordScreen}
        />*/}

        {/* Tela de Verificação em Duas Etapas */}
        {/*<Stack.Screen 
          name="TwoFactorAuth"
          options={{ 
            title: 'Verificação 2FA',
            headerShown: false
          }}
          component={TwoFactorAuthScreen}
        />*/}

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

       
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Tela stub temporária para funcionalidades ainda não implementadas


export default AppRoutes;