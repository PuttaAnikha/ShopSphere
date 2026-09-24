import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../services/orderService';
import { formatPrice } from './HomePage';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import { SectionLoader } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { Package, ArrowRight, Eye, Calendar, Clock } from 'lucide-react';

const STATUS_TABS = [
  { key: '', label: 'All Orders' },
  { key: 'PLACED', label: 'Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const fetchOrders = async (currPage = 1, status = '') => {
    try {
      setLoading(true);
      const params = { page: currPage, limit: 8 };
      if (status) params.status = status;
      const res = await orderService.getOrders(params);
      if (res.success) {
        setOrders(res.data.items || res.data.orders || []);
        setTotalPages(res.data.pagination?.totalPages || res.data.totalPages || 1);
        setTotalCount(res.data.pagination?.total || res.data.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page, statusFilter);
  }, [page, statusFilter]);

  const handleTabChange = (key) => {
    setStatusFilter(key);
    setPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-slate-500">Track and manage your order history</p>
        </div>
        <Link to="/products" className="btn-secondary btn-sm self-start sm:self-auto">
          Continue Shopping
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-100">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              statusFilter === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SectionLoader height="min-h-[40vh]" />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="package"
          title="No orders found"
          description={
            statusFilter
              ? `You don't have any orders with status "${statusFilter}"`
              : "You haven't placed any orders yet. Discover great items in our marketplace!"
          }
          action={
            <Link to="/products" className="btn-primary">
              Browse Products
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const firstItem = order.items?.[0];
            const remainingCount = (order.items?.length || 0) - 1;

            return (
              <div key={order._id} className="card p-5 hover:border-slate-300 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-slate-900 text-sm">
                      #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar size={13} /> {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.orderStatus} />
                    <StatusBadge status={order.paymentStatus} />
                    <span className="font-bold text-slate-900 text-sm">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                      {firstItem?.productImage ? (
                        <img src={firstItem.productImage} alt="" className="w-full h-full object-cover" />
                      ) : firstItem?.productId?.images?.[0] ? (
                        <img src={firstItem.productId.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm line-clamp-1">
                        {firstItem?.productName || firstItem?.productId?.name || 'Marketplace Item'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Qty: {firstItem?.quantity} × {formatPrice(firstItem?.priceAtPurchase || firstItem?.price || 0)}
                        {remainingCount > 0 && ` + ${remainingCount} other ${remainingCount === 1 ? 'item' : 'items'}`}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/orders/${order._id}`}
                    className="btn-secondary btn-sm flex items-center gap-1.5 self-end sm:self-center"
                  >
                    <Eye size={14} /> View Details
                  </Link>
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="pt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
