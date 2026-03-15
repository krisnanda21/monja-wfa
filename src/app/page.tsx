"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('currentUserId', user.id);
        setCurrentUser(user);
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: 'var(--font-geist-sans), sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <h1 style={{fontSize: '2rem', fontWeight: 800, color: '#111', margin: 0}}>Monitoring WFA Penkom P3K</h1>
        </div>

        {error && (
          <div style={{background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div>
            <label style={{display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333'}}>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd',
                fontSize: '1rem', boxSizing: 'border-box', color: '#000'
              }}
              placeholder="Enter username..."
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333'}}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd',
                fontSize: '1rem', boxSizing: 'border-box', color: '#000'
              }}
              placeholder="Enter password..."
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #0070f3, #0052cc)',
              color: 'white', border: 'none', padding: '14px', borderRadius: '8px',
              fontSize: '1.05rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0,112,243,0.3)'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
