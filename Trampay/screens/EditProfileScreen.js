// Tela Editar Perfil do Trampay
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, spacing } from '../styles';

const EditProfileScreen = ({ navigation, user }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Carrega dados do perfil salvos
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          password: '' // Nunca carrega senha por segurança
        });
        if (profile.profileImage) {
          setProfileImage(profile.profileImage);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Erro', 'Nome e email são obrigatórios.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Salva dados reais no AsyncStorage
      const profileData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        profileImage: profileImage,
        updatedAt: new Date().toISOString()
      };
      
      // Inclui senha apenas se foi alterada
      if (formData.password) {
        profileData.password = formData.password; // Em produção seria hasheada
      }
      
      await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
      console.log('Perfil salvo com sucesso:', profileData);
      
      Alert.alert(
        'Sucesso!',
        'Seus dados foram salvos permanentemente!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickImage = async () => {
    // Pede permissão para acessar a galeria
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos da permissão para acessar suas fotos.');
      return;
    }

    Alert.alert(
      'Selecionar Foto',
      'Escolha uma opção',
      [
        {
          text: 'Câmera',
          onPress: takePicture
        },
        {
          text: 'Galeria',
          onPress: openGallery
        },
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ]
    );
  };

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos da permissão para acessar sua câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);
      // Salva imagem automaticamente para persistência imediata
      try {
        const currentProfile = await AsyncStorage.getItem('userProfile');
        const profile = currentProfile ? JSON.parse(currentProfile) : {};
        profile.profileImage = imageUri;
        await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
        Alert.alert('Foto atualizada!', 'Sua foto foi salva automaticamente.');
      } catch (error) {
        console.error('Erro ao salvar imagem:', error);
      }
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);
      // Salva imagem automaticamente para persistência imediata
      try {
        const currentProfile = await AsyncStorage.getItem('userProfile');
        const profile = currentProfile ? JSON.parse(currentProfile) : {};
        profile.profileImage = imageUri;
        await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
        Alert.alert('Foto atualizada!', 'Sua foto foi salva automaticamente.');
      } catch (error) {
        console.error('Erro ao salvar imagem:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileIcon}>
                <View style={styles.profileIconInner}>
                  <Text style={styles.profileInitial}>
                    {formData.name.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar meus dados</Text>
        </View>
        
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>NOME</Text>
            <TextInput
              style={styles.input}
              placeholder="João Victor Queiroz"
              placeholderTextColor={colors.placeholder}
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="joaovictorqueiroz@gmail.com"
              placeholderTextColor={colors.placeholder}
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>SENHA</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={colors.placeholder}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>TELEFONE</Text>
            <TextInput
              style={styles.input}
              placeholder="(11) 99999-9999"
              placeholderTextColor={colors.placeholder}
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              keyboardType="phone-pad"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Salvando...' : 'Editar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  backButton: {
    padding: spacing.sm,
  },

  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.medium,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  profileIcon: {
    width: 50,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  profileIconInner: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileInitial: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },

  profileImageContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },

  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  cameraIconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },

  headerTitle: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
  },

  notificationButton: {
    padding: spacing.sm,
  },

  notificationIcon: {
    padding: spacing.sm,
  },

  content: {
    flex: 1,
  },

  formContainer: {
    padding: spacing.lg,
  },

  inputContainer: {
    marginBottom: spacing.lg,
  },

  label: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  input: {
    height: 56,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    height: 56,
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  eyeButton: {
    padding: spacing.md,
  },

  eyeIcon: {
    fontSize: 20,
  },

  saveButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: colors.white,
    fontSize: 18,
    fontFamily: fonts.bold,
  },
});

export default EditProfileScreen;