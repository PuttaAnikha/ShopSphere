import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/common/StatusBadge';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { Shield } from 'lucide-react';

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const { toast } = useToast();

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDisputes(status ? { status } : {});
      if (res.success) setDisputes(res.data.items || res.data.disputes || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [status]);

  const resolve = async (id, nextStatus) => {
    try {
      setUpdatingId(id);
      const res = await adminService.resolveDispute(id, { status: nextStatus, resolution: `Marked ${nextStatus.toLowerCase()} by admin.` });
      if (res.success) {
        toast.success(`Dispute marked ${nextStatus.toLowerCase()}`);
        fetchDisputes();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update dispute');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold">Disputes</h1>
          <p className="text-xs text-slate-500">Review and resolve customer and seller disputes</p>
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="input sm:w-48 text-xs">
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="card shadow-sm overflow-hidden">
        {loading ? <SectionLoader height="min-h-[40vh]" /> : disputes.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No disputes found.</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Seller</th><th>Reason</th><th>Status</th><th className="text-right">Action</th></tr>
              </thead>
              <tbody>
                {disputes.map((dispute) => (
                  <tr key={dispute._id}>
                    <td className="text-xs font-semibold">#{dispute.orderId?.orderNumber || 'Unknown'}</td>
                    <td className="text-xs">{dispute.customerId?.name || 'Unknown'}</td>
                    <td className="text-xs">{dispute.sellerId?.storeName || 'Unknown'}</td>
                    <td className="text-xs text-slate-600 max-w-xs">{dispute.reason}</td>
                    <td><StatusBadge status={dispute.status} /></td>
                    <td className="text-right">
                      {['OPEN', 'UNDER_REVIEW'].includes(dispute.status) && (
                        <div className="flex justify-end gap-2">
                          <button disabled={updatingId === dispute._id} onClick={() => resolve(dispute._id, 'UNDER_REVIEW')} className="btn-sm text-xs text-amber-700 hover:bg-amber-50">Review</button>
                          <button disabled={updatingId === dispute._id} onClick={() => resolve(dispute._id, 'RESOLVED')} className="btn-sm text-xs text-emerald-700 hover:bg-emerald-50">Resolve</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500"><Shield size={15} /> Admin decisions notify the affected customer.</div>
    </div>
  );
};

export default AdminDisputes;
