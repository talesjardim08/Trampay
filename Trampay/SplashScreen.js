// Tela Splash do Trampay com logo e animação de carregamento
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Animated, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { colors, fonts, spacing } from './styles';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  // Animações para logo e texto
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('SplashScreen: useEffect iniciado');
    
    // Sequência de animações da splash screen
    const startAnimations = () => {
      console.log('SplashScreen: Iniciando animações');
      
      // Anima logo aparecendo e crescendo
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log('SplashScreen: Primeira animação concluída');
        
        // Depois anima o texto aparecendo
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          console.log('SplashScreen: Segunda animação concluída, iniciando navegação');
          
          // Aguarda 1 segundo e navega para Login
          setTimeout(() => {
            console.log('SplashScreen: Tentando navegar para Login');
            
            if (onFinish) {
              console.log('SplashScreen: Chamando onFinish');
              onFinish();
            }
          }, 1000);
        });
      });
    };

    // Inicia animações após pequeno delay
    setTimeout(startAnimations, 300);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Logo animado do Trampay */}
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }]
          }
        ]}
      >
        {/* Logo simples usando View (será substituído por imagem real) */}
        <View style={styles.logoBackground}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>👤</Text>
          </View>
        </View>
      </Animated.View>

      {/* Nome do app */}
      <Animated.Text 
        style={[styles.appName, { opacity: textOpacity }]}
      >
        Trampay
      </Animated.Text>

      {/* Indicador de carregamento */}
      <Animated.View 
        style={[styles.loadingContainer, { opacity: textOpacity }]}
      >
        <View style={styles.loadingDots}>
          <LoadingDot delay={0} />
          <LoadingDot delay={200} />
          <LoadingDot delay={400} />
        </View>
      </Animated.View>
    </View>
  );
};

// Componente para dots de carregamento animados
const LoadingDot = ({ delay }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    setTimeout(animate, delay);
  }, []);

  return (
    <Animated.View 
      style={[styles.dot, { opacity }]} 
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  logoContainer: {
    marginBottom: spacing.lg,
  },
  
  logoBackground: {
    width: 120,
    height: 120,
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  logoIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.white,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  logoText: {
    fontSize: 40,
    textAlign: 'center',
  },
  
  appName: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: spacing.xl,
    letterSpacing: 1,
  },
  
  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    alignItems: 'center',
  },
  
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
  },
});

export default SplashScreen;