import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatPrice } from '../HomePage';
import { SectionLoader } from '../../components/common/Spinner';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import {
  DollarSign, ShoppingBag, Users, Store, Package,
  AlertTriangle, ArrowUpRight, TrendingUp, CheckCircle, Shield
} from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, ordersRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getOrders({ limit: 5 })
      ]);

      if (dashRes.success) {
        setData(dashRes.data);
      }
      if (ordersRes.success) {
        setRecentOrders(ordersRes.data.orders || []);
      }
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <SectionLoader height="min-h-[50vh]" />;

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatPrice(data?.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Total Orders',
      value: data?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      title: 'Registered Users',
      value: data?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Active Products',
      value: data?.totalProducts || 0,
      icon: Package,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'Pending Sellers',
      value: data?.pendingSellers || 0,
      icon: Store,
      color: 'text-amber-600 bg-amber-50',
      action: '/admin/sellers',
      alert: (data?.pendingSellers || 0) > 0,
    },
    {
      title: 'Disputes & Tickets',
      value: data?.pendingDisputes || 0,
      icon: Shield,
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="page-title text-2xl font-bold">Marketplace Dashboard</h1>
        <p className="text-xs text-slate-500">Live operational overview of vendors, inventory, and revenue</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="card p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon size={22} />
                </div>
              </div>

              {card.action && (
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Requires review</span>
                  <Link
                    to={card.action}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    View sellers <ArrowUpRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Order Status Breakdown */}
      {data?.orderStatusStatistics && (
        <div className="card p-5 shadow-sm">
          <h2 className="section-title text-base font-semibold mb-4">Orders Pipeline</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(data.orderStatusStatistics).map(([status, count]) => (
              <div key={status} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="mb-2">
                  <StatusBadge status={status} />
                </div>
                <p className="text-xl font-bold text-slate-900">{count}</p>
                <p className="text-[11px] text-slate-500">Orders</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title text-base font-semibold">Recent Platform Orders</h2>
          <Link to="/admin/products" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            View Products <ArrowUpRight size={13} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No orders recorded yet.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="font-semibold text-slate-900 text-xs">
                      #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="text-xs">{order.customerId?.name || 'Customer'}</td>
                    <td className="font-semibold text-xs text-slate-900">{formatPrice(order.totalAmount)}</td>
                    <td>
                      <StatusBadge status={order.paymentStatus} />
                    </td>
                    <td>
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
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

export default AdminDashboard;
