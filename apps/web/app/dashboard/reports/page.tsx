// apps/web/app/dashboard/reports/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../lib/store';
import { getServiceRecordsByTenant } from '../../../lib/service';
import { getVehiclesByTenant } from '../../../lib/vehicle';
import { ServiceRecord, Vehicle } from '@repo/types';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.tenantId) return;
      try {
        const [rData, vData] = await Promise.all([
          getServiceRecordsByTenant(user.tenantId),
          getVehiclesByTenant(user.tenantId)
        ]);
        setRecords(rData);
        setVehicles(vData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // ANALİZ HESAPLAMALARI
  const completedRecords = records.filter(r => r.status === 'tamamlandi');
  const totalRevenue = completedRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const avgServiceCost = completedRecords.length > 0 ? totalRevenue / completedRecords.length : 0;
  
  // En çok gelen araç markasını bulalım
  const brandCounts = vehicles.reduce((acc: any, v) => {
    acc[v.brand] = (acc[v.brand] || 0) + 1;
    return acc;
  }, {});
  const topBrand = Object.keys(brandCounts).reduce((a, b) => brandCounts[a] > brandCounts[b] ? a : b, 'Yok');

  if (loading) return <div style={{ padding: '2rem' }}>Raporlar hazırlanıyor...</div>;

  return (
    <div>
      <h1 style={{ color: '#111827', marginBottom: '0.5rem' }}>İşletme Analizi</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Verilerinizin üzerinden işletmenizin performansını inceleyin.</p>

      {/* ÜST ÖZET KARTLARI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <ReportCard 
          title="Toplam Ciro" 
          value={`₺${totalRevenue.toLocaleString()}`} 
          icon="💰" 
          color="#10b981" 
          sub="Tamamlanan işlerden elde edilen"
        />
        <ReportCard 
          title="Servis Başına Ortalama" 
          value={`₺${Math.round(avgServiceCost).toLocaleString()}`} 
          icon="📊" 
          color="#3b82f6" 
          sub="İş emri başına gelir"
        />
        <ReportCard 
          title="En Popüler Marka" 
          value={topBrand} 
          icon="🚗" 
          color="#f59e0b" 
          sub="Servise en çok gelen marka"
        />
        <ReportCard 
          title="Başarı Oranı" 
          value={`%${records.length > 0 ? Math.round((completedRecords.length / records.length) * 100) : 0}`} 
          icon="✅" 
          color="#8b5cf6" 
          sub="Tamamlanan / Toplam İş"
        />
      </div>

      {/* DETAYLI LİSTE / TABLO */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>Son Tamamlanan İşlemler</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #f3f4f6' }}>
              <th style={{ padding: '12px', color: '#6b7280' }}>Araç</th>
              <th style={{ padding: '12px', color: '#6b7280' }}>Yapılan İşlem</th>
              <th style={{ padding: '12px', color: '#6b7280', textAlign: 'right' }}>Ücret</th>
            </tr>
          </thead>
          <tbody>
            {completedRecords.slice(0, 5).map(record => {
              const v = vehicles.find(v => v.id === record.vehicleId);
              return (
                <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{v?.plate} <span style={{fontWeight:'normal', fontSize:'0.8rem', color:'#6b7280'}}>({v?.brand})</span></td>
                  <td style={{ padding: '12px' }}>{record.description}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>₺{record.totalCost?.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// YARDIMCI BİLEŞEN: Rapor Kartı
function ReportCard({ title, value, icon, color, sub }: any) {
  return (
    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', opacity: 0.1 }}>{icon}</div>
      <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>{title}</h3>
      <p style={{ margin: '0.5rem 0', fontSize: '1.75rem', fontWeight: 'bold', color: color }}>{value}</p>
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>{sub}</p>
    </div>
  );
}