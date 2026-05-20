// apps/web/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../lib/store';
import { getVehiclesByTenant } from '../../lib/vehicle';
import { getServiceRecordsByTenant } from '../../lib/service';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeServices: 0,
    completedServices: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.tenantId) return;
      setIsLoading(true);
      try {
        // İlgili şirketin tüm araç ve iş emirlerini çekiyoruz
        const vehicles = await getVehiclesByTenant(user.tenantId);
        const records = await getServiceRecordsByTenant(user.tenantId);

        // Aktif (bekliyor veya işlemde olan) ve Tamamlanmış iş emirlerini filtrele
        const active = records.filter(r => r.status === 'bekliyor' || r.status === 'islemde').length;
        const completed = records.filter(r => r.status === 'tamamlandi').length;

        setStats({
          totalVehicles: vehicles.length,
          activeServices: active,
          completedServices: completed,
        });
      } catch (error) {
        console.error("İstatistikler yüklenirken hata:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [user]);

  if (isLoading) {
    return <div style={{ color: '#6b7280' }}>Özet veriler yükleniyor...</div>;
  }

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#111827' }}>Genel Bakış</h1>
      <p style={{ color: '#6b7280' }}>İşletmenizin anlık operasyonel özeti aşağıdadır.</p>
      
      {/* İstatistik Kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        
        {/* KART 1: ARAÇ SAYISI */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kayıtlı Toplam Araç</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#111827' }}>
            {stats.totalVehicles}
          </p>
        </div>

        {/* KART 2: AKTİF İŞ EMİRLERİ */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Açık / Aktif İş Emirleri</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#111827' }}>
            {stats.activeServices}
          </p>
        </div>

        {/* KART 3: TAMAMLANAN İŞLER */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tamamlanan Hizmetler</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#111827' }}>
            {stats.completedServices}
          </p>
        </div>

      </div>
    </div>
  );
}