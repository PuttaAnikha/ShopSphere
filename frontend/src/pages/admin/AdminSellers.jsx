import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { SectionLoader } from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { Store, Search, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';

const STATUS_TABS = [
  { key: '', label: 'All Sellers' },
  { key: 'PENDING', label: 'Pending Review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'REJECTED', label: 'Rejected' },
];

const AdminSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionModal, setActionModal] = useState({ open: false, seller: null, action: '' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const debouncedSearch = useDebounce(search, 400);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (status) params.status = status;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await adminService.getSellers(params);
      if (res.success) {
        setSellers(res.data.items || res.data.sellers || res.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [page, status, debouncedSearch]);

  const handleUpdateStatus = async (sellerId, newStatus, reason = '') => {
    try {
      setSubmitting(true);
      const res = await adminService.updateSellerStatus(sellerId, {
        approvalStatus: newStatus,
        rejectionReason: reason
      });
      if (res.success) {
        toast.success(`Seller status updated to ${newStatus}`);
        setActionModal({ open: false, seller: null, action: '' });
        setRejectionReason('');
        fetchSellers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update seller status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="page-title text-2xl font-bold">Manage Marketplace Sellers</h1>
        <p className="text-xs text-slate-500">Review vendor applications, manage commissions, and control merchant access</p>
      </div>

      {/* Tabs & Search */}
      <div className="card p-4 space-y-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                status === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by store name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-9 text-xs"
          />
        </div>
      </div>

      {/* Sellers Table */}
      <div className="card shadow-sm overflow-hidden">
        {loading ? (
          <SectionLoader height="min-h-[40vh]" />
        ) : sellers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No sellers found matching criteria.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Store / Vendor</th>
                  <th>Owner</th>
                  <th>Commission</th>
                  <th>Rating</th>
                  <th>Approval Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <Store size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{s.storeName}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{s.description || 'Verified merchant'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-xs font-medium text-slate-800">{s.userId?.name || 'Seller'}</p>
                      <p className="text-[11px] text-slate-400">{s.userId?.email}</p>
                    </td>
                    <td className="text-xs font-semibold text-slate-700">
                      {s.commissionRate != null ? `${s.commissionRate}%` : '10%'}
                    </td>
                    <td className="text-xs text-amber-500 font-semibold">
                      ★ {s.rating ? s.rating.toFixed(1) : '5.0'}
                    </td>
                    <td>
                      <StatusBadge status={s.approvalStatus} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.approvalStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(s._id, 'APPROVED')}
                              className="btn-sm text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg px-2 py-1"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setActionModal({ open: true, seller: s, action: 'REJECT' })}
                              className="btn-sm text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg px-2 py-1"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {s.approvalStatus === 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(s._id, 'SUSPENDED')}
                            className="btn-sm text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded-lg px-2 py-1"
                          >
                            Suspend
                          </button>
                        )}
                        {s.approvalStatus === 'SUSPENDED' && (
                          <button
                            onClick={() => handleUpdateStatus(s._id, 'APPROVED')}
                            className="btn-sm text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg px-2 py-1"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      {/* Reject Modal */}
      {actionModal.open && (
        <Modal
          isOpen={actionModal.open}
          onClose={() => setActionModal({ open: false, seller: null, action: '' })}
          title="Reject Seller Application"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Rejecting <strong>{actionModal.seller?.storeName}</strong>. Please provide a reason to notify the merchant.
            </p>
            <div className="form-group">
              <label className="label">Rejection Reason</label>
              <textarea
                rows={3}
                placeholder="e.g. Incomplete business verification documents..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="input text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal({ open: false, seller: null, action: '' })}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleUpdateStatus(actionModal.seller._id, 'REJECTED', rejectionReason)}
                className="btn-danger btn-sm"
              >
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminSellers;
