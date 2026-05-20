// apps/web/app/dashboard/invoice/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuthStore } from '../../../../lib/store';
import { getVehiclesByTenant } from '../../../../lib/vehicle';
import { ServiceRecord, Vehicle } from '@repo/types';
import { useRouter, useParams } from 'next/navigation';

export default function InvoicePage() {
  const { user, tenant } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  
  const [record, setRecord] = useState<ServiceRecord | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!user?.tenantId || !invoiceId) return;
      setIsLoading(true);
      
      try {
        // İş emrini çek
        const docRef = doc(db, 'services', invoiceId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const recordData = { id: docSnap.id, ...docSnap.data() } as ServiceRecord;
          setRecord(recordData);
          
          // Aracı çek
          const vehicles = await getVehiclesByTenant(user.tenantId);
          const v = vehicles.find(v => v.id === recordData.vehicleId);
          if (v) setVehicle(v);
        }
      } catch (error) {
        console.error("Fatura yüklenemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceData();
  }, [user, invoiceId]);

  if (isLoading) return <div style={{ padding: '2rem' }}>Fatura hazırlanıyor...</div>;
  if (!record) return <div style={{ padding: '2rem' }}>Kayıt bulunamadı.</div>;

  // @ts-ignore
  const usedParts = record.usedParts || [];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white' }}>
      
      {/* SADECE EKRANDA GÖRÜNEN, YAZICIDA GİZLENEN KISIM */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          aside, header { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
          body { background-color: white !important; }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f3f4f6' }}>
          Geri Dön
        </button>
        <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: tenant?.primaryColor || '#10b981', color: 'white', fontWeight: 'bold' }}>
          🖨️ PDF / Yazdır
        </button>
      </div>

      {/* A4 FATURA TASARIMI */}
      <div style={{ border: '1px solid #e5e7eb', padding: '3rem', borderRadius: '8px' }}>
        
        {/* Fatura Başlığı */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e5e7eb', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, color: tenant?.primaryColor || '#111827', fontSize: '2rem' }}>{tenant?.name || 'OtoServis'}</h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>Servis İşlem Dökümü</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, color: '#374151', fontSize: '1.25rem' }}>İŞ EMRİ NO:</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>#{record.id.slice(-6).toUpperCase()}</p>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
              Tarih: {record.createdAt?.toDate ? record.createdAt.toDate().toLocaleDateString('tr-TR') : 'Bilinmiyor'}
            </p>
          </div>
        </div>

        {/* Araç ve Müşteri Bilgisi */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '4px' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>Araç Bilgileri</h3>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{vehicle?.plate}</p>
            <p style={{ margin: 0, color: '#374151' }}>{vehicle?.brand} {vehicle?.model} ({vehicle?.year})</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>Müşteri Şikayeti</h3>
            <p style={{ margin: 0, color: '#374151', maxWidth: '300px' }}>{record.description}</p>
          </div>
        </div>

        {/* Yapılan İşlemler / Parçalar Tablosu */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>Açıklama / Parça</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d1d5db' }}>Miktar</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #d1d5db' }}>Birim Fiyat</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #d1d5db' }}>Toplam</th>
            </tr>
          </thead>
          <tbody>
            {usedParts.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Henüz parça girişi yapılmamış.</td>
              </tr>
            ) : (
              usedParts.map((part: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>{part.name}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{part.quantity}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>₺{part.unitPrice.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>₺{part.totalPrice.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Genel Toplam */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px', borderTop: '2px solid #111827', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold' }}>
              <span>GENEL TOPLAM:</span>
              <span style={{ color: tenant?.primaryColor || '#10b981' }}>₺{record.totalCost?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div style={{ marginTop: '4rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
          Bizi tercih ettiğiniz için teşekkür ederiz. Kazasız sürüşler dileriz!
        </div>

      </div>
    </div>
  );
}