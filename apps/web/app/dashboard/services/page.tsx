// apps/web/app/dashboard/services/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store';
import { createServiceRecord, getServiceRecordsByTenant, updateServiceStatus } from '../../../lib/service';
import { getVehiclesByTenant } from '../../../lib/vehicle';
import { getInventoryByTenant, Part } from '../../../lib/inventory';
import { getCustomersByTenant, Customer } from '../../../lib/customer';
import { ServiceRecord, Vehicle, LaborItem } from '@repo/types';

export default function ServicesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inventory, setInventory] = useState<Part[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // GÖRÜNÜM: 'list' (Liste) veya 'create' (Tam Ekran Servis Masası)
  const [view, setView] = useState<'list' | 'create'>('list');

  // --- SERVİS MASASI STATE'LERİ ---
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vehicleKm, setVehicleKm] = useState('');
  const [arizaNotu, setArizaNotu] = useState('');
  
  const [activeTab, setActiveTab] = useState<'parts' | 'labor'>('parts');
  const [inventorySearch, setInventorySearch] = useState('');
  
  const [cartParts, setCartParts] = useState<any[]>([]);
  const [cartLabor, setCartLabor] = useState<LaborItem[]>([]);
  
  const [kdvIncluded, setKdvIncluded] = useState(true);
  const [kdvRate, setKdvRate] = useState(20);
  const [technicianName, setTechnicianName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listSearch, setListSearch] = useState('');

  const fetchData = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      const [rData, vData, iData, cData] = await Promise.all([
        getServiceRecordsByTenant(user.tenantId),
        getVehiclesByTenant(user.tenantId),
        getInventoryByTenant(user.tenantId),
        getCustomersByTenant(user.tenantId)
      ]);
      setRecords(rData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setVehicles(vData);
      setInventory(iData);
      setCustomers(cData);
      setTechnicianName(user.fullName);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  // --- HESAPLAMALAR ---
  const partsTotal = cartParts.reduce((sum, p) => sum + p.totalPrice, 0);
  const laborTotal = cartLabor.reduce((sum, l) => sum + l.price, 0);
  const subtotal = partsTotal + laborTotal;
  const kdvAmount = kdvIncluded ? subtotal * (kdvRate / 100) : 0;
  const grandTotal = subtotal + kdvAmount;

  // --- SEPET İŞLEMLERİ (Prompt ile hızlı veri girişi) ---
  const handleAddStockPart = (part: Part) => {
    const qtyStr = window.prompt(`Kaç adet "${part.name}" eklenecek?\n(Stok: ${part.stockQuantity})`, "1");
    if (!qtyStr) return;
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) return;
    if (qty > part.stockQuantity) {
      alert(`Stokta yalnızca ${part.stockQuantity} adet var!`);
      return;
    }
    setCartParts([...cartParts, {
      partId: part.id, name: part.name, quantity: qty,
      unitPrice: part.unitPrice, totalPrice: qty * part.unitPrice, isManual: false
    }]);
  };

  const handleAddManualPart = () => {
    const name = window.prompt("Manuel Parça/Malzeme Adı:");
    if (!name) return;
    const qtyStr = window.prompt("Adet:", "1");
    if (!qtyStr) return;
    const priceStr = window.prompt("Birim Fiyat (₺):");
    if (!priceStr) return;

    const qty = parseInt(qtyStr);
    const price = parseFloat(priceStr.replace(',', '.'));
    if (isNaN(qty) || isNaN(price)) return;

    setCartParts([...cartParts, {
      partId: 'manual', name: name, quantity: qty,
      unitPrice: price, totalPrice: qty * price, isManual: true
    }]);
  };

  const handleAddLabor = () => {
    const desc = window.prompt("İşlem açıklaması (Örn: Yağ Değişimi):");
    if (!desc) return;
    const priceStr = window.prompt("Fiyat (₺):");
    if (!priceStr) return;

    const price = parseFloat(priceStr.replace(',', '.'));
    if (isNaN(price)) return;

    setCartLabor([...cartLabor, { description: desc, price: price }]);
  };

  const handleSave = async () => {
    if (!user?.tenantId || !selectedVehicleId) {
      alert('Servis başlatmak için önce araç seçin.'); return;
    }
    if (cartParts.length === 0 && cartLabor.length === 0) {
      alert('En az bir parça veya işçilik satırı ekleyin.'); return;
    }
    setIsSubmitting(true);

    try {
      await createServiceRecord({
        tenantId: user.tenantId,
        vehicleId: selectedVehicleId,
        description: arizaNotu, // Arıza Notu -> description
        notes: notes,
        currentMileage: vehicleKm ? Number(vehicleKm) : undefined,
        technicianName: technicianName,
        status: 'tamamlandi', // Veya 'bekliyor'
        usedParts: cartParts,
        laborItems: cartLabor,
        subtotal: subtotal,
        kdvIncluded: kdvIncluded,
        taxRate: kdvIncluded ? kdvRate : 0,
        kdvAmount: kdvAmount,
        totalCost: grandTotal
      });
      
      // Temizle ve Listeye Dön
      setSelectedVehicleId(''); setVehicleKm(''); setArizaNotu(''); setNotes('');
      setCartParts([]); setCartLabor([]);
      fetchData();
      setView('list');
    } catch (error) {
      alert('Servis kaydedilemedi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- EKRAN 1: TAM EKRAN SERVİS MASASI (CREATE) ---
  if (view === 'create') {
    const visibleInventory = inventory.filter(p => p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || p.sku.toLowerCase().includes(inventorySearch.toLowerCase()));

    return (
      <div style={{ backgroundColor: '#F0F2F5', minHeight: 'calc(100vh - 80px)', padding: '1rem', margin: '-2rem', fontFamily: 'system-ui' }}>
        
        {/* Üst Bar / Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
          <button onClick={() => setView('list')} style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', backgroundColor: 'white', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            ⬅️
          </button>
          <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Yeni servis girişi</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Araç Bilgileri (Üst Panel) */}
          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '4px', height: '40px', backgroundColor: '#F59E0B', borderRadius: '4px' }}></div>
            <div style={{ flex: 1.5 }}>
              <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: 'bold' }}>
                <option value="">Araç Plakası Seçin</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} ({v.brand})</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" placeholder="Araç KM" value={vehicleKm} onChange={(e) => setVehicleKm(e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: '500' }} />
            </div>
            <div style={{ flex: 2 }}>
              <input type="text" placeholder="Araç Arızası / Şikayet..." value={arizaNotu} onChange={(e) => setArizaNotu(e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: '500' }} />
            </div>
          </div>

          {/* Alt Kısım: 3 Kolonlu Yapı */}
          <div style={{ display: 'flex', gap: '1rem', height: '600px' }}>
            
            {/* SOL KOLON: STOK (300px) */}
            <div style={{ width: '300px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>📦 Stoktan parça</h3>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 1rem 0' }}>Listeden tıklayarak sepete ekleyin</p>
              <input type="text" placeholder="🔍 Parça adı veya kod ara" value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '1rem' }} />
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {visibleInventory.map(part => {
                  const outOfStock = part.stockQuantity <= 0;
                  return (
                    <div key={part.id} onClick={() => !outOfStock && handleAddStockPart(part)} style={{ backgroundColor: outOfStock ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${outOfStock ? '#FECACA' : '#E2E8F0'}`, padding: '0.75rem', borderRadius: '12px', cursor: outOfStock ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#111827' }}>{part.name}</div>
                        <div style={{ fontSize: '0.75rem', color: outOfStock ? '#DC2626' : '#6B7280' }}>Stok: {part.stockQuantity} · ₺{part.unitPrice}</div>
                      </div>
                      <span style={{ color: outOfStock ? '#DC2626' : '#F59E0B', fontSize: '1.25rem' }}>{outOfStock ? '🚫' : '⊕'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ORTA KOLON: SEKMELER VE SEPET (Esnek) */}
            <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1rem 1rem 0 1rem' }}>
                <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '0.25rem' }}>
                  <button onClick={() => setActiveTab('parts')} style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'parts' ? 'white' : 'transparent', color: activeTab === 'parts' ? '#1E3A8A' : '#64748B', boxShadow: activeTab === 'parts' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>Parçalar</button>
                  <button onClick={() => setActiveTab('labor')} style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'labor' ? 'white' : 'transparent', color: activeTab === 'labor' ? '#1E3A8A' : '#64748B', boxShadow: activeTab === 'labor' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>İşçilik</button>
                </div>
              </div>

              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                {activeTab === 'parts' && (
                  <>
                    <button onClick={handleAddManualPart} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', border: '1px solid #1E3A8A', borderRadius: '8px', backgroundColor: 'white', color: '#1E3A8A', fontWeight: 'bold', cursor: 'pointer' }}>
                      ✏️ Manuel Parça Ekle
                    </button>
                    {cartParts.length === 0 ? <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>Henüz parça eklenmedi.</p> : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead style={{ backgroundColor: '#E8ECF1' }}><tr><th style={{ padding: '0.5rem', textAlign: 'left' }}>Parça adı</th><th>Adet</th><th>Birim Fiyat</th><th>Toplam</th><th></th></tr></thead>
                        <tbody>
                          {cartParts.map((p, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: p.isManual ? '#FFF8E1' : 'white' }}>
                              <td style={{ padding: '0.75rem' }}>{p.isManual ? '✏️' : '📦'} {p.name}</td>
                              <td style={{ textAlign: 'center' }}>{p.quantity}</td>
                              <td style={{ textAlign: 'center' }}>₺{p.unitPrice}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>₺{p.totalPrice}</td>
                              <td style={{ textAlign: 'center' }}><button onClick={() => setCartParts(cartParts.filter((_, idx) => idx !== i))} style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}

                {activeTab === 'labor' && (
                  <>
                    <button onClick={handleAddLabor} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', border: '1px solid #1E3A8A', borderRadius: '8px', backgroundColor: 'white', color: '#1E3A8A', fontWeight: 'bold', cursor: 'pointer' }}>
                      ➕ İşçilik satırı ekle
                    </button>
                    {cartLabor.length === 0 ? <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>İşçilik kalemi yok.</p> : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead style={{ backgroundColor: '#E8ECF1' }}><tr><th style={{ padding: '0.5rem', textAlign: 'left' }}>İşlem açıklaması</th><th>Fiyat</th><th></th></tr></thead>
                        <tbody>
                          {cartLabor.map((l, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                              <td style={{ padding: '0.75rem' }}>{l.description}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>₺{l.price}</td>
                              <td style={{ textAlign: 'center' }}><button onClick={() => setCartLabor(cartLabor.filter((_, idx) => idx !== i))} style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* SAĞ KOLON: ÖZET VE KAYIT (260px) */}
            <div style={{ width: '260px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>🧾 Özet</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#6b7280' }}>Ara toplam</span>
                <span style={{ fontWeight: 'bold', color: '#1E3A8A' }}>₺{subtotal.toLocaleString()}</span>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>KDV uygula</span>
                  <input type="checkbox" checked={kdvIncluded} onChange={(e) => setKdvIncluded(e.target.checked)} />
                </div>
                <select value={kdvRate} onChange={(e) => setKdvRate(Number(e.target.value))} disabled={!kdvIncluded} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <option value={0}>%0 KDV</option>
                  <option value={10}>%10 KDV</option>
                  <option value={20}>%20 KDV</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '1rem' }}>
                <span style={{ color: '#6b7280' }}>KDV tutarı</span>
                <span style={{ fontWeight: 'bold', color: '#1E3A8A' }}>₺{kdvAmount.toLocaleString()}</span>
              </div>

              <div style={{ background: 'linear-gradient(to bottom right, #0F0F0F, #1E1E1E)', borderRadius: '12px', padding: '1rem', color: 'white', position: 'relative', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#F59E0B' }}></div>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px', color: '#9CA3AF' }}>GENEL TOPLAM</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', marginTop: '0.25rem' }}>₺{grandTotal.toLocaleString()}</div>
              </div>

              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>Teknisyen</label>
              <input type="text" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1rem', backgroundColor: '#F8FAFC' }} />

              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>Notlar (İç Not)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1rem', backgroundColor: '#F8FAFC', resize: 'none' }} />

              <button onClick={handleSave} disabled={isSubmitting} style={{ padding: '1rem', backgroundColor: '#F59E0B', color: '#1E3A8A', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isSubmitting ? 'Kaydediliyor...' : '✅ Servisi tamamla'}
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- EKRAN 2: LİSTE GÖRÜNÜMÜ ---
  const filteredRecords = records.filter(r => {
    const v = vehicles.find(v => v.id === r.vehicleId);
    return r.id.toLowerCase().includes(listSearch.toLowerCase()) || (v && v.plate.toLowerCase().includes(listSearch.toLowerCase())) || r.description.toLowerCase().includes(listSearch.toLowerCase());
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginTop: 0, color: '#111827', fontSize: '2rem' }}>İş Emirleri</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Açık fişleri yönetin veya yeni bir fiş oluşturun.</p>
        </div>
        <button onClick={() => setView('create')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#F59E0B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
          ➕ Yeni Servis Fişi Aç
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <input type="text" placeholder="🔍 Plaka veya şikayet ara..." value={listSearch} onChange={(e) => setListSearch(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', marginBottom: '1.5rem' }} />
        
        {isLoading ? <p>Yükleniyor...</p> : filteredRecords.length === 0 ? <p style={{ color: '#6b7280' }}>Kayıtlı iş emri bulunamadı.</p> : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredRecords.map(record => {
              const vehicle = vehicles.find(v => v.id === record.vehicleId);
              return (
                <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ backgroundColor: '#1e3a8a', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>{vehicle?.plate}</div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#111827' }}>Şikayet: {record.description}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Teknisyen: {record.technicianName} | KM: {record.currentMileage || '--'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Genel Toplam</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '900', color: record.status === 'tamamlandi' ? '#10b981' : '#f59e0b' }}>₺{record.totalCost.toLocaleString()}</div>
                    </div>
                    <button onClick={() => router.push(`/dashboard/invoice/${record.id}`)} style={{ padding: '0.5rem 1rem', backgroundColor: '#374151', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Fatura Seçenekleri</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}