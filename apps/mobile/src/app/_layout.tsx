// apps/mobile/src/app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/store';

export default function RootLayout() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  // AUTH OBSERVER: Kullanıcı durumu değiştiğinde otomatik yönlendir
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Kullanıcı varsa ve giriş ekranındaysa Dashboard'a at
        router.replace('/dashboard');
      } else {
        // Kullanıcı yoksa Login ekranına döndür
        router.replace('/');
      }
    }
  }, [user, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* index.tsx (Login) ana ekranımız */}
      <Stack.Screen name="index" />
      {/* dashboard.tsx panelimiz */}
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}