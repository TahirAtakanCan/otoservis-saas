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
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function ServicesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inventory, setInventory] = useState<Part[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // GÖRÜNÜM STATE'İ
  const [view, setView] = useState<'list' | 'create'>('list');

  // YENİ FİŞ OLUŞTURMA STATE'LERİ
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

  // ARAÇ CANLI ARAMA STATE'LERİ
  const [vehicleSearchText, setVehicleSearchText] = useState('');
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);

  // DETAY GÖRÜNÜMÜ (EXPAND) STATE'LERİ
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expPartId, setExpPartId] = useState('');
  const [expPartQty, setExpPartQty] = useState('1');
  const [expLaborDesc, setExpLaborDesc] = useState('');
  const [expLaborPrice, setExpLaborPrice] = useState('');

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

  // HESAPLAMALAR
  const partsTotal = cartParts.reduce((sum, p) => sum + p.totalPrice, 0);
  const laborTotal = cartLabor.reduce((sum, l) => sum + l.price, 0);
  const subtotal = partsTotal + laborTotal;
  const kdvAmount = kdvIncluded ? subtotal * (kdvRate / 100) : 0;
  const grandTotal = subtotal + kdvAmount;

  // SEPET İŞLEMLERİ
  const handleAddStockPart = (part: Part) => {
    const qtyStr = window.prompt(`Kaç adet "${part.name}" eklenecek?\n(Stok: ${part.stockQuantity})`, "1");
    if (!qtyStr) return;
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) return;
    if (qty > part.stockQuantity) {
      alert(`Stokta yalnızca ${part.stockQuantity} adet var!`);
      return;
    }
    setCartParts([...cartParts, { partId: part.id, name: part.name, quantity: qty, unitPrice: part.unitPrice, totalPrice: qty * part.unitPrice, isManual: false }]);
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
    setCartParts([...cartParts, { partId: 'manual', name: name, quantity: qty, unitPrice: price, totalPrice: qty * price, isManual: true }]);
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
    if (!user?.tenantId || !selectedVehicleId) { alert('Servis başlatmak için önce araç seçin.'); return; }
    if (cartParts.length === 0 && cartLabor.length === 0) { alert('En az bir parça veya işçilik satırı ekleyin.'); return; }
    setIsSubmitting(true);
    try {
      await createServiceRecord({
        tenantId: user.tenantId, vehicleId: selectedVehicleId, description: arizaNotu, notes: notes,
        currentMileage: vehicleKm ? Number(vehicleKm) : undefined, technicianName: technicianName, status: 'islemde',
        usedParts: cartParts, laborItems: cartLabor, subtotal: subtotal, kdvIncluded: kdvIncluded,
        taxRate: kdvIncluded ? kdvRate : 0, kdvAmount: kdvAmount, totalCost: grandTotal
      });
      setSelectedVehicleId(''); setVehicleKm(''); setArizaNotu(''); setNotes(''); setCartParts([]); setCartLabor([]);
      setVehicleSearchText('');
      fetchData(); setView('list');
    } catch (error) { alert('Servis kaydedilemedi!'); } finally { setIsSubmitting(false); }
  };

  const handleAddPartToExisting = async (record: ServiceRecord) => {
    if (!expPartId || !expPartQty) return;
    const part = inventory.find(p => p.id === expPartId);
    if (!part) return;
    const qty = Number(expPartQty);
    if (qty > part.stockQuantity) { alert('Depoda yeterli stok yok!'); return; }

    try {
      const partRef = doc(db, 'inventory', part.id);
      await updateDoc(partRef, { stockQuantity: increment(-qty) });

      const partTotal = part.unitPrice * qty;
      const updatedParts = [...(record.usedParts || []), { partId: part.id, name: part.name, quantity: qty, unitPrice: part.unitPrice, totalPrice: partTotal, isManual: false }];
      const newSubtotal = (record.subtotal || 0) + partTotal;
      const newKdvAmount = record.kdvIncluded ? newSubtotal * ((record.taxRate || 0) / 100) : 0;
      const newGrandTotal = newSubtotal + newKdvAmount;

      const recordRef = doc(db, 'services', record.id);
      await updateDoc(recordRef, { usedParts: updatedParts, subtotal: newSubtotal, kdvAmount: newKdvAmount, totalCost: newGrandTotal });

      setExpPartId(''); setExpPartQty('1'); fetchData();
    } catch (error) { alert('Parça eklenirken hata oluştu.'); }
  };

  const handleAddLaborToExisting = async (record: ServiceRecord) => {
    if (!expLaborDesc || !expLaborPrice) return;
    const price = Number(expLaborPrice);
    if (isNaN(price) || price <= 0) return;

    try {
      const updatedLabor = [...(record.laborItems || []), { description: expLaborDesc, price: price }];
      const newSubtotal = (record.subtotal || 0) + price;
      const newKdvAmount = record.kdvIncluded ? newSubtotal * ((record.taxRate || 0) / 100) : 0;
      const newGrandTotal = newSubtotal + newKdvAmount;

      const recordRef = doc(db, 'services', record.id);
      await updateDoc(recordRef, { laborItems: updatedLabor, subtotal: newSubtotal, kdvAmount: newKdvAmount, totalCost: newGrandTotal });

      setExpLaborDesc(''); setExpLaborPrice(''); fetchData();
    } catch (error) { alert('İşçilik eklenirken hata oluştu.'); }
  };

  const handleStatusChange = async (recordId: string, newStatus: string) => {
    try { await updateServiceStatus(recordId, newStatus as any); fetchData(); } 
    catch (error) { alert('Durum güncellenemedi.'); }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'bekliyor': return { bg: '#FEF9C3', color: '#CA8A04', border: '#FEF08A' };
      case 'islemde': return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
      case 'tamamlandi': return { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' };
      default: return { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' };
    }
  };

  // ================= EKRAN 1: TAM EKRAN SERVİS MASASI (YENİ FİŞ) =================
  if (view === 'create') {
    const visibleInventory = inventory.filter(p => p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || p.sku.toLowerCase().includes(inventorySearch.toLowerCase()));

    const matchingVehicles = vehicles.filter(v => {
      const owner = customers.find(c => c.id === v.customerId);
      const text = vehicleSearchText.toLowerCase();
      return (
        v.plate.toLowerCase().includes(text) ||
        (owner && owner.fullName.toLowerCase().includes(text)) ||
        (owner && owner.phone.toLowerCase().includes(text))
      );
    });

    return (
      <div style={{ backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 80px)', padding: '1.5rem', margin: '-2rem', fontFamily: 'system-ui' }}>
        
        {/* Üst Bar */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
          <button onClick={() => setView('list')} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            ⬅️ İptal Et ve Geri Dön
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0F172A', fontWeight: 'bold' }}>Yeni Servis Fişi Oluştur</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* ARAÇ BİLGİLERİ (Relative & Z-Index Onarıldı) */}
          <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', zIndex: 20 }}>
            
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.4rem' }}>🚘 İşlem Yapılacak Araç (Plaka, İsim veya Telefon No Yazın)</label>
              
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Aramak için yazmaya başlayın (Örn: 34ABC..., Ahmet..., 0532...)" 
                  value={vehicleSearchText}
                  onFocus={() => setIsVehicleDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsVehicleDropdownOpen(false), 200)}
                  onChange={(e) => {
                    setVehicleSearchText(e.target.value);
                    if (!e.target.value) setSelectedVehicleId('');
                  }}
                  style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', color: '#0F172A', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  onFocusCapture={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                  onBlurCapture={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
                />
                {selectedVehicleId && (
                  <button type="button" onClick={() => { setSelectedVehicleId(''); setVehicleSearchText(''); }} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: '#FEE2E2', color: '#DC2626', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}>
                    Temizle
                  </button>
                )}
              </div>

              {/* AÇILIR MENÜ (Absolute - Alttaki elemanları bozmaz) */}
              {isVehicleDropdownOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto', zIndex: 50, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)' }}>
                  {matchingVehicles.length === 0 ? (
                    <div style={{ padding: '1rem', color: '#64748B', fontSize: '0.9rem', textAlign: 'center' }}>Sonuç bulunamadı...</div>
                  ) : (
                    matchingVehicles.map(v => {
                      const owner = customers.find(c => c.id === v.customerId);
                      return (
                        <div 
                          key={v.id} 
                          onMouseDown={() => {
                            setSelectedVehicleId(v.id);
                            setVehicleSearchText(`${v.plate} (${v.brand} ${v.model}) - Sahibi: ${owner?.fullName || 'Bilinmiyor'}`);
                            setIsVehicleDropdownOpen(false);
                          }}
                          style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background-color 0.1s' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div>
                            <span style={{ backgroundColor: '#1E3A8A', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '4px', fontWeight: 'bold', marginRight: '0.75rem', fontSize: '0.8rem' }}>{v.plate}</span>
                            <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{v.brand} {v.model}</strong>
                          </div>
                          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>👤 {owner?.fullName} ({owner?.phone})</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{ width: '220px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.4rem' }}>⏱️ Geliş KM'si</label>
                <input type="number" placeholder="Örn: 125000" value={vehicleKm} onChange={(e) => setVehicleKm(e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.4rem' }}>🗣️ Şikayet / Arıza</label>
                <input type="text" placeholder="Örn: Yağ bakımı yapılacak, frenden ses geliyor..." value={arizaNotu} onChange={(e) => setArizaNotu(e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* 3 KOLONLU SEPET VE ÖZET (Sabit Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 280px', gap: '1.25rem', alignItems: 'start', zIndex: 10 }}>
            
            {/* SOL KOLON: STOK */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', padding: '1rem', height: 'calc(100vh - 320px)', minHeight: '450px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 0.25rem 0', color: '#0F172A', fontSize: '1rem' }}>📦 Depodaki Parçalar</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 0.75rem 0' }}>Tıklayarak sepete atın</p>
              <input type="text" placeholder="🔍 Parça ara..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} style={{ padding: '0.6rem 0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', marginBottom: '0.75rem', outline: 'none', fontSize: '0.85rem' }} />
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
                {visibleInventory.map(part => {
                  const outOfStock = part.stockQuantity <= 0;
                  return (
                    <div key={part.id} onClick={() => !outOfStock && handleAddStockPart(part)} style={{ backgroundColor: outOfStock ? '#FEF2F2' : 'white', border: `1px solid ${outOfStock ? '#FECACA' : '#E2E8F0'}`, padding: '0.75rem', borderRadius: '8px', cursor: outOfStock ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = outOfStock ? '#FECACA' : '#94A3B8'} onMouseLeave={(e) => e.currentTarget.style.borderColor = outOfStock ? '#FECACA' : '#E2E8F0'}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1E293B' }}>{part.name}</div>
                        <div style={{ fontSize: '0.75rem', color: outOfStock ? '#DC2626' : '#64748B', marginTop: '0.15rem' }}>Stok: {part.stockQuantity} · ₺{part.unitPrice}</div>
                      </div>
                      <span style={{ color: outOfStock ? '#DC2626' : '#3B82F6', fontSize: '1.25rem' }}>{outOfStock ? '🚫' : '⊕'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ORTA KOLON: SEKMELER VE SEPET */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 320px)', minHeight: '450px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              <div style={{ padding: '1rem 1rem 0 1rem' }}>
                <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '0.25rem' }}>
                  <button onClick={() => setActiveTab('parts')} style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', backgroundColor: activeTab === 'parts' ? 'white' : 'transparent', color: activeTab === 'parts' ? '#0F172A' : '#64748B', boxShadow: activeTab === 'parts' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>📦 Parçalar</button>
                  <button onClick={() => setActiveTab('labor')} style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', backgroundColor: activeTab === 'labor' ? 'white' : 'transparent', color: activeTab === 'labor' ? '#0F172A' : '#64748B', boxShadow: activeTab === 'labor' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>🔧 İşçilikler</button>
                </div>
              </div>

              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                {activeTab === 'parts' && (
                  <>
                    <button onClick={handleAddManualPart} style={{ marginBottom: '1rem', width: '100%', padding: '0.75rem', border: '1px dashed #94A3B8', borderRadius: '8px', backgroundColor: '#F8FAFC', color: '#475569', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#3B82F6'} onMouseLeave={e => e.currentTarget.style.borderColor = '#94A3B8'}>
                      + Stokta Olmayan (Manuel) Parça Ekle
                    </button>
                    {cartParts.length === 0 ? <p style={{ textAlign: 'center', color: '#94A3B8', marginTop: '2rem', fontSize: '0.9rem' }}>Sepetiniz boş.</p> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {cartParts.map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: p.isManual ? '#FEFCE8' : 'white', border: `1px solid ${p.isManual ? '#FDE68A' : '#E2E8F0'}`, borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ fontSize: '1.25rem' }}>{p.isManual ? '✏️' : '📦'}</div>
                              <div>
                                <div style={{ fontWeight: 'bold', color: '#0F172A', fontSize: '0.9rem' }}>{p.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>{p.quantity} Adet × ₺{p.unitPrice}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ fontWeight: 'bold', color: '#10B981', fontSize: '1.05rem' }}>₺{p.totalPrice}</div>
                              <button onClick={() => setCartParts(cartParts.filter((_, idx) => idx !== i))} style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '6px', padding: '0.35rem 0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>✖</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {activeTab === 'labor' && (
                  <>
                    <button onClick={handleAddLabor} style={{ marginBottom: '1rem', width: '100%', padding: '0.75rem', border: '1px dashed #94A3B8', borderRadius: '8px', backgroundColor: '#F8FAFC', color: '#475569', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#10B981'} onMouseLeave={e => e.currentTarget.style.borderColor = '#94A3B8'}>
                      + Yeni İşçilik Kalemi Ekle
                    </button>
                    {cartLabor.length === 0 ? <p style={{ textAlign: 'center', color: '#94A3B8', marginTop: '2rem', fontSize: '0.9rem' }}>İşçilik eklenmedi.</p> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {cartLabor.map((l, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ fontSize: '1.25rem' }}>🔧</div>
                              <div style={{ fontWeight: 'bold', color: '#0F172A', fontSize: '0.9rem' }}>{l.description}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ fontWeight: 'bold', color: '#3B82F6', fontSize: '1.05rem' }}>₺{l.price}</div>
                              <button onClick={() => setCartLabor(cartLabor.filter((_, idx) => idx !== i))} style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '6px', padding: '0.35rem 0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>✖</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* SAĞ KOLON: ÖZET VE KAYIT (Kaba Tasarım Düzeltildi) */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', padding: '1.25rem', overflowY: 'auto', height: 'calc(100vh - 320px)', minHeight: '450px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#0F172A', fontSize: '1rem' }}>🧾 Fiyat Özeti</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Ara Toplam</span>
                <span style={{ fontWeight: 'bold', color: '#1E293B' }}>₺{subtotal.toLocaleString()}</span>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>KDV Uygula</span>
                  <input type="checkbox" checked={kdvIncluded} onChange={(e) => setKdvIncluded(e.target.checked)} style={{ transform: 'scale(1.1)' }} />
                </div>
                <select value={kdvRate} onChange={(e) => setKdvRate(Number(e.target.value))} disabled={!kdvIncluded} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', outline: 'none', backgroundColor: 'white', fontSize: '0.85rem' }}>
                  <option value={0}>%0 KDV</option>
                  <option value={10}>%10 KDV</option>
                  <option value={20}>%20 KDV</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <span style={{ color: '#64748B' }}>KDV Tutarı</span>
                <span style={{ fontWeight: 'bold', color: '#1E293B' }}>₺{kdvAmount.toLocaleString()}</span>
              </div>

              <div style={{ background: '#0F172A', borderRadius: '10px', padding: '1rem', color: 'white', marginBottom: '1.25rem', boxShadow: '0 2px 4px rgba(15, 23, 42, 0.2)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px', color: '#94A3B8' }}>GENEL TOPLAM</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', marginTop: '0.25rem', color: '#10B981' }}>₺{grandTotal.toLocaleString()}</div>
              </div>

              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.4rem' }}>👨‍🔧 Teknisyen</label>
              <input type="text" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '0.75rem', backgroundColor: '#F8FAFC', outline: 'none', fontSize: '0.85rem' }} />

              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.4rem' }}>⚠️ Personel İç Notu</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Sadece ekibin göreceği notlar..." style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '1.25rem', backgroundColor: '#F8FAFC', resize: 'none', outline: 'none', fontSize: '0.85rem' }} />
              
              {/* BUTON BOYUTU MÜKEMMEL ÖLÇÜYE ÇEKİLDİ (1.25rem -> 0.75rem padding) */}
              <button onClick={handleSave} disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#F59E0B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)' }}>
                {isSubmitting ? 'Kaydediliyor...' : '✅ Servisi Başlat'}
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ================= EKRAN 2: LİSTE GÖRÜNÜMÜ =================
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const filteredRecords = records.filter(r => {
    if (r.status === 'tamamlandi' && (nowInSeconds - (r.createdAt?.seconds || 0) > 24 * 60 * 60)) return false;
    const v = vehicles.find(v => v.id === r.vehicleId);
    const search = listSearch.toLowerCase();
    return r.id.toLowerCase().includes(search) || (v && v.plate.toLowerCase().includes(search)) || r.description.toLowerCase().includes(search);
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginTop: 0, color: '#111827', fontSize: '2rem' }}>İş Emirleri</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Araçlara müdahale edin, ekstra parça ekleyin veya durumlarını güncelleyin.</p>
        </div>
        <button onClick={() => setView('create')} style={{ padding: '0.75rem 1.25rem', backgroundColor: '#F59E0B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)' }}>
          ➕ Yeni Servis Fişi Aç
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
        <input type="text" placeholder="🔍 Plaka veya şikayet ara..." value={listSearch} onChange={(e) => setListSearch(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', marginBottom: '1.5rem', backgroundColor: '#F8FAFC', fontSize: '0.95rem' }} />
        
        {isLoading ? <p>Yükleniyor...</p> : filteredRecords.length === 0 ? <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>Şu an açık iş emri bulunmuyor.</p> : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredRecords.map(record => {
              const vehicle = vehicles.find(v => v.id === record.vehicleId);
              const isExpanded = expandedId === record.id;
              const statusStyle = getStatusStyle(record.status);
              
              return (
                <div key={record.id} style={{ border: `1px solid ${isExpanded ? '#93C5FD' : '#E2E8F0'}`, borderRadius: '12px', backgroundColor: isExpanded ? '#F8FAFC' : 'white', transition: 'all 0.2s', overflow: 'hidden' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ backgroundColor: '#1E3A8A', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 'bold', letterSpacing: '1px', fontSize: '1rem' }}>{vehicle?.plate}</div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#0F172A' }}>Şikayet: {record.description}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>Geliş KM: {record.currentMileage || '--'} | Tutar: ₺{record.totalCost.toLocaleString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <select value={record.status} onChange={(e) => handleStatusChange(record.id, e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: `1px solid ${statusStyle.border}`, backgroundColor: statusStyle.bg, color: statusStyle.color, fontWeight: 'bold', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <option value="bekliyor">⏳ Bekliyor</option>
                        <option value="islemde">🔧 İşlemde</option>
                        <option value="tamamlandi">✅ Tamamlandı</option>
                      </select>
                      
                      <button onClick={() => router.push(`/dashboard/invoice/${record.id}`)} style={{ padding: '0.5rem 0.75rem', backgroundColor: '#334155', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>🖨️ Fatura</button>
                      <button onClick={() => setExpandedId(isExpanded ? null : record.id)} style={{ padding: '0.5rem 0.75rem', backgroundColor: isExpanded ? '#DBEAFE' : '#F1F5F9', color: isExpanded ? '#1D4ED8' : '#475569', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        {isExpanded ? '⬆️ Gizle' : '⬇️ İçeriği Gör / Düzenle'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #E2E8F0', padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', backgroundColor: 'white' }}>
                      <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#1E3A8A', fontSize: '0.95rem' }}>📦 Kullanılan Parçalar ({(record.usedParts || []).length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                          {(record.usedParts || []).map((p: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.5rem 0.75rem', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                              <span>{p.quantity}x {p.name}</span>
                              <strong style={{ color: '#10B981' }}>₺{p.totalPrice}</strong>
                            </div>
                          ))}
                        </div>
                        {record.status !== 'tamamlandi' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select value={expPartId} onChange={(e) => setExpPartId(e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}>
                              <option value="">Depodan Ekle...</option>
                              {inventory.map(p => <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0}>{p.name} (₺{p.unitPrice})</option>)}
                            </select>
                            <input type="number" value={expPartQty} onChange={(e) => setExpPartQty(e.target.value)} min="1" style={{ width: '60px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }} />
                            <button onClick={() => handleAddPartToExisting(record)} style={{ backgroundColor: '#2563EB', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Ekle</button>
                          </div>
                        )}
                      </div>

                      <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#1E3A8A', fontSize: '0.95rem' }}>🔧 Ekstra İşçilikler ({(record.laborItems || []).length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                          {(record.laborItems || []).map((l: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.5rem 0.75rem', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                              <span>{l.description}</span>
                              <strong style={{ color: '#3B82F6' }}>₺{l.price}</strong>
                            </div>
                          ))}
                        </div>
                        {record.status !== 'tamamlandi' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="text" placeholder="İşlem Adı..." value={expLaborDesc} onChange={(e) => setExpLaborDesc(e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }} />
                            <input type="number" placeholder="₺" value={expLaborPrice} onChange={(e) => setExpLaborPrice(e.target.value)} style={{ width: '70px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }} />
                            <button onClick={() => handleAddLaborToExisting(record)} style={{ backgroundColor: '#10B981', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Ekle</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}