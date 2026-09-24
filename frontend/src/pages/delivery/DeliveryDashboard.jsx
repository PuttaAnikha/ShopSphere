import { useEffect, useState } from 'react';
import deliveryService from '../../services/deliveryService';
import StatusBadge from '../../components/common/StatusBadge';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { Truck, PackageCheck } from 'lucide-react';

const DeliveryDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const { toast } = useToast();

  const fetchDeliveries = async () => {
    try {
      const res = await deliveryService.getAssignedDeliveries({ limit: 50 });
      if (res.success) setDeliveries(res.data.items || res.data.deliveries || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeliveries(); }, []);

  const updateStatus = async (delivery) => {
    const next = { ASSIGNED: 'PICKED_UP', PICKED_UP: 'OUT_FOR_DELIVERY', OUT_FOR_DELIVERY: 'DELIVERED' }[delivery.status];
    if (!next) return;
    try {
      setUpdatingId(delivery._id);
      await deliveryService.updateDeliveryStatus(delivery._id, next);
      toast.success(`Delivery marked ${next.toLowerCase().replaceAll('_', ' ')}`);
      fetchDeliveries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update delivery');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <SectionLoader height="min-h-[50vh]" />;

  const counts = ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((status) => [status, deliveries.filter((delivery) => delivery.status === status).length]);
  return (
    <div className="space-y-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Delivery workspace</p><h1 className="page-title mt-1">Assigned deliveries</h1><p className="text-sm text-slate-500 mt-1">Keep every handoff visible from pickup to doorstep.</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{counts.map(([status, count]) => <div key={status} className="card p-4"><div className="flex items-center justify-between"><PackageCheck size={18} className="text-green-700" /><span className="text-2xl font-bold text-slate-900">{count}</span></div><p className="text-xs text-slate-500 mt-3">{status.replaceAll('_', ' ')}</p></div>)}</div>
      <div className="card overflow-hidden"><div className="p-5 border-b border-slate-100 flex items-center gap-2"><Truck size={18} className="text-green-700" /><h2 className="section-title">Your route</h2></div>{deliveries.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No deliveries assigned yet.</p> : <div className="table-container border-0 rounded-none"><table className="table"><thead><tr><th>Order</th><th>Address</th><th>Status</th><th className="text-right">Next step</th></tr></thead><tbody>{deliveries.map((delivery) => <tr key={delivery._id}><td className="text-xs font-semibold">#{delivery.orderId?.orderNumber || delivery.orderId?._id?.slice(-6) || 'Order'}</td><td className="text-xs">{delivery.orderId?.shippingAddress?.city || 'Address unavailable'}</td><td><StatusBadge status={delivery.status} /></td><td className="text-right">{delivery.status !== 'DELIVERED' && <button disabled={updatingId === delivery._id} onClick={() => updateStatus(delivery)} className="btn-primary btn-sm">{updatingId === delivery._id ? 'Updating...' : 'Advance status'}</button>}</td></tr>)}</tbody></table></div>}</div>
    </div>
  );
};

export default DeliveryDashboard;
