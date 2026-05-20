// apps/web/lib/inventory.ts
import { collection, addDoc, getDocs, query, where, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from './firebase';

export interface Part {
  id: string;
  tenantId: string;
  name: string;
  sku: string; // Stok Kodu
  stockQuantity: number;
  unitPrice: number; // Satış fiyatı
  createdAt: any;
}

// Şirkete ait tüm parçaları getir
export const getInventoryByTenant = async (tenantId: string) => {
  const q = query(collection(db, 'inventory'), where('tenantId', '==', tenantId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Part[];
};

// Yeni parça ekle
export const createPart = async (partData: Omit<Part, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'inventory'), {
    ...partData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Stok miktarını güncelle (Azaltmak veya artırmak için)
export const updateStock = async (partId: string, changeAmount: number) => {
  const docRef = doc(db, 'inventory', partId);
  await updateDoc(docRef, {
    stockQuantity: increment(changeAmount) // Firebase'in güvenli artırma/azaltma metodu
  });
};