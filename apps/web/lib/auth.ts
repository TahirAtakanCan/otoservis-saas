// apps/web/lib/auth.ts
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useAuthStore } from './store';
import { AppUser } from '@repo/types';

export const login = async (email: string, password: string) => {
  try {
    useAuthStore.getState().setLoading(true);
    
    // 1. Firebase Auth ile giriş yap
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // 2. Firestore'dan kullanıcının rolünü ve tenant (şirket) bilgisini çek
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data() as AppUser;
      
      // 3. Zustand State'e (Hafızaya) kaydet
      useAuthStore.getState().setUser(userData);
      
      return userData;
    } else {
      throw new Error("Kullanıcı veritabanında bulunamadı!");
    }
  } catch (error: any) {
    console.error("Giriş hatası:", error.message);
    throw error;
  } finally {
    useAuthStore.getState().setLoading(false);
  }
};

export const logoutUser = async () => {
  await signOut(auth);
  useAuthStore.getState().logout();
};