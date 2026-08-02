import React, { useState } from 'react';
import { api } from '../services/api';
import { LogIn, Shield, Users, User, Info } from 'lucide-react';

export default function Login({ onLoginSuccess, navigateToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.login(email, password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const autofill = (role) => {
    if (role === 'admin') {
      setEmail('admin@company.com');
      setPassword('password123');
    } else if (role === 'hr') {
      setEmail('hr@company.com');
      setPassword('password123');
    } else if (role === 'employee') {
      setEmail('employee@company.com');
      setPassword('password123');
    }
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.12) 0%, transparent 45%), var(--bg-primary)',
      padding: '20px'
    }}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            Enterprise EMS
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Sign in to access your dashboard
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Email Address</label>
            <input
              type="email"
              placeholder="e.g. employee@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <LogIn size={18} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.88rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
          <button 
            onClick={navigateToRegister} 
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
          >
            Register Profile
          </button>
        </div>

        {/* Quick Demo Autofill section */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Info size={14} />
            <span>Click to autofill mock evaluation logins:</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button 
              onClick={() => autofill('admin')} 
              className="btn btn-secondary" 
              style={{ padding: '6px 4px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <Shield size={16} style={{ color: '#ec4899' }} />
              Admin
            </button>
            <button 
              onClick={() => autofill('hr')} 
              className="btn btn-secondary" 
              style={{ padding: '6px 4px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <Users size={16} style={{ color: '#0ea5e9' }} />
              HR Manager
            </button>
            <button 
              onClick={() => autofill('employee')} 
              className="btn btn-secondary" 
              style={{ padding: '6px 4px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <User size={16} style={{ color: '#6366f1' }} />
              Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
