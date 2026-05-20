// apps/web/app/dashboard/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // <-- usePathname Eklendi
import { useAuthStore } from '../../lib/store';
import { logoutUser } from '../../lib/auth';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); // <-- Bulunduğumuz sayfanın URL'sini aldık
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  if (isLoading || !user) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Yükleniyor...</div>;
  }

  // Dinamik Link Tasarımı İçin Yardımcı Fonksiyon
  const getLinkStyle = (path: string) => {
    const isActive = pathname === path;
    return {
      color: isActive ? 'white' : '#d1d5db',
      textDecoration: 'none',
      padding: '0.75rem 1rem', // Biraz daha ferah padding
      borderRadius: '6px',
      backgroundColor: isActive ? '#374151' : 'transparent',
      fontWeight: isActive ? 'bold' : 'normal' as 'bold' | 'normal',
      display: 'block'
    };
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      
      {/* SOL MENÜ (Sidebar) */}
      <aside style={{ width: '250px', backgroundColor: '#1f2937', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>
          OtoServis SaaS
        </div>
        
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/dashboard" style={getLinkStyle('/dashboard')}>🏠 Ana Sayfa</Link>
          <Link href="/dashboard/vehicles" style={getLinkStyle('/dashboard/vehicles')}>🚘 Araç Yönetimi</Link>
          <Link href="/dashboard/services" style={getLinkStyle('/dashboard/services')}>🔧 İş Emirleri</Link>
          <Link href="/dashboard/customers" style={getLinkStyle('/dashboard/customers')}>👥 Müşteriler</Link>
          <Link href="/dashboard/reports" style={getLinkStyle('/dashboard/reports')}>📊 Raporlar</Link>
          <Link href="/dashboard/inventory" style={getLinkStyle('/dashboard/inventory')}>📦 Stok Yönetimi</Link>
          <Link href="/dashboard/appointments" style={getLinkStyle('/dashboard/appointments')}>📅 Randevular</Link>
          
          {/* SADECE SUPER ADMIN'İN GÖRECEĞİ MENÜ */}
          {user.role === 'super_admin' && (
            <Link href="/dashboard/tenants" style={{ ...getLinkStyle('/dashboard/tenants'), color: '#fbbf24', marginTop: 'auto', border: '1px solid #fbbf24' }}>
              ⚙️ Şirketleri Yönet
            </Link>
          )}
        </nav>
      </aside>

      {/* SAĞ TARAF (Header ve Ana İçerik) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* ÜST MENÜ (Header) */}
        <header style={{ backgroundColor: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
              Hoş geldin, <b style={{ color: '#111827' }}>{user.fullName}</b>
            </span>
            <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Çıkış Yap
            </button>
          </div>
        </header>

        {/* ORTA ALAN (Sayfaların Değişeceği Yer) */}
        <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          {children}
        </main>

      </div>
    </div>
  );
}