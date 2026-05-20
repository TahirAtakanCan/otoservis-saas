// packages/types/src/index.ts

// 1. Müşteri (Otoservis İşletmesi) Modeli
export interface Tenant {
  id: string; // Firestore Döküman ID'si
  name: string; // Örn: "Akan Oto Servis"
  logoUrl?: string; // PDF ve arayüz için müşteri logosu
  primaryColor?: string; // Örn: "#FF0000" - Dinamik tema için
  secondaryColor?: string;
  createdAt: Date | any; // Firebase Timestamp
}

// 2. Kullanıcı Rolleri ve Modeli
export type UserRole = 'super_admin' | 'admin' | 'employee';

export interface AppUser {
  uid: string; // Firebase Auth ID'si
  email: string;
  fullName: string;
  role: UserRole;
  tenantId?: string; // super_admin için boş olabilir, diğerleri için ZORUNLU
  isActive: boolean;
  createdAt: Date | any;
}

// Araç Sahibi (Müşteri) Modeli
export interface Customer {
  id: string;
  tenantId: string; // Hangi otoservise ait olduğu
  fullName: string; // Ad Soyad
  phone: string;    // Telefon Numarası
  email?: string;
  address?: string;
  createdAt?: Date | any;
}

// 3. Araç Modeli (SaaS Uyumlu)
export interface Vehicle {
  id: string;
  tenantId: string; // Hangi otoservise ait olduğu (GÜVENLİK İÇİN KRİTİK)
  plate: string; // Plaka
  brand: string; // Marka (Örn: Opel, Chevrolet)
  model: string; // Model
  year: number;
  mileage?: number;
  customerId: string; // Araç sahibinin ID'si
  createdAt: Date | any;
}

// 4. İş Emri / Servis Kaydı Modeli
export interface ServiceRecord {
  id: string;
  tenantId: string;
  vehicleId: string;
  description: string; // Müşteri Şikayeti / Arıza Notu
  notes?: string;      // İç Not
  currentMileage?: number;
  technicianName?: string; // Teknisyen
  status: 'bekliyor' | 'islemde' | 'tamamlandi' | 'iptal';
  subtotal?: number;       // Ara Toplam
  kdvIncluded?: boolean;   // KDV Dahil mi?
  taxRate?: number;        // KDV Oranı
  kdvAmount?: number;      // KDV Tutarı
  totalCost: number;       // Genel Toplam
  laborItems?: LaborItem[]; // İşçilik Kalemleri
  usedParts?: {
    partId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isManual?: boolean; // Manuel eklenen parça mı? (Stoktan düşmemek için)
  }[];
  createdAt: Date | any;
}

export interface LaborItem {
  description: string;
  price: number;
}