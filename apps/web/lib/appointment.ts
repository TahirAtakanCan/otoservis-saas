// apps/web/lib/appointment.ts
import { collection, addDoc, getDocs, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface Appointment {
  id: string;
  tenantId: string;
  vehicleId: string;
  date: string; // Tarih ve saat (Örn: 2026-05-25T10:30)
  status: 'bekliyor' | 'onaylandi' | 'iptal';
  notes: string;
  createdAt: any;
}

// Şirkete ait randevuları getir
export const getAppointmentsByTenant = async (tenantId: string) => {
  const q = query(collection(db, 'appointments'), where('tenantId', '==', tenantId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
};

// Yeni randevu oluştur
export const createAppointment = async (data: Omit<Appointment, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'appointments'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Randevu durumunu güncelle
export const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
  const docRef = doc(db, 'appointments', id);
  await updateDoc(docRef, { status });
};