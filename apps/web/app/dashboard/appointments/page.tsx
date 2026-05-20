// apps/web/app/dashboard/appointments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../lib/store';
import { createAppointment, getAppointmentsByTenant, updateAppointmentStatus, Appointment } from '../../../lib/appointment';
import { getVehiclesByTenant } from '../../../lib/vehicle';
import { Vehicle } from '@repo/types';

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State'leri
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      const [appData, vehData] = await Promise.all([
        getAppointmentsByTenant(user.tenantId),
        getVehiclesByTenant(user.tenantId)
      ]);
      
      // Tarihe göre yakın olanı en üste sırala
      const sortedAppointments = appData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setAppointments(sortedAppointments);
      setVehicles(vehData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId || !selectedVehicleId || !appointmentDate) return;
    setIsSubmitting(true);

    try {
      await createAppointment({
        tenantId: user.tenantId,
        vehicleId: selectedVehicleId,
        date: appointmentDate,
        status: 'bekliyor',
        notes: notes
      });

      setSelectedVehicleId('');
      setAppointmentDate('');
      setNotes('');
      fetchData();
    } catch (error) {
      alert('Randevu oluşturulamadı!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateAppointmentStatus(id, status as any);
      fetchData();
    } catch (error) {
      alert('Durum güncellenemedi.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bekliyor': return { bg: '#fef3c7', text: '#d97706', label: '⏳ Bekliyor' };
      case 'onaylandi': return { bg: '#d1fae5', text: '#059669', label: '✅ Onaylandı' };
      case 'iptal': return { bg: '#fee2e2', text: '#dc2626', label: '❌ İptal' };
      default: return { bg: '#f3f4f6', text: '#374151', label: status };
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#111827' }}>Randevu Takvimi</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>İleri tarihli servis randevularını planlayın ve atölye trafiğini yönetin.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* YENİ RANDEVU FORMU */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Yeni Randevu Oluştur</h2>
          
          <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Araç Seçin</label>
              <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="">-- Listeden Seç --</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} ({v.brand})</option>)}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Tarih ve Saat</label>
              <input type="datetime-local" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Notlar / Şikayet (Opsiyonel)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }} />
            </div>

            <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.5rem' }}>
              {isSubmitting ? 'Kaydediliyor...' : 'Randevuyu Kaydet'}
            </button>
          </form>
        </div>

        {/* RANDEVU LİSTESİ */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Yaklaşan Randevular</h2>
          
          {isLoading ? <p>Yükleniyor...</p> : appointments.length === 0 ? <p style={{ color: '#6b7280' }}>Kayıtlı randevu bulunmuyor.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {appointments.map(app => {
                const vehicle = vehicles.find(v => v.id === app.vehicleId);
                const statusInfo = getStatusColor(app.status);
                const appDate = new Date(app.date);
                
                return (
                  <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: app.status === 'iptal' ? '#f9fafb' : 'white', opacity: app.status === 'iptal' ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      {/* Tarih Kutusu */}
                      <div style={{ backgroundColor: '#eff6ff', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', minWidth: '80px' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1d4ed8', lineHeight: 1 }}>{appDate.getDate()}</div>
                        <div style={{ fontSize: '0.75rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          {appDate.toLocaleString('tr-TR', { month: 'short' })}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#1e3a8a', marginTop: '0.25rem' }}>
                          {appDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      
                      {/* Araç ve Not */}
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#111827' }}>
                          {vehicle?.plate} <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'normal' }}>({vehicle?.brand})</span>
                        </div>
                        {app.notes && <div style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem' }}>{app.notes}</div>}
                      </div>
                    </div>

                    {/* Durum Kontrolü */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <span style={{ backgroundColor: statusInfo.bg, color: statusInfo.text, padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {statusInfo.label}
                      </span>
                      <select 
                        value={app.status} 
                        onChange={(e) => handleStatusChange(app.id, e.target.value)} 
                        style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.875rem', cursor: 'pointer' }}
                      >
                        <option value="bekliyor">Beklemeye Al</option>
                        <option value="onaylandi">Onayla</option>
                        <option value="iptal">İptal Et</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}