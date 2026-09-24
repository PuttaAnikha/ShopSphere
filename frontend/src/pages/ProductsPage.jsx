import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../services/productService';
import { ProductCard } from './HomePage';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { SectionLoader } from '../components/common/Spinner';
import { SlidersHorizontal, X } from 'lucide-react';
import api from '../services/api';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Read filters from URL
  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'newest',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rating: searchParams.get('rating') || '',
    hasDiscount: searchParams.get('hasDiscount') || '',
    page: parseInt(searchParams.get('page') || '1'),
  };

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data?.success) setCategories(res.data.data?.items || res.data.data?.categories || []);
      } catch { /* silent */ }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { limit: 12 };
        if (filters.search) params.search = filters.search;
        if (filters.category) params.category = filters.category;
        if (filters.sort) params.sort = filters.sort;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.rating) params.rating = filters.rating;
        if (filters.hasDiscount) params.hasDiscount = filters.hasDiscount;
        params.page = filters.page;

        const res = await productService.getProducts(params);
        if (res.success) {
          setProducts(res.data.items || []);
          setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchProducts();
  }, [searchParams.toString()]);

  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice || filters.rating || filters.hasDiscount;
  const activeFilterCount = [filters.category, filters.minPrice, filters.maxPrice, filters.rating, filters.hasDiscount].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">
            {filters.search ? `Results for "${filters.search}"` : 'All Products'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{pagination.total || 0} products found</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="input w-auto text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary btn-sm ${showFilters ? 'bg-green-50 text-green-800' : ''}`}
          >
            <SlidersHorizontal size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-black/40 lg:relative lg:bg-transparent' : 'hidden'} lg:w-60 flex-shrink-0`}>
          <div className={`${showFilters ? 'absolute right-0 top-0 h-full w-72 bg-white p-6 shadow-2xl lg:shadow-none lg:relative lg:w-auto lg:p-0' : ''}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</h3>
              <button onClick={() => setShowFilters(false)} className="p-1"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Category</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => updateFilter('category', '')}
                    className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${!filters.category ? 'bg-green-50 text-green-800 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => { updateFilter('category', cat._id); setShowFilters(false); }}
                      className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${filters.category === cat._id ? 'bg-green-50 text-green-800 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Price Range</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="input text-sm w-full"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="input text-sm w-full"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Minimum Rating</h4>
                <select
                  value={filters.rating}
                  onChange={(e) => updateFilter('rating', e.target.value)}
                  className="input text-sm"
                >
                  <option value="">Any</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>

              {/* Discount */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasDiscount === 'true'}
                  onChange={(e) => updateFilter('hasDiscount', e.target.checked ? 'true' : '')}
                  className="w-4 h-4 rounded border-slate-300 text-green-700 focus:ring-green-500"
                />
                <span className="text-sm text-slate-700">On Sale Only</span>
              </label>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-ghost btn-sm w-full text-red-600 hover:bg-red-50">
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <SectionLoader height="h-96" />
          ) : products.length === 0 ? (
            <EmptyState
              icon="search"
              title="No products found"
              description="Try adjusting your filters or search terms"
              action={hasActiveFilters && <button onClick={clearFilters} className="btn-primary btn-sm">Clear Filters</button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              <div className="mt-8">
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(p) => updateFilter('page', String(p))}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
