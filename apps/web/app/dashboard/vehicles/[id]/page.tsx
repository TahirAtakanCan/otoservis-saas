// apps/web/app/dashboard/vehicles/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store';
import { getVehiclesByTenant } from '../../../../lib/vehicle';
import { getCustomersByTenant } from '../../../../lib/customer';
import { getServiceRecordsByTenant} from '../../../../lib/service';
import { Vehicle, Customer, ServiceRecord } from '@repo/types';

export default function VehicleHistoryPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.tenantId || !vehicleId) return;
      setIsLoading(true);

      try {
        const [vData, cData, sData] = await Promise.all([
          getVehiclesByTenant(user.tenantId),
          getCustomersByTenant(user.tenantId),
          getServiceRecordsByTenant(user.tenantId)
        ]);

        const currentVehicle = vData.find(v => v.id === vehicleId);
        if (currentVehicle) {
          setVehicle(currentVehicle);
          setCustomer(cData.find(c => c.id === currentVehicle.customerId) || null);
          
          // Sadece bu araca ait servisleri filtrele ve yeniden eskiye sırala
          const vehicleServices = sData
            .filter(s => s.vehicleId === vehicleId)
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          
          setServices(vehicleServices);
        }
      } catch (error) {
        console.error("Araç bilgileri çekilemedi", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user, vehicleId]);

  if (isLoading) return <div style={{ padding: '2rem' }}>Araç geçmişi yükleniyor...</div>;
  if (!vehicle) return <div style={{ padding: '2rem' }}>Araç bulunamadı.</div>;

  return (
    <div>
      <button onClick={() => router.back()} style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', cursor: 'pointer' }}>
        ← Araçlara Dön
      </button>

      {/* ARAÇ KİMLİĞİ (BAŞLIK) */}
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#111827', color: 'white', padding: '1rem 2rem', borderRadius: '8px', fontSize: '2rem', fontWeight: '900', letterSpacing: '4px', border: '4px solid #e5e7eb' }}>
            {vehicle.plate}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#111827' }}>{vehicle.brand} {vehicle.model}</h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '1.1rem' }}>
              👤 Sahibi: <strong style={{ color: '#374151' }}>{customer?.fullName}</strong> | 📞 {customer?.phone}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase' }}>Kayıtlı İlk KM</p>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{vehicle.mileage?.toLocaleString() || '--'} <span style={{fontSize:'1rem'}}>KM</span></p>
        </div>
      </div>

      {/* GEÇMİŞ SERVİS KAYITLARI LİSTESİ */}
      <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '1rem' }}>Servis Geçmişi ({services.length} Kayıt)</h2>
      
      {services.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '3rem', textAlign: 'center', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Bu araca ait henüz bir servis işlemi bulunmuyor.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {services.map((service, index) => (
            <div key={service.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', borderLeft: `6px solid ${service.status === 'tamamlandi' ? '#10b981' : '#f59e0b'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '1.1rem' }}>
                    İş Emri #{service.id.slice(-6).toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px', color: '#4b5563' }}>
                    📅 {service.createdAt?.toDate ? service.createdAt.toDate().toLocaleDateString('tr-TR') : 'Tarih Yok'}
                  </span>
                  {service.currentMileage && (
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#eff6ff', padding: '0.25rem 0.5rem', borderRadius: '4px', color: '#1d4ed8', fontWeight: 'bold' }}>
                      ⏱️ Servis Anındaki KM: {service.currentMileage.toLocaleString()}
                    </span>
                  )}
                </div>
                
                <p style={{ margin: '0 0 0.5rem 0', color: '#4b5563' }}><strong>Şikayet:</strong> {service.description}</p>
                {service.notes && <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}><em>Not: {service.notes}</em></p>}
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: service.status === 'tamamlandi' ? '#10b981' : '#f59e0b' }}>
                  ₺{service.totalCost?.toLocaleString() || 0}
                </div>
                {/* PDF FATURA BUTONU */}
                <button 
                  onClick={() => window.open(`/dashboard/invoice/${service.id}`, '_blank')}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  🖨️ PDF Dökümü
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}