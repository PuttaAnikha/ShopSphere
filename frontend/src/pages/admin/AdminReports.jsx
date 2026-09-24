import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { formatPrice } from '../HomePage';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { BarChart3, Package, Store } from 'lucide-react';

const AdminReports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await adminService.getReports();
        if (res.success) setReports(res.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load platform reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [toast]);

  if (loading) return <SectionLoader height="min-h-[50vh]" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title text-2xl font-bold">Platform Reports</h1>
        <p className="text-xs text-slate-500">Review marketplace category and seller performance</p>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-indigo-600" />
            <h2 className="section-title text-base font-semibold">Top Categories</h2>
          </div>
          {reports?.topCategories?.length ? (
            <div className="space-y-3">
              {reports.topCategories.map((category) => (
                <div key={category._id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <span className="text-sm text-slate-700">{category.name}</span>
                  <span className="text-sm font-semibold text-slate-900">{category.productCount} products</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No category data available yet.</p>
          )}
        </div>

        <div className="card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Store size={18} className="text-emerald-600" />
            <h2 className="section-title text-base font-semibold">Top Sellers</h2>
          </div>
          {reports?.topSellers?.length ? (
            <div className="space-y-3">
              {reports.topSellers.map((seller) => (
                <div key={seller._id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <span className="text-sm text-slate-700">{seller.storeName}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatPrice(seller.totalRevenue)}
                    <span className="ml-2 text-xs font-normal text-slate-500">{seller.totalItemsSold} sold</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No seller sales data available yet.</p>
          )}
        </div>
      </section>

      <div className="card p-5 shadow-sm flex items-center gap-3">
        <BarChart3 size={20} className="text-slate-500" />
        <p className="text-sm text-slate-600">Reports update from the current marketplace orders and catalogue.</p>
      </div>
    </div>
  );
};

export default AdminReports;
