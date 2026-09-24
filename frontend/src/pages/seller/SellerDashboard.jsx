import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import sellerService from '../../services/sellerService';
import orderService from '../../services/orderService';
import { formatPrice } from '../HomePage';
import StatusBadge from '../../components/common/StatusBadge';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import {
  DollarSign, ShoppingBag, Package, AlertTriangle,
  PlusSquare, ArrowUpRight, TrendingUp, Store, Clock
} from 'lucide-react';

const SellerDashboard = () => {
  const [data, setData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, ordersRes] = await Promise.all([
        sellerService.getDashboard(),
        orderService.getOrders({ limit: 5 })
      ]);

      if (dashRes.success) {
        setData(dashRes.data);
      }
      if (ordersRes.success) {
        setRecentOrders(ordersRes.data.orders || []);
      }
    } catch {
      toast.error('Failed to load seller dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <SectionLoader height="min-h-[50vh]" />;

  const metrics = data?.metrics || {};
  const isPending = data?.approvalStatus === 'PENDING';

  return (
    <div className="space-y-6">
      {/* Top Banner if Pending Approval */}
      {isPending && (
        <div className="card p-4 bg-amber-50 border-amber-200 flex items-start gap-3">
          <Clock className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <h3 className="text-sm font-bold text-amber-900">Application Under Review</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Your vendor account is pending admin approval. You can draft products and setup your storefront; listings will go live once verified.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title text-2xl font-bold">{data?.storeName || 'Vendor Dashboard'}</h1>
            <StatusBadge status={data?.approvalStatus || 'APPROVED'} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Overview of store sales, active inventory, and pending fulfillments</p>
        </div>

        <Link to="/seller/products/create" className="btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto">
          <PlusSquare size={16} /> Add Product
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Store Revenue</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(metrics.totalRevenue || 0)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-50">
            {metrics.totalItemsSold || 0} total units sold
          </p>
        </div>

        <div className="card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalOrders || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-50">
            {metrics.pendingOrders || 0} awaiting delivery
          </p>
        </div>

        <div className="card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Catalog Products</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalProducts || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-50">
            Listed on marketplace
          </p>
        </div>

        <div className="card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.lowStockProducts || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-50">
            {metrics.outOfStockProducts || 0} out of stock
          </p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title text-base font-semibold">Recent Store Orders</h2>
          <Link to="/seller/orders" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            All Orders <ArrowUpRight size={13} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No orders received yet.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td className="font-semibold text-slate-900 text-xs">
                      #{o.orderNumber || o._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="text-xs">{o.customerId?.name || 'Customer'}</td>
                    <td className="font-semibold text-xs text-slate-900">{formatPrice(o.totalAmount)}</td>
                    <td>
                      <StatusBadge status={o.orderStatus} />
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
