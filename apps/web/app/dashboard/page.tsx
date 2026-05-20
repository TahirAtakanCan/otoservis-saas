// apps/web/app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#111827' }}>Genel Bakış</h1>
      <p style={{ color: '#6b7280' }}>Sistemdeki genel özet verileriniz aşağıdadır.</p>
      
      {/* İstatistik Kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase' }}>Aktif Şirket (Otoservis) Sayısı</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#111827' }}>1</p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase' }}>Sistemdeki Toplam Araç</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#111827' }}>0</p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase' }}>Açık İş Emirleri</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#111827' }}>0</p>
        </div>

      </div>
    </div>
  );
}