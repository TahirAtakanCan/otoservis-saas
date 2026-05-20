// apps/web/lib/service.ts
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc, getDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import { ServiceRecord } from '@repo/types';

// Yeni İş Emri Oluşturma (Stok Düşme Entegrasyonlu)
export const createServiceRecord = async (serviceData: Omit<ServiceRecord, 'id' | 'createdAt'>) => {
  try {
    // 1. İş Emrini Oluştur
    const docRef = await addDoc(collection(db, 'services'), {
      ...serviceData,
      createdAt: serverTimestamp(),
    });

    // 2. Eğer stoktan parça kullanıldıysa, stok miktarını düş
    if (serviceData.usedParts && serviceData.usedParts.length > 0) {
      for (const part of serviceData.usedParts) {
        // isManual true değilse ve parça ID'si 'manual' değilse stoktan düş
        if (!part.isManual && part.partId !== 'manual') {
          const partRef = doc(db, 'inventory', part.partId);
          await updateDoc(partRef, {
            stockQuantity: increment(-part.quantity)
          });
        }
      }
    }

    return docRef.id;
  } catch (error) {
    console.error("İş emri açılırken hata oluştu:", error);
    throw error;
  }
};

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

export const updateServiceStatus = async (recordId: string, newStatus: ServiceRecord['status']) => {
  try {
    const docRef = doc(db, 'services', recordId);
    await updateDoc(docRef, { status: newStatus });
  } catch (error) {
    console.error("Durum güncellenirken hata oluştu:", error);
    throw error;
  }
};

export const updateServiceDetails = async (recordId: string, data: { status?: string, totalCost?: number }) => {
  try {
    const docRef = doc(db, 'services', recordId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    throw error;
  }
};

export const addPartToService = async (serviceId: string, partId: string, quantity: number) => {
  try {
    const partRef = doc(db, 'inventory', partId);
    const partSnap = await getDoc(partRef);
    if (!partSnap.exists()) throw new Error("Parça bulunamadı!");
    
    const partData = partSnap.data();
    if (partData.stockQuantity < quantity) throw new Error("Depoda yeterli stok yok!");

    const totalPartCost = partData.unitPrice * quantity;

    await updateDoc(partRef, { stockQuantity: increment(-quantity) });

    const serviceRef = doc(db, 'services', serviceId);
    await updateDoc(serviceRef, {
      totalCost: increment(totalPartCost),
      usedParts: arrayUnion({
        partId: partId,
        name: partData.name,
        quantity: quantity,
        unitPrice: partData.unitPrice,
        totalPrice: totalPartCost,
        isManual: false
      })
    });
    return true;
  } catch (error) {
    console.error("Parça eklenirken hata:", error);
    throw error;
  }
};