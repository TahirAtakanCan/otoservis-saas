// apps/web/app/login/page.tsx
'use client';

import { useState } from 'react';
import { login } from '../../lib/auth';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const router = useRouter();
  // Zustand'dan yüklenme durumunu çekiyoruz
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const user = await login(email, password);
      // Başarılı girişte role göre yönlendirme
      if (user.role === 'super_admin') {
        router.push('/dashboard'); 
      } else {
        router.push('/'); 
      }
    } catch (err: any) {
      setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
      <form onSubmit={handleLogin} style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
        <h2 style={{ textAlign: 'center', margin: 0 }}>OtoServis SaaS</h2>
        <p style={{ textAlign: 'center', margin: 0, color: 'gray' }}>Yönetici Girişi</p>
        
        {error && <p style={{ color: 'red', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}
        
        <input 
          type="email" 
          placeholder="E-posta adresi" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          type="password" 
          placeholder="Şifre" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ padding: '0.5rem', backgroundColor: '#000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isLoading ? 'Giriş Yapılıyor...' : 'Sisteme Gir'}
        </button>
      </form>
    </div>
  );
}