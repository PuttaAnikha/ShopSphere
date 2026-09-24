import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatPrice } from '../HomePage';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { Ticket, Plus, Trash2, Calendar, Tag } from 'lucide-react';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscount: '',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    active: true,
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCoupons();
      if (res.success) {
        setCoupons(res.data.items || res.data.coupons || []);
      }
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      };

      const res = await adminService.createCoupon(payload);
      if (res.success) {
        toast.success('Coupon created successfully!');
        setModalOpen(false);
        fetchCoupons();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      const res = await adminService.deleteCoupon(confirmDelete.id);
      if (res.success) {
        toast.success('Coupon removed');
        setConfirmDelete({ open: false, id: null });
        fetchCoupons();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold">Discount Coupons</h1>
          <p className="text-xs text-slate-500">Manage promotional discount codes for marketplace shoppers</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              code: '',
              discountType: 'PERCENTAGE',
              discountValue: 10,
              minOrderAmount: 0,
              maxDiscount: '',
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              active: true,
            });
            setModalOpen(true);
          }}
          className="btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Coupons Table */}
      <div className="card shadow-sm overflow-hidden">
        {loading ? (
          <SectionLoader height="min-h-[40vh]" />
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No coupons created yet. Click "Create Coupon" to launch your first promotional discount!
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Max Cap</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100">
                        {c.code}
                      </span>
                    </td>
                    <td className="text-xs font-semibold text-slate-800">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `${formatPrice(c.discountValue)} FLAT`}
                    </td>
                    <td className="text-xs text-slate-600">
                      {c.minOrderAmount > 0 ? formatPrice(c.minOrderAmount) : 'None'}
                    </td>
                    <td className="text-xs text-slate-600">
                      {c.maxDiscount ? formatPrice(c.maxDiscount) : 'No limit'}
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(c.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${c.active ? 'badge-success' : 'badge-neutral'}`}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setConfirmDelete({ open: true, id: c._id })}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Create New Promo Coupon"
        >
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div className="form-group">
              <label className="label">Promo Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. SUMMER20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="input uppercase font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Discount Type *</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="input"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">
                  Discount Value ({formData.discountType === 'PERCENTAGE' ? '%' : '₹'}) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Min Order Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label">Max Discount Cap (₹)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Optional limit"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="input"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary btn-sm"
              >
                {saving ? 'Creating...' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.open}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? Active shoppers will no longer be able to apply it."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </div>
  );
};

export default AdminCoupons;
