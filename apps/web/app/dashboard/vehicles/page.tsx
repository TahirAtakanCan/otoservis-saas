// apps/web/app/dashboard/vehicles/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../lib/store';
import { createVehicle, getVehiclesByTenant } from '../../../lib/vehicle';
import { getCustomersByTenant, Customer } from '../../../lib/customer';
import { Vehicle } from '@repo/types';
import Link from 'next/link';

export default function VehiclesPage() {
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State'leri
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Arama State'i (YENİ)
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      const vehicleData = await getVehiclesByTenant(user.tenantId);
      const customerData = await getCustomersByTenant(user.tenantId);
      setVehicles(vehicleData);
      setCustomers(customerData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId || !selectedCustomerId) {
      alert('Lütfen bir araç sahibi (müşteri) seçin!');
      return;
    }
    setIsSubmitting(true);

    try {
      await createVehicle({
        tenantId: user.tenantId,
        plate: plate.toUpperCase().replace(/\s+/g, ''),
        brand,
        model,
        year: Number(year),
        mileage: mileage ? Number(mileage) : undefined,
        customerId: selectedCustomerId,
      });

      setPlate(''); setBrand(''); setModel(''); setYear(''); setMileage(''); setSelectedCustomerId('');
      fetchData();
    } catch (error) {
      alert('Araç kaydedilemedi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Arama Filtresi (YENİ)
  const filteredVehicles = vehicles.filter(v => {
    const owner = customers.find(c => c.id === v.customerId);
    const search = searchTerm.toLowerCase();
    return (
      v.plate.toLowerCase().includes(search) || 
      v.brand.toLowerCase().includes(search) || 
      v.model.toLowerCase().includes(search) ||
      (owner && owner.fullName.toLowerCase().includes(search))
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginTop: 0, color: '#111827', fontSize: '2rem' }}>Araç Yönetimi</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Müşteri araçlarını kaydedin ve servis geçmişlerini tek tıkla görüntüleyin.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* SOL: ZENGİNLEŞTİRİLMİŞ ARAÇ EKLEME FORMU */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '2px solid #f3f4f6', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>➕</span> Yeni Araç Kaydı
          </h2>
          
          <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
            
            {/* Grup 1: Müşteri */}
            <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>👤 Kime Ait?</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: 'white' }}
              >
                <option value="">-- Müşteri Seçin --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.fullName} ({c.phone})</option>)}
              </select>
            </div>

            {/* Grup 2: Araç Bilgileri */}
            <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>🏷️ Plaka</label>
                  <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} required placeholder="Örn: 34ABC123" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', textTransform: 'uppercase' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>🏢 Marka</label>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} required placeholder="Örn: Opel" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>🚗 Model</label>
                  <input type="text" value={model} onChange={(e) => setModel(e.target.value)} required placeholder="Örn: Astra" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }} />
                </div>
                <div style={{ width: '80px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>📅 Yıl</label>
                  <input type="number" value={year} onChange={(e) => setYear(e.target.value)} required placeholder="2020" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>⏱️ Kayıt KM (Opsiyonel)</label>
                <input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="Örn: 120000" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }} />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} style={{ padding: '1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' }}>
              {isSubmitting ? 'Kaydediliyor...' : 'Aracı Garaja Ekle'}
            </button>
          </form>
        </div>

        {/* SAĞ: ZENGİNLEŞTİRİLMİŞ ARAÇ LİSTESİ */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f3f4f6', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
              <span>🚘</span> Servisteki Araçlar <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.875rem' }}>{filteredVehicles.length}</span>
            </h2>
            
            {/* ARAMA ÇUBUĞU */}
            <div style={{ position: 'relative', width: '250px' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
              <input 
                type="text" 
                placeholder="Plaka, marka veya müşteri ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '999px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Araçlar yükleniyor...</div>
          ) : filteredVehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed #e5e7eb', borderRadius: '8px' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📭</span>
              <p style={{ color: '#6b7280', margin: 0 }}>Aradığınız kriterlere uygun araç bulunamadı.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredVehicles.map(vehicle => {
                const owner = customers.find(c => c.id === vehicle.customerId);
                return (
                  <div key={vehicle.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '10px', backgroundColor: '#fcfcfc', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      {/* ŞIK TR PLAKA TASARIMI */}
                      <div style={{ display: 'flex', border: '2px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', height: '38px', alignItems: 'center', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ backgroundColor: '#1d4ed8', color: 'white', padding: '0 6px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                          <span style={{ fontSize: '10px' }}>TR</span>
                        </div>
                        <div style={{ padding: '0 12px', fontWeight: '900', letterSpacing: '2px', color: '#0f172a', fontSize: '1.1rem' }}>
                          {vehicle.plate}
                        </div>
                      </div>

                      {/* ARAÇ & MÜŞTERİ BİLGİSİ */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '1.1rem' }}>{vehicle.brand} {vehicle.model}</span>
                          <span style={{ padding: '0.1rem 0.5rem', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '0.75rem', color: '#4b5563', fontWeight: 'bold', border: '1px solid #e5e7eb' }}>
                            {vehicle.year}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
                          <span>👤 {owner ? owner.fullName : 'Bilinmiyor'}</span>
                          <span>⏱️ {vehicle.mileage ? <strong style={{color:'#4b5563'}}>{vehicle.mileage.toLocaleString()} KM</strong> : 'KM Girilmemiş'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* GEÇMİŞ BUTONU */}
                    <Link 
                      href={`/dashboard/vehicles/${vehicle.id}`} 
                      style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}
                    >
                      Servis Geçmişi <span>➔</span>
                    </Link>

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