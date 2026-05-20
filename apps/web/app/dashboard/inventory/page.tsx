// apps/web/app/dashboard/inventory/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../lib/store';
import { createPart, getInventoryByTenant, Part } from '../../../lib/inventory';

export default function InventoryPage() {
  const { user } = useAuthStore();
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State'leri
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchParts = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      const data = await getInventoryByTenant(user.tenantId);
      setParts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [user]);

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;
    setIsSubmitting(true);

    try {
      await createPart({
        tenantId: user.tenantId,
        name,
        sku: sku.toUpperCase(),
        stockQuantity: Number(stockQuantity),
        unitPrice: Number(unitPrice),
      });

      // Formu temizle
      setName(''); setSku(''); setStockQuantity(''); setUnitPrice('');
      fetchParts(); // Listeyi yenile
    } catch (error) {
      alert('Parça kaydedilemedi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#111827' }}>Stok ve Yedek Parça Yönetimi</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Servisteki yedek parçaları, sarf malzemeleri ve fiyatlarını yönetin.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* PARÇA EKLEME FORMU */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Yeni Parça Girişi</h2>
          
          <form onSubmit={handleAddPart} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Parça Adı</label>
              <input 
                type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="Örn: 5W-30 Motor Yağı (4L)"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Stok/Ürün Kodu (SKU)</label>
              <input 
                type="text" value={sku} onChange={(e) => setSku(e.target.value)} required
                placeholder="Örn: YAG-5W30-4L"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Adet/Miktar</label>
                <input 
                  type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} required min="0"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Satış Fiyatı (₺)</label>
                <input 
                  type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required min="0" step="0.01"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.5rem' }}>
              {isSubmitting ? 'Kaydediliyor...' : 'Stoğa Ekle'}
            </button>
          </form>
        </div>

        {/* STOK LİSTESİ */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Mevcut Stok Durumu</h2>
          
          {isLoading ? (
            <p>Stoklar yükleniyor...</p>
          ) : parts.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Henüz kayıtlı bir yedek parça bulunmuyor.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>Parça Kodu & Adı</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Stok</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Birim Fiyat</th>
                </tr>
              </thead>
              <tbody>
                {parts.map(part => (
                  <tr key={part.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 'bold', color: '#111827' }}>{part.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{part.sku}</div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold',
                        backgroundColor: part.stockQuantity < 5 ? '#fee2e2' : '#d1fae5',
                        color: part.stockQuantity < 5 ? '#dc2626' : '#059669'
                      }}>
                        {part.stockQuantity} Adet
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 'bold' }}>
                      ₺{part.unitPrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}