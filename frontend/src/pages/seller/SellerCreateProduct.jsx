import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import productService from '../../services/productService';
import adminService from '../../services/adminService';
import { formatPrice } from '../HomePage';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft, Package, Plus, Image as ImageIcon,
  DollarSign, Tag, Boxes, Sparkles, Check
} from 'lucide-react';

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80',
];

const SellerCreateProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    categoryId: '',
    price: '',
    discount: 0,
    stock: 10,
    description: '',
    imageUrl: SAMPLE_IMAGES[0],
  });

  useEffect(() => {
    adminService.getCategories()
      .then((res) => {
        if (res.success) {
          const cats = res.data.items || res.data.categories || res.data || [];
          setCategories(cats);
          if (cats.length > 0) {
            setFormData((prev) => ({ ...prev, categoryId: cats[0]._id }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Product title is required');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        brand: formData.brand.trim() || undefined,
        categoryId: formData.categoryId,
        price: Number(formData.price),
        discount: Number(formData.discount) || 0,
        stock: Number(formData.stock) || 0,
        description: formData.description.trim() || 'High quality marketplace product with warranty.',
        images: formData.imageUrl ? [formData.imageUrl.trim()] : [],
      };

      const res = await productService.createProduct(payload);
      if (res.success) {
        toast.success('Product created successfully and listed!');
        navigate('/seller/products');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const calculatedFinalPrice = formData.discount > 0 && formData.price
    ? Math.round(Number(formData.price) * (1 - Number(formData.discount) / 100))
    : Number(formData.price) || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/seller/products"
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title text-2xl font-bold">Add New Product</h1>
          <p className="text-xs text-slate-500">Publish a new catalog item for buyers across the marketplace</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
          <div className="card p-6 shadow-sm space-y-4">
            <h2 className="section-title text-base font-semibold">General Information</h2>

            <div className="form-group">
              <label className="label">Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Wireless Noise-Cancelling Headphones"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sony, Apple, Samsung"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label">Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  className="input"
                  disabled={loadingCats}
                >
                  {loadingCats ? (
                    <option>Loading categories...</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Product Description *</label>
              <textarea
                rows={4}
                required
                placeholder="Detailed highlights, features, and key specifications..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="card p-6 shadow-sm space-y-4">
            <h2 className="section-title text-base font-semibold">Pricing & Inventory</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="label">Base Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="2999"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label">Discount (% off)</label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  placeholder="0"
                  value={formData.discount}
                  onChange={(e) => handleChange('discount', e.target.value)}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label">Available Stock *</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="10"
                  value={formData.stock}
                  onChange={(e) => handleChange('stock', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card p-6 shadow-sm space-y-4">
            <h2 className="section-title text-base font-semibold">Product Media</h2>

            <div className="form-group">
              <label className="label">Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.imageUrl}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2">Or select from demo image presets:</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {SAMPLE_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleChange('imageUrl', img)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      formData.imageUrl === img ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link to="/seller/products" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-6"
            >
              {submitting ? 'Publishing...' : 'Publish Product'}
            </button>
          </div>
        </form>

        {/* Right: Live Preview */}
        <div className="lg:col-span-4">
          <div className="card p-5 shadow-sm sticky top-24">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" /> Marketplace Preview
            </h3>

            <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm bg-white">
              <div className="aspect-square bg-slate-100 overflow-hidden relative">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Package size={40} />
                  </div>
                )}
                {Number(formData.discount) > 0 && (
                  <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    -{formData.discount}%
                  </span>
                )}
              </div>

              <div className="p-4">
                <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">
                  {formData.brand || 'Store Brand'}
                </span>
                <p className="font-semibold text-slate-900 text-sm mt-0.5 line-clamp-1">
                  {formData.name || 'Product Title Preview'}
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-base font-bold text-slate-900">
                    {formatPrice(calculatedFinalPrice)}
                  </span>
                  {Number(formData.discount) > 0 && formData.price && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatPrice(Number(formData.price))}
                    </span>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                  <span>Stock: {formData.stock}</span>
                  <span className="text-emerald-600 font-medium">Ready to ship</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerCreateProduct;
