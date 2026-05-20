// apps/web/lib/vehicle.ts
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Vehicle } from '@repo/types';

// Yeni araç ekleme (Şirket ID'si ile birlikte)
export const createVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'vehicles'), {
      ...vehicleData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Araç eklenirken hata oluştu:", error);
    throw error;
  }
};

// Sadece ilgili şirkete (Tenant) ait araçları getirme
export const getVehiclesByTenant = async (tenantId: string) => {
  try {
    const q = query(collection(db, 'vehicles'), where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Vehicle[];
  } catch (error) {
    console.error("Araçlar çekilirken hata oluştu:", error);
    throw error;
  }
};