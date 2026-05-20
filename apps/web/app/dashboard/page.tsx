// apps/web/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../lib/store';
import { getAppointmentsByTenant, Appointment } from '../../lib/appointment';
import { getServiceRecordsByTenant } from '../../lib/service';
import { getInventoryByTenant, Part } from '../../lib/inventory';
import { getVehiclesByTenant } from '../../lib/vehicle';
import { ServiceRecord, Vehicle } from '@repo/types'; // <-- DOĞRU YER BURASI
import Link from 'next/link';

export default function DashboardHomePage() {
  const { user, tenant } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Kumanda Merkezi Verileri
  const [todayAppointments, setTodayAppointments] = useState<(Appointment & { vehicle?: Vehicle })[]>([]);
  const [activeServices, setActiveServices] = useState<(ServiceRecord & { vehicle?: Vehicle })[]>([]);
  const [criticalStock, setCriticalStock] = useState<Part[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.tenantId) return;
      setIsLoading(true);
      
      try {
        const [appointments, services, inventory, vehicles] = await Promise.all([
          getAppointmentsByTenant(user.tenantId),
          getServiceRecordsByTenant(user.tenantId),
          getInventoryByTenant(user.tenantId),
          getVehiclesByTenant(user.tenantId)
        ]);

        // 1. BUGÜNÜN RANDEVULARINI BUL
        const todayString = new Date().toDateString();
        const todayApps = appointments
          .filter(app => new Date(app.date).toDateString() === todayString)
          .map(app => ({ ...app, vehicle: vehicles.find(v => v.id === app.vehicleId) }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 2. AKTİF İŞ EMİRLERİNİ BUL (Bekliyor ve İşlemde olanlar)
        const activeServs = services
          .filter(s => s.status === 'bekliyor' || s.status === 'islemde')
          .map(s => ({ ...s, vehicle: vehicles.find(v => v.id === s.vehicleId) }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        // 3. KRİTİK STOKLARI BUL (5 adetten az kalanlar)
        const lowStock = inventory
          .filter(part => part.stockQuantity < 5)
          .sort((a, b) => a.stockQuantity - b.stockQuantity);

        setTodayAppointments(todayApps);
        setActiveServices(activeServs);
        setCriticalStock(lowStock);

      } catch (error) {
        console.error("Dashboard verileri çekilemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (isLoading) {
    return <div style={{ padding: '2rem', color: '#6b7280' }}>Kumanda merkezi yükleniyor...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginTop: 0, color: '#111827', fontSize: '2rem' }}>Kumanda Merkezi</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>İşletmenizin anlık operasyonel özeti aşağıdadır.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: tenant?.primaryColor || '#10b981' }}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* 3 SÜTUNLU GRID YAPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* 1. KART: BUGÜNÜN RANDEVULARI */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f3f4f6', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📅</span> Bugünün Randevuları
            </h2>
            <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold' }}>
              {todayAppointments.length}
            </span>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {todayAppointments.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', margin: 'auto 0' }}>Bugün için planlanmış randevu yok.</p>
            ) : (
              todayAppointments.map(app => (
                <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#111827' }}>{app.vehicle?.plate}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{app.vehicle?.brand}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#2563eb' }}>
                    {new Date(app.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <Link href="/dashboard/appointments" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 'bold' }}>
            Tüm Takvimi Gör →
          </Link>
        </div>

        {/* 2. KART: AKTİF İŞ EMİRLERİ */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f3f4f6', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔧</span> Atölyedeki Araçlar
            </h2>
            <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold' }}>
              {activeServices.length}
            </span>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeServices.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', margin: 'auto 0' }}>Atölyede bekleyen araç yok. Harika!</p>
            ) : (
              activeServices.slice(0, 4).map(service => ( // Sadece ilk 4'ünü göster kalabalık yapmasın
                <div key={service.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '8px', borderLeft: `4px solid ${service.status === 'bekliyor' ? '#f59e0b' : '#3b82f6'}` }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#111827' }}>{service.vehicle?.plate}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {service.description}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', backgroundColor: service.status === 'bekliyor' ? '#fef3c7' : '#dbeafe', color: service.status === 'bekliyor' ? '#d97706' : '#2563eb' }}>
                    {service.status === 'bekliyor' ? 'Bekliyor' : 'İşlemde'}
                  </div>
                </div>
              ))
            )}
          </div>

          <Link href="/dashboard/services" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: '#f59e0b', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 'bold' }}>
            Tüm İş Emirlerine Git →
          </Link>
        </div>

        {/* 3. KART: KRİTİK STOK UYARILARI */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f3f4f6', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠️</span> Azalan Stoklar
            </h2>
            {criticalStock.length > 0 && (
              <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
                {criticalStock.length} Kritik
              </span>
            )}
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {criticalStock.length === 0 ? (
              <p style={{ color: '#10b981', textAlign: 'center', margin: 'auto 0', fontWeight: 'bold' }}>Tüm stoklar yeterli seviyede. ✅</p>
            ) : (
              criticalStock.slice(0, 4).map(part => (
                <div key={part.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#991b1b' }}>{part.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>SKU: {part.sku}</div>
                  </div>
                  <div style={{ fontWeight: '900', color: '#dc2626', fontSize: '1.1rem' }}>
                    {part.stockQuantity} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>Adet</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link href="/dashboard/inventory" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: '#ef4444', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 'bold' }}>
            Depoyu Yönet →
          </Link>
        </div>

      </div>

      {/* Titreşim efekti için minik bir CSS (Critical badge için) */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}