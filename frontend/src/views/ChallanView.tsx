import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  X,
  AlertTriangle,
  ShoppingCart,
  Eye,
} from 'lucide-react';

export const ChallanView: React.FC = () => {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Auxiliary data for dropdowns
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Modal & Detail state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<any>(null);

  // New Challan Form State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [challanStatus, setChallanStatus] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');
  const [cartItems, setCartItems] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: '', quantity: 1 },
  ]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/challans', {
        params: { search, status: statusFilter },
      });
      setChallans(res.data.data);
    } catch (err) {
      console.error('Failed to fetch challans', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/products?limit=100'),
      ]);
      setCustomers(custRes.data.data);
      setProducts(prodRes.data.data);
    } catch (err) {
      console.error('Failed to load dropdown options', err);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [search, statusFilter]);

  const openCreateModal = () => {
    setErrorMessage(null);
    setSelectedCustomer('');
    setChallanStatus('DRAFT');
    setCartItems([{ productId: '', quantity: 1 }]);
    fetchDropdownData();
    setIsCreateModalOpen(true);
  };

  const addCartRow = () => {
    setCartItems([...cartItems, { productId: '', quantity: 1 }]);
  };

  const removeCartRow = (index: number) => {
    if (cartItems.length === 1) return;
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const updateCartRow = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...cartItems];
    updated[index] = { ...updated[index], [field]: value };
    setCartItems(updated);
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate
    if (!selectedCustomer) {
      setErrorMessage('Please select a customer.');
      return;
    }
    const validItems = cartItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setErrorMessage('Please add at least one valid product.');
      return;
    }

    try {
      await api.post('/challans', {
        customerId: selectedCustomer,
        status: challanStatus,
        items: validItems,
      });
      setIsCreateModalOpen(false);
      fetchChallans();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to create sales challan.');
    }
  };

  const handleConfirmChallan = async (id: string) => {
    if (!window.confirm('Confirm this Sales Challan? Stock will be atomically deducted from inventory.')) return;
    try {
      await api.patch(`/challans/${id}/confirm`);
      fetchChallans();
      if (selectedChallan) {
        const updated = await api.get(`/challans/${id}`);
        setSelectedChallan(updated.data.challan);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to confirm challan');
    }
  };

  const handleCancelChallan = async (id: string) => {
    if (!window.confirm('Cancel this Sales Challan? If confirmed, items will be returned to stock.')) return;
    try {
      await api.patch(`/challans/${id}/cancel`);
      fetchChallans();
      if (selectedChallan) {
        const updated = await api.get(`/challans/${id}`);
        setSelectedChallan(updated.data.challan);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel challan');
    }
  };

  const handleDownloadPDF = async (id: string, challanNum: string) => {
    try {
      const response = await api.get(`/challans/${id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      alert('Failed to generate PDF document');
    }
  };

  // Helper product details mapping for dynamic calculation
  const getProductDetails = (id: string) => products.find((p) => p.id === id);

  const totalCartAmount = cartItems.reduce((sum, item) => {
    const prod = getProductDetails(item.productId);
    return sum + (prod ? prod.unitPrice * item.quantity : 0);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Controls & Filter bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Search by Challan # or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="form-select" style={{ width: '160px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {hasRole(['ADMIN', 'SALES']) && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Generate Sales Challan
          </button>
        )}
      </div>

      {/* Challans Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Challan #</th>
              <th>Customer / Business</th>
              <th>Created Date</th>
              <th>Total Qty</th>
              <th>Grand Total (₹)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Loading sales challans...
                </td>
              </tr>
            ) : challans.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No sales challans recorded.
                </td>
              </tr>
            ) : (
              challans.map((ch) => (
                <tr key={ch.id}>
                  <td>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#60a5fa' }}>
                      #{ch.challanNumber}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>By {ch.createdBy?.name}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{ch.customer?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ch.customer?.businessName}</div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                    {new Date(ch.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ fontWeight: 700 }}>{ch.totalQuantity} Units</td>
                  <td style={{ fontWeight: 800, color: '#34d399' }}>
                    ₹{ch.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={`badge badge-${ch.status.toLowerCase()}`}>
                      {ch.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedChallan(ch)} title="View Challan Details">
                        <Eye size={14} /> View
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadPDF(ch.id, ch.challanNumber)} title="Download PDF Invoice">
                        <Download size={14} /> PDF
                      </button>
                      {ch.status === 'DRAFT' && hasRole(['ADMIN', 'SALES', 'ACCOUNTS']) && (
                        <button className="btn btn-success btn-sm" onClick={() => handleConfirmChallan(ch.id)} title="Confirm Challan & Deduct Stock">
                          <CheckCircle size={14} /> Confirm
                        </button>
                      )}
                      {ch.status !== 'CANCELLED' && hasRole(['ADMIN', 'SALES', 'ACCOUNTS']) && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancelChallan(ch.id)} title="Cancel Challan">
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE SALES CHALLAN MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>Create New Sales Challan</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {errorMessage && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
                <AlertTriangle size={16} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} /> {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateChallan}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Select Customer *</label>
                  <select className="form-select" required value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.businessName}) - {c.customerType}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Initial Status</label>
                  <select className="form-select" value={challanStatus} onChange={(e) => setChallanStatus(e.target.value as any)}>
                    <option value="DRAFT">Draft (No stock deduct)</option>
                    <option value="CONFIRMED">Confirmed (Deduct stock)</option>
                  </select>
                </div>
              </div>

              {/* Product Line Items */}
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
                <ShoppingCart size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Line Items Selection
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {cartItems.map((item, index) => {
                  const prod = getProductDetails(item.productId);
                  const isStockInsufficient = prod ? prod.currentStock < item.quantity : false;
                  return (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center', background: '#111827', padding: '0.75rem', borderRadius: '8px', border: isStockInsufficient ? '1px solid #f43f5e' : '1px solid var(--border-color)' }}>
                      <div>
                        <select className="form-select" value={item.productId} onChange={(e) => updateCartRow(index, 'productId', e.target.value)} required>
                          <option value="">-- Select Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (SKU: {p.sku}) - ₹{p.unitPrice} [Stock: {p.currentStock}]
                            </option>
                          ))}
                        </select>
                        {prod && (
                          <div style={{ fontSize: '0.7rem', color: isStockInsufficient ? '#f43f5e' : '#94a3b8', marginTop: '0.2rem' }}>
                            Available: {prod.currentStock} units | Price: ₹{prod.unitPrice}
                            {isStockInsufficient && ' ⚠️ Stock Insufficient!'}
                          </div>
                        )}
                      </div>

                      <div>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          value={item.quantity}
                          onChange={(e) => updateCartRow(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                          required
                        />
                      </div>

                      <div style={{ textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                        ₹{prod ? (prod.unitPrice * item.quantity).toFixed(2) : '0.00'}
                      </div>

                      <button type="button" onClick={() => removeCartRow(index)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button type="button" className="btn btn-secondary btn-sm" onClick={addCartRow} style={{ marginBottom: '1.5rem' }}>
                <Plus size={14} /> Add Product Line
              </button>

              {/* Total Calculation Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111827', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Total Quantity: {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Units</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa' }}>Grand Total: ₹{totalCartAmount.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Challan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHALLAN DETAIL MODAL */}
      {selectedChallan && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                  Sales Challan #{selectedChallan.challanNumber}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                  Created on {new Date(selectedChallan.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedChallan(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Customer Details Box */}
            <div style={{ background: '#111827', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>Customer Details</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                <div>Name: <strong style={{ color: '#f8fafc' }}>{selectedChallan.customer?.name}</strong></div>
                <div>Business: <strong style={{ color: '#f8fafc' }}>{selectedChallan.customer?.businessName}</strong></div>
                <div>Mobile: {selectedChallan.customer?.mobile}</div>
                <div>Status: <span className={`badge badge-${selectedChallan.status.toLowerCase()}`}>{selectedChallan.status}</span></div>
              </div>
            </div>

            {/* Items Snapshot Table */}
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
              Product Line Items (Stored Snapshot)
            </p>
            <div className="table-container" style={{ marginBottom: '1.5rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>SKU Snapshot</th>
                    <th>Unit Price (₹)</th>
                    <th>Qty</th>
                    <th>Subtotal (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedChallan.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, color: '#f8fafc' }}>{item.productNameSnapshot}</td>
                      <td style={{ fontSize: '0.75rem', color: '#60a5fa' }}>{item.skuSnapshot}</td>
                      <td>₹{item.unitPriceSnapshot}</td>
                      <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                      <td style={{ fontWeight: 800, color: '#34d399' }}>₹{item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleDownloadPDF(selectedChallan.id, selectedChallan.challanNumber)}>
                <Download size={14} /> Download Official PDF Invoice
              </button>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#34d399' }}>
                Total: ₹{selectedChallan.totalAmount}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
