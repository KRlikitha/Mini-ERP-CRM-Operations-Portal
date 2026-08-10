import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { ShieldCheck, UserCheck, Warehouse, CreditCard, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@erp.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign in. Check your credentials.');
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 50%, #0b0f19 100%)',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }} className="animate-fade-in">
        
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
            marginBottom: '1rem',
          }}>
            <ShieldCheck size={36} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            APEX ERP + CRM
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Wholesale & Distribution Operations Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="card-glass" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', color: '#f1f5f9' }}>
            Sign In to Portal
          </h2>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', height: '44px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : (
                <>
                  Enter Operations Portal <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Role Tester Switcher */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              ⚡ Quick Test Accounts (1-Click Fill)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@erp.com')}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                <ShieldCheck size={14} color="#a78bfa" /> Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sales@erp.com')}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                <UserCheck size={14} color="#60a5fa" /> Sales
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('warehouse@erp.com')}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                <Warehouse size={14} color="#fbbf24" /> Warehouse
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('accounts@erp.com')}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
              >
                <CreditCard size={14} color="#34d399" /> Accounts
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
