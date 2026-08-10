import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Users,
  Package,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';

interface DashboardData {
  stats: {
    customers: { total: number; active: number; lead: number };
    inventory: { totalProducts: number; lowStockAlertsCount: number };
    sales: { totalChallans: number; confirmedCount: number; totalRevenue: number };
  };
  lowStockAlerts: any[];
  recentChallans: any[];
  recentMovements: any[];
}

export const DashboardView: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '1rem' }} />
        <p>Loading ERP analytics & inventory status...</p>
      </div>
    );
  }

  const { stats, lowStockAlerts, recentChallans, recentMovements } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Metrics Row */}
      <div className="grid-4">
        {/* Total Revenue */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Confirmed Revenue</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>
              ₹{stats.sales.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#34d399' }}>
              {stats.sales.confirmedCount} Confirmed Orders
            </p>
          </div>
        </div>

        {/* Customer Base */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Customer CRM</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>
              {stats.customers.total} Total
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#60a5fa' }}>
              {stats.customers.active} Active | {stats.customers.lead} Leads
            </p>
          </div>
        </div>

        {/* Total Products */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
            <Package size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Total SKUs</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>
              {stats.inventory.totalProducts} Products
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>In Active Catalog</p>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="stat-card" style={{ borderColor: stats.inventory.lowStockAlertsCount > 0 ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-color)' }}>
          <div className="stat-icon" style={{ background: stats.inventory.lowStockAlertsCount > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)', color: stats.inventory.lowStockAlertsCount > 0 ? '#f43f5e' : '#9ca3af' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Low Stock Alerts</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: stats.inventory.lowStockAlertsCount > 0 ? '#f43f5e' : '#f8fafc', margin: '0.25rem 0' }}>
              {stats.inventory.lowStockAlertsCount} SKUs
            </h3>
            <p style={{ fontSize: '0.75rem', color: stats.inventory.lowStockAlertsCount > 0 ? '#f43f5e' : '#94a3b8' }}>
              {stats.inventory.lowStockAlertsCount > 0 ? 'Requires Procurement!' : 'Stock levels optimal'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Row: Low Stock Warnings + Recent Orders */}
      <div className="grid-2">
        
        {/* Low Stock Alerts Box */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle color="#f43f5e" size={20} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Low Stock Inventory Warnings</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('products')}>
              Manage Stock <ArrowUpRight size={14} />
            </button>
          </div>

          {lowStockAlerts.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', padding: '1.5rem 0', textAlign: 'center' }}>
              🎉 All products are above minimum alert thresholds.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lowStockAlerts.map((prod) => (
                <div key={prod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#111827', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>{prod.name}</p>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SKU: {prod.sku} | Location: {prod.location}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#f43f5e' }}>{prod.currentStock} left</span>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Min Alert: {prod.minStockAlert}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales Challans */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText color="#3b82f6" size={20} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Recent Sales Challans</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('challans')}>
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentChallans.map((ch) => (
              <div key={ch.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#111827', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#60a5fa' }}>#{ch.challanNumber}</span>
                    <span className={`badge badge-${ch.status.toLowerCase()}`}>{ch.status}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    {ch.customer?.name} ({ch.customer?.businessName})
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#f8fafc' }}>₹{ch.totalAmount.toLocaleString('en-IN')}</span>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{ch.totalQuantity} items</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Stock Movement Activity Stream */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Recent Stock Movement Logs</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('products')}>
            Inventory Log <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Movement</th>
                <th>Product / SKU</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {recentMovements.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge badge-${m.movementType.toLowerCase()}`}>
                      {m.movementType === 'IN' ? <TrendingUp size={12} /> : <ArrowDownRight size={12} />}
                      {m.movementType}
                    </span>
                  </td>
                  <td>
                    <strong>{m.product?.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SKU: {m.product?.sku}</div>
                  </td>
                  <td style={{ fontWeight: 800, color: m.movementType === 'IN' ? '#34d399' : '#f43f5e' }}>
                    {m.movementType === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                  </td>
                  <td style={{ color: '#94a3b8' }}>{m.reason}</td>
                  <td style={{ color: '#f1f5f9' }}>{m.createdBy?.name} ({m.createdBy?.role})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
