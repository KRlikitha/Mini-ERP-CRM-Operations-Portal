import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  Package,
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  X,
  History,
  Boxes,
} from 'lucide-react';

export const ProductView: React.FC = () => {
  const { hasRole } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'movements'>('inventory');
  
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 5,
    location: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    quantity: 1,
    movementType: 'IN',
    reason: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: { search, category: categoryFilter, lowStock: lowStockOnly ? 'true' : undefined },
      });
      setProducts(res.data.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/stock-movements');
      setMovements(res.data.data);
    } catch (err) {
      console.error('Failed to fetch stock movements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'inventory') {
      fetchProducts();
    } else {
      fetchMovements();
    }
  }, [search, categoryFilter, lowStockOnly, activeSubTab]);

  const openAddModal = () => {
    setProductForm({
      name: '',
      sku: '',
      category: 'Electrical & Cables',
      unitPrice: 100,
      currentStock: 10,
      minStockAlert: 5,
      location: 'Warehouse A',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setSelectedProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      location: p.location,
    });
    setIsEditModalOpen(true);
  };

  const openAdjustModal = (p: any) => {
    setSelectedProduct(p);
    setAdjustForm({
      quantity: 1,
      movementType: 'IN',
      reason: 'Manual stock adjustment',
    });
    setIsAdjustModalOpen(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', productForm);
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create product');
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/products/${selectedProduct.id}`, productForm);
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update product');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/products/${selectedProduct.id}/adjust-stock`, adjustForm);
      setIsAdjustModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to adjust stock');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Sub Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeSubTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('inventory')}
        >
          <Boxes size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Product Catalog & Stock
        </button>
        <button
          className={`tab-btn ${activeSubTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('movements')}
        >
          <History size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Stock Movement Logs (IN/OUT)
        </button>
      </div>

      {activeSubTab === 'inventory' ? (
        <>
          {/* Inventory Filters & Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Search product, SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Low Stock Toggle Button */}
              <button
                className={`btn ${lowStockOnly ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setLowStockOnly(!lowStockOnly)}
              >
                <AlertTriangle size={16} /> Low Stock Alerts Only
              </button>
            </div>

            {hasRole(['ADMIN', 'WAREHOUSE']) && (
              <button className="btn btn-primary" onClick={openAddModal}>
                <Plus size={18} /> Add New Product
              </button>
            )}
          </div>

          {/* Product Data Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product / SKU</th>
                  <th>Category</th>
                  <th>Unit Price (₹)</th>
                  <th>Current Stock</th>
                  <th>Alert Min Qty</th>
                  <th>Location</th>
                  <th>Stock Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      Loading product inventory...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLowStock = p.currentStock <= p.minStockAlert;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#f8fafc' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600 }}>SKU: {p.sku}</div>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{p.category}</td>
                        <td style={{ fontWeight: 800, color: '#f8fafc' }}>
                          ₹{p.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ fontWeight: 800, fontSize: '1rem', color: isLowStock ? '#f43f5e' : '#34d399' }}>
                          {p.currentStock} Units
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{p.minStockAlert}</td>
                        <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{p.location}</td>
                        <td>
                          {p.currentStock === 0 ? (
                            <span className="badge badge-cancelled">OUT OF STOCK</span>
                          ) : isLowStock ? (
                            <span className="badge badge-draft">LOW STOCK</span>
                          ) : (
                            <span className="badge badge-active">OPTIMAL</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {hasRole(['ADMIN', 'WAREHOUSE']) && (
                              <>
                                <button className="btn btn-secondary btn-sm" onClick={() => openAdjustModal(p)} title="Stock IN/OUT Adjustment">
                                  <TrendingUp size={14} /> Stock +/-
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(p)} title="Edit Product">
                                  <Edit2 size={14} /> Edit
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Stock Movement Log Table */
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Log Timestamp</th>
                <th>Movement Type</th>
                <th>Product / SKU</th>
                <th>Quantity</th>
                <th>Reason / Reference</th>
                <th>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Loading stock movement audit logs...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No stock movements logged yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
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
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{m.product?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SKU: {m.product?.sku}</div>
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '1rem', color: m.movementType === 'IN' ? '#34d399' : '#f43f5e' }}>
                      {m.movementType === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: '#f1f5f9' }}>{m.reason}</td>
                    <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                      {m.createdBy?.name} ({m.createdBy?.role})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc' }}>Add New Product SKU</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input type="text" className="form-input" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Copper Cable 100m" />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Code *</label>
                  <input type="text" className="form-input" required value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} placeholder="e.g. CBL-COP-100M" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input type="text" className="form-input" required value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} placeholder="e.g. Cables & Fittings" />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price (₹) *</label>
                  <input type="number" step="0.01" className="form-input" required value={productForm.unitPrice} onChange={(e) => setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Initial Stock *</label>
                  <input type="number" className="form-input" required value={productForm.currentStock} onChange={(e) => setProductForm({ ...productForm, currentStock: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Alert Qty *</label>
                  <input type="number" className="form-input" required value={productForm.minStockAlert} onChange={(e) => setProductForm({ ...productForm, minStockAlert: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location *</label>
                  <input type="text" className="form-input" required value={productForm.location} onChange={(e) => setProductForm({ ...productForm, location: e.target.value })} placeholder="Shelf 12" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc' }}>Edit Product Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input type="text" className="form-input" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price (₹)</label>
                  <input type="number" step="0.01" className="form-input" value={productForm.unitPrice} onChange={(e) => setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Min Alert Quantity</label>
                  <input type="number" className="form-input" value={productForm.minStockAlert} onChange={(e) => setProductForm({ ...productForm, minStockAlert: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Warehouse Location</label>
                  <input type="text" className="form-input" value={productForm.location} onChange={(e) => setProductForm({ ...productForm, location: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL STOCK ADJUSTMENT MODAL */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc' }}>Stock Adjustment</h3>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{selectedProduct.name} (Current Stock: {selectedProduct.currentStock})</p>
              </div>
              <button onClick={() => setIsAdjustModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdjustStock}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Movement Type</label>
                  <select className="form-select" value={adjustForm.movementType} onChange={(e) => setAdjustForm({ ...adjustForm, movementType: e.target.value })}>
                    <option value="IN">IN (+ Add Stock)</option>
                    <option value="OUT">OUT (- Remove Stock)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input type="number" min="1" className="form-input" required value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value, 10) || 1 })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Reference Note *</label>
                <input type="text" className="form-input" required value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="e.g. Factory shipment, Damaged stock write-off..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Record Stock Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
