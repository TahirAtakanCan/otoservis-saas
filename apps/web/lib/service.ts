// apps/web/lib/service.ts
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ServiceRecord } from '@repo/types';

// Yeni İş Emri Oluşturma
export const createServiceRecord = async (serviceData: Omit<ServiceRecord, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'services'), {
      ...serviceData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("İş emri açılırken hata oluştu:", error);
    throw error;
  }
};

// Şirkete ait tüm İş Emirlerini Getirme
export const getServiceRecordsByTenant = async (tenantId: string) => {
  try {
    const q = query(collection(db, 'services'), where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceRecord[];
  } catch (error) {
    console.error("İş emirleri çekilirken hata oluştu:", error);
    throw error;
  }
};

// İş Emrinin Durumunu Güncelleme (Bekliyor -> İşlemde -> Tamamlandı)
export const updateServiceStatus = async (recordId: string, newStatus: ServiceRecord['status']) => {
  try {
    const docRef = doc(db, 'services', recordId);
    await updateDoc(docRef, {
      status: newStatus
    });
  } catch (error) {
    console.error("Durum güncellenirken hata oluştu:", error);
    throw error;
  }
};


// İş emrini hem durum hem de maliyet olarak güncelleme
export const updateServiceDetails = async (recordId: string, data: { status?: string, totalCost?: number }) => {
  try {
    const docRef = doc(db, 'services', recordId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    throw error;
  }
};