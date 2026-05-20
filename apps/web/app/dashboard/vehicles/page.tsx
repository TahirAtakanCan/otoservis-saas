// apps/web/app/dashboard/vehicles/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../lib/store';
import { createVehicle, getVehiclesByTenant } from '../../../lib/vehicle';
import { getCustomersByTenant, Customer } from '../../../lib/customer';
import { Vehicle } from '@repo/types';

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
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verileri yükle
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
        customerId: selectedCustomerId, // Seçilen gerçek müşteri ID'si bağlandı!
      });

      setPlate('');
      setBrand('');
      setModel('');
      setYear('');
      setSelectedCustomerId('');
      fetchData();
    } catch (error) {
      alert('Araç kaydedilemedi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#111827' }}>Araç Yönetimi</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Servisinize kayıtlı araçların listesini görebilir ve yeni araç girişi yapabilirsiniz.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* ARAÇ EKLEME FORMU */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Yeni Araç Kaydı</h2>
          
          <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Araç Sahibi (Müşteri)</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: 'white' }}
              >
                <option value="">-- Müşteri Seçin --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName} ({c.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Plaka</label>
              <input 
                type="text" 
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                required
                placeholder="Örn: 34ABC123"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Marka</label>
              <input 
                type="text" 
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                placeholder="Örn: Opel"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Model</label>
              <input 
                type="text" 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                placeholder="Örn: Astra"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Model Yılı</label>
              <input 
                type="number" 
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                placeholder="Örn: 2020"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.5rem' }}
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Aracı Servise Kaydet'}
            </button>
          </form>
        </div>

        {/* ARAÇ LİSTESİ */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Servisteki Araçlar</h2>
          
          {isLoading ? (
            <p>Araçlar yükleniyor...</p>
          ) : vehicles.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Bu işletmeye ait henüz bir araç kaydı bulunmuyor.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {vehicles.map(vehicle => {
                // Aracın sahibini bulma hamlesi
                const owner = customers.find(c => c.id === vehicle.customerId);
                return (
                  <div key={vehicle.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ border: '2px solid #1e3a8a', borderRadius: '4px', display: 'flex', marginRight: '1rem', overflow: 'hidden', height: '35px', alignItems: 'center' }}>
                        <div style={{ backgroundColor: '#1e3a8a', color: 'white', fontSize: '10px', padding: '0 4px', display: 'flex', alignItems: 'center', height: '100%', fontWeight: 'bold' }}>TR</div>
                        <div style={{ padding: '0 8px', fontWeight: 'bold', letterSpacing: '1px', color: '#111827' }}>{vehicle.plate}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 'bold', color: '#374151', fontSize: '1.1rem' }}>{vehicle.brand} {vehicle.model}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Sahibi: {owner ? owner.fullName : 'Yükleniyor...'}</span>
                      </div>
                    </div>
                    <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '0.875rem', color: '#4b5563' }}>{vehicle.year}</span>
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