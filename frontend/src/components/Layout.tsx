import React from 'react';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  LogOut,
  ShieldCheck,
  UserCheck,
  Warehouse,
  CreditCard,
  Building2,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge badge-admin"><ShieldCheck size={12} /> Admin</span>;
      case 'SALES':
        return <span className="badge badge-sales"><UserCheck size={12} /> Sales</span>;
      case 'WAREHOUSE':
        return <span className="badge badge-warehouse"><Warehouse size={12} /> Warehouse</span>;
      case 'ACCOUNTS':
        return <span className="badge badge-accounts"><CreditCard size={12} /> Accounts</span>;
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { id: 'customers', label: 'Customer CRM', icon: Users, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { id: 'products', label: 'Product Inventory', icon: Package, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { id: 'challans', label: 'Sales Challans', icon: FileText, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>
              APEX ERP
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
              Wholesale Portal
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '0 0.5rem 0.5rem 0.5rem', letterSpacing: '0.05em' }}>
            Modules
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? '#60a5fa' : '#9ca3af',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  textAlign: 'left',
                }}
              >
                <Icon size={18} color={isActive ? '#60a5fa' : '#9ca3af'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            {user && getRoleBadge(user.role)}
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
              style={{ padding: '0.3rem 0.6rem' }}
            >
              <LogOut size={14} /> Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="header">
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', textTransform: 'capitalize' }}>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'customers' && 'Customer CRM Module'}
              {activeTab === 'products' && 'Product & Stock Inventory'}
              {activeTab === 'challans' && 'Sales Challan Module'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#94a3b8' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Connected to API
            </div>
          </div>
        </header>

        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
};
