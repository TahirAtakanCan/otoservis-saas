// apps/web/lib/tenant.ts
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Tenant } from '@repo/types';

// Yeni bir otoservis (tenant) ekleme fonksiyonu
export const createTenant = async (data: Omit<Tenant, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'tenants'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Şirket eklenirken hata oluştu:", error);
    throw error;
  }
};

// Sistemdeki tüm otoservisleri getirme fonksiyonu
export const getTenants = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'tenants'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Tenant[];
  } catch (error) {
    console.error("Şirketler çekilirken hata oluştu:", error);
    throw error;
  }
};