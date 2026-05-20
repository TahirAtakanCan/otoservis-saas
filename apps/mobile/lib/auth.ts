// apps/mobile/lib/auth.ts
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useAuthStore } from './store';
import { AppUser, Tenant } from '@repo/types';

export const login = async (email: string, password: string) => {
  try {
    useAuthStore.getState().setLoading(true);
    
    // 1. Firebase Auth Girişi
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // 2. Kullanıcı Rolünü Çek
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data() as AppUser;
      
      // 3. SaaS SİHRİ: Kullanıcının çalıştığı şirketin bilgilerini (Tema Rengi vb.) Çek
      if (userData.tenantId && userData.tenantId !== 'system') {
        const tenantRef = doc(db, 'tenants', userData.tenantId);
        const tenantSnap = await getDoc(tenantRef);
        if (tenantSnap.exists()) {
          // Şirket verisini Zustand hafızasına yaz
          useAuthStore.getState().setTenant({ id: tenantSnap.id, ...tenantSnap.data() } as Tenant);
        }
      }
      
      // Kullanıcıyı hafızaya yaz
      useAuthStore.getState().setUser(userData);
      return userData;
    } else {
      throw new Error("Kullanıcı bulunamadı!");
    }
  } catch (error) {
    console.error("Giriş hatası:", error);
    throw error;
  } finally {
    useAuthStore.getState().setLoading(false);
  }
};

export const logoutUser = async () => {
  await signOut(auth);
  useAuthStore.getState().logout();
};