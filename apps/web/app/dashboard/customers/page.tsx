// apps/web/app/dashboard/customers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../lib/store';
import { createCustomer, getCustomersByTenant, Customer } from '../../../lib/customer';

export default function CustomersPage() {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State'leri
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      const data = await getCustomersByTenant(user.tenantId);
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;
    setIsSubmitting(true);

    try {
      await createCustomer({
        tenantId: user.tenantId,
        fullName,
        phone,
        email: email || undefined,
      });

      setFullName('');
      setPhone('');
      setEmail('');
      fetchCustomers();
    } catch (error) {
      alert('Müşteri kaydedilemedi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#111827' }}>Müşteri Yönetimi</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Araç sahiplerinin bilgilerini kaydedebilir ve yönetebilirsiniz.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* MÜŞTERİ EKLEME FORMU */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Yeni Müşteri Kaydı</h2>
          
          <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Adı Soyadı</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Örn: Ahmet Yılmaz"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Telefon Numarası</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="Örn: 0532XXXXXXX"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>E-posta (İsteğe Bağlı)</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Örn: ahmet@kullanici.com"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ padding: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.5rem' }}
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
            </button>
          </form>
        </div>

        {/* MÜŞTERİ LİSTESİ */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Kayıtlı Müşteriler</h2>
          
          {isLoading ? (
            <p>Müşteriler yükleniyor...</p>
          ) : customers.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Bu işletmeye ait henüz bir müşteri kaydı bulunmuyor.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {customers.map(customer => (
                <div key={customer.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>{customer.fullName}</h3>
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>📞 {customer.phone}</span>
                    {customer.email && <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '1rem' }}>✉️ {customer.email}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}