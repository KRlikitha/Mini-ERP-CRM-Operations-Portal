import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Eye,
  MessageSquare,
  X,
  Building,
  Phone,
  Mail,
  Calendar,
  FileText,
} from 'lucide-react';

export const CustomerView: React.FC = () => {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailCustomer, setDetailCustomer] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'WHOLESALE',
    address: '',
    status: 'LEAD',
    followUpDate: '',
    notes: '',
  });

  const [followUpNote, setFollowUpNote] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: { search, status: statusFilter, customerType: typeFilter },
      });
      setCustomers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, typeFilter]);

  const openAddModal = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      address: '',
      status: 'LEAD',
      followUpDate: '',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setSelectedCustomer(c);
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      businessName: c.businessName,
      gstNumber: c.gstNumber || '',
      customerType: c.customerType,
      address: c.address,
      status: c.status,
      followUpDate: c.followUpDate || '',
      notes: c.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = async (id: string) => {
    try {
      const res = await api.get(`/customers/${id}`);
      setDetailCustomer(res.data.customer);
    } catch (err) {
      console.error('Failed to load customer detail', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      setIsAddModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create customer');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/customers/${selectedCustomer.id}`, formData);
      setIsEditModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update customer');
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpNote.trim() || !detailCustomer) return;
    try {
      await api.post(`/customers/${detailCustomer.id}/follow-ups`, { note: followUpNote });
      setFollowUpNote('');
      openDetailModal(detailCustomer.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add follow-up note');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      
      {/* Action & Filter Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Search customer, business, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select className="form-select" style={{ width: '160px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Type Filter */}
          <select className="form-select" style={{ width: '160px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="RETAIL">Retail</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>

        {/* Add Customer Button (Admin/Sales only) */}
        {hasRole(['ADMIN', 'SALES']) && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add New Customer
          </button>
        )}
      </div>

      {/* Customer Data Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Customer / Business</th>
              <th>Type</th>
              <th>Contact Info</th>
              <th>GSTIN</th>
              <th>Status</th>
              <th>Next Follow-up</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Loading customer database...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No customers found matching filters.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#f8fafc' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.businessName}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', background: '#1e293b', borderRadius: '4px', border: '1px solid var(--border-color)', color: '#60a5fa' }}>
                      {c.customerType}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    <div><Phone size={12} color="#94a3b8" style={{ display: 'inline', verticalAlign: 'middle' }} /> {c.mobile}</div>
                    <div style={{ color: '#94a3b8' }}><Mail size={12} color="#94a3b8" style={{ display: 'inline', verticalAlign: 'middle' }} /> {c.email}</div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                    {c.gstNumber || 'N/A'}
                  </td>
                  <td>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                    {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : 'None'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openDetailModal(c.id)} title="View Detail & Follow-ups">
                        <Eye size={14} /> Detail
                      </button>
                      {hasRole(['ADMIN', 'SALES']) && (
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(c)} title="Edit Customer">
                          <Edit2 size={14} /> Edit
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

      {/* ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc' }}>Add New Customer</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input type="text" className="form-input" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Rajesh Sharma" />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <input type="text" className="form-input" required value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} placeholder="e.g. Sharma Traders" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input type="text" className="form-input" required value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} placeholder="10-digit mobile" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@company.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Customer Type</label>
                  <select className="form-select" value={formData.customerType} onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="RETAIL">Retail</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN (Optional)</label>
                  <input type="text" className="form-input" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} placeholder="27AAAAA0000A1Z5" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Address *</label>
                <textarea className="form-textarea" rows={2} required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Shop / Office address..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input type="date" className="form-input" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Notes</label>
                  <input type="text" className="form-input" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Brief background notes" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc' }}>Edit Customer Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input type="text" className="form-input" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Customer Type</label>
                  <select className="form-select" value={formData.customerType} onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="RETAIL">Retail</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN</label>
                  <input type="text" className="form-input" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Address</label>
                <textarea className="form-textarea" rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER / MODAL */}
      {detailCustomer && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>{detailCustomer.name}</h3>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{detailCustomer.businessName} | {detailCustomer.customerType}</p>
              </div>
              <button onClick={() => setDetailCustomer(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Customer Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#111827', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
              <div><Phone size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong>Mobile:</strong> {detailCustomer.mobile}</div>
              <div><Mail size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong>Email:</strong> {detailCustomer.email}</div>
              <div><Building size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong>GSTIN:</strong> {detailCustomer.gstNumber || 'N/A'}</div>
              <div><Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong>Follow-up:</strong> {detailCustomer.followUpDate || 'None'}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong> {detailCustomer.address}</div>
            </div>

            {/* Follow-up Notes Timeline */}
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="#3b82f6" /> CRM Follow-up History ({detailCustomer.followUps?.length || 0})
            </h4>

            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {detailCustomer.followUps?.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>No follow-up notes recorded yet.</p>
              ) : (
                detailCustomer.followUps?.map((f: any) => (
                  <div key={f.id} style={{ background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                    <p style={{ fontSize: '0.875rem', color: '#f1f5f9' }}>{f.note}</p>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                      By {f.createdBy?.name} ({f.createdBy?.role}) on {new Date(f.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Add Follow-up Form */}
            {hasRole(['ADMIN', 'SALES']) && (
              <form onSubmit={handleAddFollowUp} style={{ background: '#111827', padding: '1rem', borderRadius: '10px' }}>
                <label className="form-label">Add New CRM Note</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type follow-up conversation notes..."
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary">Add Note</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
