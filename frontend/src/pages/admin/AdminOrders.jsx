import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import orderService from '../../services/orderService';
import { formatPrice } from '../HomePage';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { ShoppingBag, Search, Eye, Calendar, User, Package } from 'lucide-react';

const STATUS_OPTIONS = [
  'PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'
];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const { toast } = useToast();

  const debouncedSearch = useDebounce(search, 400);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (status) params.status = status;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await adminService.getOrders(params);
      if (res.success) {
        setOrders(res.data.orders || res.data.items || res.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status, debouncedSearch]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await orderService.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrders(orders.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o)));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const openDetails = (order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title text-2xl font-bold">Platform Orders</h1>
        <p className="text-xs text-slate-500">Monitor all customer transactions and update delivery progress</p>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-9 text-xs"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="input sm:w-44 text-xs"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="card shadow-sm overflow-hidden">
        {loading ? (
          <SectionLoader height="min-h-[40vh]" />
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No orders found matching criteria.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
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
                    <td className="text-xs text-slate-600">{o.items?.length || 0} items</td>
                    <td className="font-bold text-xs text-slate-900">{formatPrice(o.totalAmount)}</td>
                    <td><StatusBadge status={o.paymentStatus} /></td>
                    <td>
                      <select
                        disabled={updatingId === o._id}
                        value={o.orderStatus}
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 bg-white"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString()}
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

      {/* Order Details Modal */}
      {detailsModalOpen && selectedOrder && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={`Order #${selectedOrder.orderNumber || selectedOrder._id.slice(-6).toUpperCase()}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-slate-500">Customer</p>
                <p className="font-semibold text-slate-900">{selectedOrder.customerId?.name || 'N/A'}</p>
                <p className="text-slate-400">{selectedOrder.customerId?.email}</p>
              </div>
              <div>
                <p className="text-slate-500">Order Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedOrder.orderStatus} />
                </div>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-800 mb-2">Shipping Address</p>
              <div className="p-3 border border-slate-100 rounded-lg text-slate-600 space-y-0.5">
                <p className="font-medium text-slate-900">{selectedOrder.shippingAddress?.street}</p>
                <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.postalCode}</p>
                <p>Phone: {selectedOrder.shippingAddress?.phone}</p>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-800 mb-2">Ordered Items ({selectedOrder.items?.length || 0})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedOrder.items?.map((it) => (
                  <div key={it._id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">{it.productName || 'Product'}</p>
                      <p className="text-slate-400">Qty: {it.quantity} × {formatPrice(it.priceAtPurchase || it.price)}</p>
                    </div>
                    <span className="font-bold text-slate-900">{formatPrice(it.subtotal || it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border border-slate-100 rounded-lg space-y-2">
              <p className="font-semibold text-slate-800">Payment Information</p>
              <div className="flex justify-between"><span className="text-slate-500">Method</span><span>{selectedOrder.paymentMethod === 'ONLINE_DEMO' || selectedOrder.paymentMethod === 'MOCK_GATEWAY' ? 'Online Payment (Demo)' : 'Cash on Delivery'}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500">Status</span><StatusBadge status={selectedOrder.paymentStatus} /></div>
              {selectedOrder.paymentDetails?.transactionId && <div className="flex justify-between"><span className="text-slate-500">Transaction ID</span><span className="font-mono">{selectedOrder.paymentDetails.transactionId}</span></div>}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
              <span>Total Amount</span>
              <span className="text-indigo-600">{formatPrice(selectedOrder.totalAmount)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminOrders;
