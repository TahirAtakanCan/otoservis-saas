// apps/web/app/dashboard/tenants/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createTenant, getTenants } from '../../../lib/tenant';
import { Tenant } from '@repo/types';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State'leri
  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sayfa açıldığında şirketleri yükle
  const fetchTenants = async () => {
    setIsLoading(true);
    const data = await getTenants();
    setTenants(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createTenant({
        name,
        primaryColor,
      });
      setName('');
      setPrimaryColor('#000000');
      fetchTenants(); // Listeyi yenile
    } catch (error) {
      alert('Şirket eklenemedi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#111827' }}>Şirket (Otoservis) Yönetimi</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Sisteme kayıtlı otoservis işletmelerini buradan yönetebilirsiniz.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* YENİ ŞİRKET EKLEME FORMU */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Yeni Şirket Ekle</h2>
          
          <form onSubmit={handleAddTenant} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>İşletme Adı</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                placeholder="Örn: Akan Oto Servis"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Marka Ana Rengi</label>
              <input 
                type="color" 
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ width: '100%', height: '40px', padding: '0', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ padding: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.5rem' }}
            >
              {isSubmitting ? 'Ekleniyor...' : 'Şirketi Kaydet'}
            </button>
          </form>
        </div>

        {/* KAYITLI ŞİRKETLER LİSTESİ */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Kayıtlı Şirketler</h2>
          
          {isLoading ? (
            <p>Yükleniyor...</p>
          ) : tenants.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Henüz sisteme kayıtlı bir işletme bulunmuyor.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {tenants.map(tenant => (
                <div key={tenant.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: tenant.primaryColor, borderRadius: '50%' }}></div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>{tenant.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: {tenant.id}</span>
                    </div>
                  </div>
                  <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '0.875rem' }}>Aktif</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}