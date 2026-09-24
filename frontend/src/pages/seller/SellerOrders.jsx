import { useState, useEffect } from 'react';
import orderService from '../../services/orderService';
import { formatPrice } from '../HomePage';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { ShoppingBag, Search, Eye, MapPin, Package, CheckCircle2 } from 'lucide-react';

const SELLER_STATUSES = ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (status) params.status = status;
      const res = await orderService.getOrders(params);
      if (res.success) {
        setOrders(res.data.orders || res.data.items || res.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      toast.error('Failed to load seller orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await orderService.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        toast.success(`Fulfillment updated to ${newStatus}`);
        setOrders(orders.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const openDetails = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title text-2xl font-bold">Store Fulfillment & Orders</h1>
        <p className="text-xs text-slate-500">Track incoming customer purchases, update packaging, and initiate shipments</p>
      </div>

      {/* Filter Tabs */}
      <div className="card p-4 shadow-sm flex gap-2 overflow-x-auto">
        <button
          onClick={() => { setStatus(''); setPage(1); }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
            status === '' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Orders
        </button>
        {SELLER_STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => { setStatus(st); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              status === st ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card shadow-sm overflow-hidden">
        {loading ? (
          <SectionLoader height="min-h-[40vh]" />
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No orders found matching the filter.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Destination</th>
                  <th>Store Items</th>
                  <th>Revenue</th>
                  <th>Fulfillment Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <span className="font-semibold text-slate-900 text-xs">
                        #{o.orderNumber || o._id.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-slate-800 text-xs">{o.customerId?.name || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400">{o.customerId?.email}</p>
                    </td>
                    <td className="text-xs text-slate-600">
                      {o.shippingAddress?.city}, {o.shippingAddress?.state}
                    </td>
                    <td className="text-xs text-slate-600">
                      {o.items?.length || 0} items
                    </td>
                    <td className="font-bold text-xs text-slate-900">
                      {formatPrice(o.totalAmount)}
                    </td>
                    <td>
                      <select
                        disabled={updatingId === o._id}
                        value={o.orderStatus}
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 bg-white"
                      >
                        {['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'].map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => openDetails(o)}
                        className="btn-secondary btn-sm p-1.5 hover:text-indigo-600"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
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

      {/* Details Modal */}
      {modalOpen && selectedOrder && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Order #${selectedOrder.orderNumber || selectedOrder._id.slice(-6).toUpperCase()}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-slate-500">Shipping To:</p>
              <p className="font-semibold text-slate-900 mt-1">{selectedOrder.shippingAddress?.street}</p>
              <p className="text-slate-600">
                {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.postalCode}
              </p>
              <p className="text-slate-500 mt-1">Phone: {selectedOrder.shippingAddress?.phone}</p>
            </div>

            <div>
              <p className="font-semibold text-slate-800 mb-2">Order Items:</p>
              <div className="space-y-2">
                {selectedOrder.items?.map((it) => (
                  <div key={it._id} className="flex justify-between items-center p-2 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-medium text-slate-900">{it.productName || 'Product'}</p>
                      <p className="text-slate-400">Qty: {it.quantity} × {formatPrice(it.priceAtPurchase || it.price)}</p>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatPrice(it.subtotal || (it.priceAtPurchase || it.price) * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
              <span>Order Total</span>
              <span className="text-indigo-600">{formatPrice(selectedOrder.totalAmount)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SellerOrders;
