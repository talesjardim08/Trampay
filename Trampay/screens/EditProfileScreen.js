import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, spacing } from '../styles';
import { AuthContext } from '../AuthContext';
import api from '../services/api';

const EditProfileScreen = ({ navigation }) => {
  const { user, setUser } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = () => {
    if (user) {
      setFormData({
        displayName: user.displayName || user.legalName || '',
        email: user.email || '',
        phone: user.phone || '',
        password: ''
      });
    }
  };

  const handleSave = async () => {
    if (!formData.displayName || !formData.email) {
      Alert.alert('Erro', 'Nome e email são obrigatórios.');
      return;
    }
    setIsLoading(true);
    try {
      const profilePayload = { email: formData.email, displayName: formData.displayName, phone: formData.phone };
      const response = await api.put('/auth/profile', profilePayload);
      if (formData.password && formData.password.trim()) {
        await api.put('/auth/profile/password', { currentPassword: '', newPassword: formData.password });
      }
      if (response.data && setUser) {
        setUser(response.data);
      }
      Alert.alert('Sucesso!', 'Seus dados foram atualizados.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível atualizar seu perfil.');
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
      setProfileImage(result.assets[0].uri);
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
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
                    {formData.displayName.charAt(0).toUpperCase() || 'U'}
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
        
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>NOME</Text>
            <TextInput
              style={styles.input}
              placeholder="João Victor Queiroz"
              placeholderTextColor={colors.placeholder}
              value={formData.displayName}
              onChangeText={(value) => updateFormData('displayName', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="joao@example.com"
              placeholderTextColor={colors.placeholder}
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>SENHA (deixe em branco para manter)</Text>
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

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Deletar Conta',
                'Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão perdidos.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Deletar',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await api.delete('/auth/profile');
                        Alert.alert('Conta deletada', 'Sua conta foi excluída com sucesso.');
                        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                      } catch (error) {
                        Alert.alert('Erro', 'Não foi possível deletar sua conta. Tente novamente.');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <MaterialIcons name="delete-forever" size={20} color={colors.white} />
            <Text style={styles.deleteButtonText}>Deletar Minha Conta</Text>
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

  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#FF5722',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },

  deleteButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
    marginLeft: spacing.sm,
  },
});

export default EditProfileScreen;