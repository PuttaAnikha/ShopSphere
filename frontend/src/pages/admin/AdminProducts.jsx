import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatPrice } from '../HomePage';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { Package, Search, ExternalLink, ShieldCheck, ShieldAlert, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const { toast } = useToast();

  const debouncedSearch = useDebounce(search, 400);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;

      const res = await adminService.getProducts(params);
      if (res.success) {
        setProducts(res.data.products || res.data.items || res.data || []);
        setTotalPages(res.data.pagination?.totalPages || res.data.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch, status]);

  const handleStatusChange = async (productId, newStatus) => {
    try {
      setUpdatingId(productId);
      const res = await adminService.updateProductStatus(productId, newStatus);
      if (res.success) {
        toast.success(`Product status updated to ${newStatus}`);
        setProducts(products.map((p) => (p._id === productId ? { ...p, status: newStatus } : p)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="page-title text-2xl font-bold">Manage Products</h1>
        <p className="text-xs text-slate-500">Supervise multi-vendor catalogue items, pricing, inventory, and listings</p>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by title or brand..."
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
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="card shadow-sm overflow-hidden">
        {loading ? (
          <SectionLoader height="min-h-[40vh]" />
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No products found matching criteria.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/products/${p._id}`}
                            className="font-semibold text-slate-900 text-xs hover:text-indigo-600 line-clamp-1 flex items-center gap-1"
                          >
                            {p.name}
                            <ExternalLink size={10} className="text-slate-400" />
                          </Link>
                          <p className="text-[11px] text-slate-400">{p.brand || 'No brand'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-slate-700 flex items-center gap-1">
                        <Store size={12} className="text-slate-400" />
                        {p.sellerId?.storeName || 'Marketplace Seller'}
                      </span>
                    </td>
                    <td className="font-semibold text-xs text-slate-900">
                      {formatPrice(p.price)}
                      {p.discount > 0 && (
                        <span className="ml-1 text-[10px] text-rose-500 font-bold">
                          (-{p.discount}%)
                        </span>
                      )}
                    </td>
                    <td className="text-xs">
                      <span className={p.stock < 5 ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                        {p.stock} units
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="text-right">
                      <button
                        disabled={updatingId === p._id}
                        onClick={() =>
                          handleStatusChange(p._id, p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
                        }
                        className={`btn-sm text-xs font-semibold rounded-lg px-2 py-1 ${
                          p.status === 'ACTIVE'
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {updatingId === p._id ? 'Updating...' : p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
    </div>
  );
};

export default AdminProducts;
