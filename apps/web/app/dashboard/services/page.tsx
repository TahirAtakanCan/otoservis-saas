// apps/web/app/dashboard/services/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store';
import { createServiceRecord, getServiceRecordsByTenant, updateServiceStatus, addPartToService } from '../../../lib/service';
import { getVehiclesByTenant } from '../../../lib/vehicle';
import { getInventoryByTenant, Part } from '../../../lib/inventory';
import { getCustomersByTenant, Customer } from '../../../lib/customer'; // <-- Müşterileri import ettik
import { ServiceRecord, Vehicle } from '@repo/types';

export default function ServicesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inventory, setInventory] = useState<Part[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]); // <-- Müşteri State'i
  const [isLoading, setIsLoading] = useState(true);

  // Form State'leri
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  
  // Parça Ekleme State'leri
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQuantity, setPartQuantity] = useState('1');
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      // Müşterileri de Promise.all içine dahil ettik
      const [recordsData, vehiclesData, inventoryData, customersData] = await Promise.all([
        getServiceRecordsByTenant(user.tenantId),
        getVehiclesByTenant(user.tenantId),
        getInventoryByTenant(user.tenantId),
        getCustomersByTenant(user.tenantId)
      ]);
      setRecords(recordsData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      setVehicles(vehiclesData);
      setInventory(inventoryData);
      setCustomers(customersData);
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
    try {
      await createServiceRecord({
        tenantId: user.tenantId,
        vehicleId: selectedVehicleId,
        description,
        status: 'bekliyor',
        totalCost: 0
      });
      setSelectedVehicleId('');
      setDescription('');
      fetchData();
    } catch (error) {
      alert('İş emri oluşturulamadı!');
    }
  };

  const handleStatusChange = async (recordId: string, newStatus: string) => {
    try {
      await updateServiceStatus(recordId, newStatus as any);
      
      // WHATSAPP ENTEGRASYONU (Sadece Tamamlandı seçilirse çalışır)
      if (newStatus === 'tamamlandi') {
        const record = records.find(r => r.id === recordId);
        const vehicle = vehicles.find(v => v.id === record?.vehicleId);
        const customer = customers.find(c => c.id === vehicle?.customerId);

        if (customer && customer.phone) {
          const wantToNotify = window.confirm('İşlem tamamlandı! Müşteriye WhatsApp üzerinden fatura bilgisini göndermek ister misiniz?');
          
          if (wantToNotify) {
            // Telefon numarasını WhatsApp formatına uygun hale getir (Boşlukları sil, başına 90 ekle vb.)
            let phone = customer.phone.replace(/\D/g, '');
            if (phone.length === 10) phone = '90' + phone; // 532 ile başlıyorsa
            else if (phone.startsWith('0')) phone = '90' + phone.substring(1); // 0532 ile başlıyorsa

            // Gönderilecek Mesaj Taslağı
            const message = `Merhaba ${customer.fullName},\n\n${vehicle?.plate} plakalı aracınızın servis işlemleri tamamlanmıştır. 🔧\n\n💰 Toplam Tutar: ₺${record?.totalCost?.toLocaleString() || 0}\n\nBizi tercih ettiğiniz için teşekkür ederiz. Kazasız sürüşler dileriz!`;
            
            // WhatsApp Web/App tetikleyici link
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
          }
        } else {
          alert('Bu araca ait kayıtlı bir müşteri telefonu bulunamadı.');
        }
      }

      fetchData();
    } catch (error) {
      alert('Durum güncellenemedi!');
    }
  };

  const handleAddPart = async (recordId: string) => {
    if (!selectedPartId || Number(partQuantity) <= 0) return;
    
    try {
      await addPartToService(recordId, selectedPartId, Number(partQuantity));
      alert('Parça başarıyla eklendi ve stoktan düşüldü!');
      setSelectedPartId('');
      setPartQuantity('1');
      setActiveRecordId(null);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Parça eklenirken bir hata oluştu.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bekliyor': return { bg: '#fef3c7', text: '#d97706' };
      case 'islemde': return { bg: '#dbeafe', text: '#2563eb' };
      case 'tamamlandi': return { bg: '#d1fae5', text: '#059669' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#111827' }}>İş Emirleri</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Servisteki araçlara yapılan işlemleri ve kullanılan parçaları yönetin.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Yeni İş Emri Aç</h2>
          <form onSubmit={handleCreateRecord} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">-- Araç Seçin --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} ({v.brand})</option>)}
            </select>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} placeholder="Müşteri şikayeti..." style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }} />
            <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>İş Emrini Başlat</button>
          </form>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Servis Kayıtları</h2>
          
          {isLoading ? <p>Yükleniyor...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              {records.map(record => {
                const vehicle = vehicles.find(v => v.id === record.vehicleId);
                const statusStyle = getStatusColor(record.status);
                // @ts-ignore
                const usedParts = record.usedParts || [];
                
                return (
                  <div key={record.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#111827' }}>
                        {vehicle?.plate} <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>({vehicle?.brand})</span>
                      </div>
                      <select value={record.status} onChange={(e) => handleStatusChange(record.id, e.target.value)} style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, fontWeight: 'bold', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>
                        <option value="bekliyor">⏳ Bekliyor</option>
                        <option value="islemde">🔧 İşlemde</option>
                        <option value="tamamlandi">✅ Tamamlandı</option>
                      </select>
                    </div>

                    <div style={{ padding: '1rem' }}>
                      <p style={{ margin: '0 0 1rem 0', color: '#4b5563', fontSize: '0.875rem' }}>{record.description}</p>
                      
                      {usedParts.length > 0 && (
                        <div style={{ marginBottom: '1rem', backgroundColor: '#f3f4f6', padding: '0.75rem', borderRadius: '6px' }}>
                          <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Kullanılan Parçalar:</strong>
                          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#374151' }}>
                            {usedParts.map((part: any, i: number) => (
                              <li key={i}>{part.quantity}x {part.name} <span style={{ color: '#10b981', fontWeight: 'bold' }}>(₺{part.totalPrice})</span></li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                        <div>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Toplam Tutar: </span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>₺{record.totalCost?.toLocaleString() || 0}</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => router.push(`/dashboard/invoice/${record.id}`)}
                            style={{ padding: '0.5rem 1rem', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                          >
                            🖨️ Formu Yazdır
                          </button>
                          
                          {record.status !== 'tamamlandi' && (
                            <button 
                              onClick={() => setActiveRecordId(activeRecordId === record.id ? null : record.id)}
                              style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                            >
                              + Parça/İşçilik Ekle
                            </button>
                          )}
                        </div>
                      </div>

                      {activeRecordId === record.id && (
                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '6px', display: 'flex', gap: '0.5rem' }}>
                          <select value={selectedPartId} onChange={(e) => setSelectedPartId(e.target.value)} style={{ flex: 2, padding: '0.5rem', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                            <option value="">Depodan Parça Seçin</option>
                            {inventory.map(p => (
                              <option key={p.id} value={p.id} disabled={p.stockQuantity === 0}>
                                {p.name} (Stok: {p.stockQuantity}) - ₺{p.unitPrice}
                              </option>
                            ))}
                          </select>
                          <input type="number" value={partQuantity} onChange={(e) => setPartQuantity(e.target.value)} min="1" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #bfdbfe' }} title="Adet" />
                          <button onClick={() => handleAddPart(record.id)} style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Ekle
                          </button>
                        </div>
                      )}

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