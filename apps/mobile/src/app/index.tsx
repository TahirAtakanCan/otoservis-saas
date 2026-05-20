// apps/mobile/src/app/index.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '../../lib/auth';
import { useAuthStore } from '../../lib/store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  
  const isLoading = useAuthStore((state) => state.isLoading);
  // SaaS Teması: Eğer sistemde daha önceden kalma bir renk varsa onu kullan, yoksa varsayılan koyu gri yap
  const tenant = useAuthStore((state) => state.tenant);
  const brandColor = tenant?.primaryColor || '#1f2937'; 

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    
    try {
      // Sadece login fonksiyonunu çağırıyoruz, yönlendirmeyi _layout yapacak!
      await login(email, password);
    } catch (error) {
      Alert.alert('Giriş Başarısız', 'Bilgilerinizi kontrol edip tekrar deneyin.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>OtoServis Usta</Text>
        <Text style={styles.subtitle}>İş Emri ve Araç Takip Sistemi</Text>

        <TextInput
          style={styles.input}
          placeholder="E-posta"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* DİNAMİK BUTON: Arka plan rengini markanın kendi renginden alıyor! */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: brandColor }]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Sisteme Gir</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    elevation: 4, // Android gölgesi
    shadowColor: '#000', // iOS gölgesi
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});