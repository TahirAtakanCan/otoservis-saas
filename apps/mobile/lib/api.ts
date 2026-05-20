// apps/mobile/lib/api.ts
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ServiceRecord, Vehicle } from '@repo/types';

// Şirkete ait araçları getir
export const getVehiclesByTenant = async (tenantId: string) => {
  const q = query(collection(db, 'vehicles'), where('tenantId', '==', tenantId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vehicle[];
};

// Şirkete ait aktif iş emirlerini getir
export const getActiveServicesByTenant = async (tenantId: string) => {
  const q = query(collection(db, 'services'), where('tenantId', '==', tenantId));
  const snapshot = await getDocs(q);
  const allServices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceRecord[];
  
  // Sadece bekleyen ve işlemde olanları döndür (Tamamlananlar webden görünsün)
  return allServices.filter(s => s.status === 'bekliyor' || s.status === 'islemde');
};

// İş emri durumunu güncelle
export const updateServiceStatus = async (recordId: string, newStatus: ServiceRecord['status']) => {
  const docRef = doc(db, 'services', recordId);
  await updateDoc(docRef, { status: newStatus });
};