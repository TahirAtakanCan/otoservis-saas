// apps/web/lib/customer.ts
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface Customer {
  id: string;
  tenantId: string;
  fullName: string;
  phone: string;
  email?: string;
  createdAt: any;
}

// Yeni müşteri ekleme (Şirket bazlı)
export const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Müşteri eklenirken hata oluştu:", error);
    throw error;
  }
};

// Sadece ilgili şirkete ait müşterileri getirme
export const getCustomersByTenant = async (tenantId: string) => {
  try {
    const q = query(collection(db, 'customers'), where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Customer[];
  } catch (error) {
    console.error("Müşteriler çekilirken hata oluştu:", error);
    throw error;
  }
};