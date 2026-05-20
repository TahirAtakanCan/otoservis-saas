// apps/web/app/dashboard/services/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../lib/store';
import { createServiceRecord, getServiceRecordsByTenant, updateServiceStatus } from '../../../lib/service';
import { getVehiclesByTenant } from '../../../lib/vehicle';
import { ServiceRecord, Vehicle } from '@repo/types';

export default function ServicesPage() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State'leri
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      const recordsData = await getServiceRecordsByTenant(user.tenantId);
      const vehiclesData = await getVehiclesByTenant(user.tenantId);
      // Tarihe göre en yeniler en üstte olacak şekilde sıralayalım (Geçici çözüm)
      setRecords(recordsData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      setVehicles(vehiclesData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId || !selectedVehicleId) return;
    setIsSubmitting(true);

    try {
      await createServiceRecord({
        tenantId: user.tenantId,
        vehicleId: selectedVehicleId,
        description,
        status: 'bekliyor', // İlk açılışta her zaman bekliyor statüsündedir
        totalCost: 0, // Şimdilik 0, iş bitince fiyat girilecek
      });

      setSelectedVehicleId('');
      setDescription('');
      fetchData();
    } catch (error) {
      alert('İş emri oluşturulamadı!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (recordId: string, newStatus: ServiceRecord['status']) => {
    try {
      await updateServiceStatus(recordId, newStatus);
      fetchData(); // Listeyi yenile
    } catch (error) {
      alert('Durum güncellenemedi!');
    }
  };

  // Duruma göre renk veren yardımcı fonksiyon
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bekliyor': return { bg: '#fef3c7', text: '#d97706' }; // Sarı
      case 'islemde': return { bg: '#dbeafe', text: '#2563eb' }; // Mavi
      case 'tamamlandi': return { bg: '#d1fae5', text: '#059669' }; // Yeşil
      case 'iptal': return { bg: '#fee2e2', text: '#dc2626' }; // Kırmızı
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#111827' }}>İş Emirleri (Servis Kayıtları)</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Servisteki araçların durumlarını takip edin ve yeni iş emirleri oluşturun.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* YENİ İŞ EMRİ FORMU */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Yeni İş Emri Aç</h2>
          
          <form onSubmit={handleCreateRecord} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>İşlem Yapılacak Araç</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white' }}
              >
                <option value="">-- Araç Seçin --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate} ({v.brand} {v.model})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Müşteri Şikayeti / Yapılacak İşlemler</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Örn: 10.000 bakımı yapılacak. Sağ arka tekerden ses geliyor, balatalar kontrol edilecek."
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ padding: '0.75rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.5rem' }}
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'İş Emrini Başlat'}
            </button>
          </form>
        </div>

        {/* İŞ EMİRLERİ LİSTESİ */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Aktif Servis Kayıtları</h2>
          
          {isLoading ? (
            <p>Kayıtlar yükleniyor...</p>
          ) : records.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Şu an serviste işlem gören bir araç bulunmuyor.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {records.map(record => {
                const vehicle = vehicles.find(v => v.id === record.vehicleId);
                const statusStyle = getStatusColor(record.status);
                
                return (
                  <div key={record.id} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                    
                    {/* Üst Kısım: Plaka ve Durum */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#111827' }}>
                        {vehicle ? vehicle.plate : 'Yükleniyor...'} <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'normal' }}>({vehicle?.brand})</span>
                      </div>
                      
                      {/* Durum Değiştirme Menüsü */}
                      <select 
                        value={record.status}
                        onChange={(e) => handleStatusChange(record.id, e.target.value as ServiceRecord['status'])}
                        style={{ 
                          backgroundColor: statusStyle.bg, 
                          color: statusStyle.text, 
                          fontWeight: 'bold', 
                          border: 'none', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="bekliyor">⏳ Bekliyor</option>
                        <option value="islemde">🔧 İşlemde</option>
                        <option value="tamamlandi">✅ Tamamlandı</option>
                        <option value="iptal">❌ İptal</option>
                      </select>
                    </div>

                    {/* Alt Kısım: Açıklama */}
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563', backgroundColor: '#f9fafb', padding: '0.5rem', borderRadius: '4px' }}>
                      {record.description}
                    </p>
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