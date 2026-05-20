// apps/web/lib/service.ts
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc, getDoc, increment, arrayUnion } from 'firebase/firestore';
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

// İş Emrine Parça Ekleme ve Stok Düşme Fonksiyonu
export const addPartToService = async (serviceId: string, partId: string, quantity: number) => {
  try {
    // 1. Önce parçanın güncel fiyatını ve stok durumunu bul
    const partRef = doc(db, 'inventory', partId);
    const partSnap = await getDoc(partRef);
    
    if (!partSnap.exists()) throw new Error("Parça bulunamadı!");
    
    const partData = partSnap.data();
    if (partData.stockQuantity < quantity) {
      throw new Error("Depoda yeterli stok yok!");
    }

    // 2. İş emrine eklenecek tutarı hesapla
    const totalPartCost = partData.unitPrice * quantity;

    // 3. Stoktan düş
    await updateDoc(partRef, {
      stockQuantity: increment(-quantity) // Stoğu eksi yönde artır (azalt)
    });

    // 4. İş emrine parçayı ekle ve toplam faturayı kabart
    const serviceRef = doc(db, 'services', serviceId);
    await updateDoc(serviceRef, {
      totalCost: increment(totalPartCost), // Toplam tutara ekle
      usedParts: arrayUnion({             // Kullanılan parçalar listesine ekle
        partId: partId,
        name: partData.name,
        quantity: quantity,
        unitPrice: partData.unitPrice,
        totalPrice: totalPartCost
      })
    });

    return true;
  } catch (error) {
    console.error("Parça eklenirken hata:", error);
    throw error;
  }
};