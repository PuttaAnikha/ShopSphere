import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import sellerService from '../../services/sellerService';
import productService from '../../services/productService';
import { formatPrice } from '../HomePage';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { Package, PlusSquare, Search, Trash2, ExternalLink, AlertCircle } from 'lucide-react';

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const { toast } = useToast();

  const debouncedSearch = useDebounce(search, 400);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;

      const res = await sellerService.getProducts(params);
      if (res.success) {
        setProducts(res.data.items || res.data.products || res.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch, status]);

  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      const res = await productService.deleteProduct(confirmDelete.id);
      if (res.success) {
        toast.success('Product deleted successfully');
        setConfirmDelete({ open: false, id: null });
        fetchProducts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold">Store Products</h1>
          <p className="text-xs text-slate-500">Manage your product inventory, pricing, and catalog status</p>
        </div>
        <Link
          to="/seller/products/create"
          className="btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusSquare size={16} /> Add New Product
        </Link>
      </div>

      {/* Filter bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search your products..."
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
            No products found. Add your first item using the button above!
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
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
                        <div>
                          <p className="font-semibold text-slate-900 text-xs line-clamp-1">{p.name}</p>
                          <p className="text-[11px] text-slate-400">{p.brand || 'Store Brand'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-slate-600">{p.categoryId?.name || 'General'}</td>
                    <td className="font-bold text-xs text-slate-900">
                      {formatPrice(p.price)}
                      {p.discount > 0 && (
                        <span className="ml-1 text-[10px] text-rose-500 font-bold">-{p.discount}%</span>
                      )}
                    </td>
                    <td className="text-xs">
                      <span className={p.stock <= 5 ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                        {p.stock} units
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/products/${p._id}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                          title="View on marketplace"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <button
                          onClick={() => setConfirmDelete({ open: true, id: p._id })}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          title="Delete product"
                        >
                          <Trash2 size={14} />
                        </button>
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

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.open}
        title="Delete Product"
        message="Are you sure you want to delete this product listing? This action cannot be reversed."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </div>
  );
};

export default SellerProducts;
