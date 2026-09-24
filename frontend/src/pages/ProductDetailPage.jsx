import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import productService from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { SectionLoader } from '../components/common/Spinner';
import { formatPrice } from './HomePage';
import {
  Star, ShoppingCart, Heart, Minus, Plus, Truck, Shield,
  RotateCcw, ChevronRight, Package, Store
} from 'lucide-react';
import wishlistService from '../services/wishlistService';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await productService.getProductById(id);
        if (res.success) {
          setProduct(res.data.product);
        }
        // Fetch reviews
        try {
          const revRes = await productService.getProductReviews(id);
          if (revRes.success) setReviews(revRes.data.items || revRes.data.reviews || []);
        } catch { /* silent */ }
      } catch {
        toast.error('Product not found');
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.warning('Please login to add items to cart');
      return;
    }
    setAdding(true);
    try {
      await addItem(product._id, quantity);
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add to cart');
    }
    setAdding(false);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.warning('Please login to save wishlist');
      return;
    }
    try {
      await wishlistService.addToWishlist(product._id);
      toast.success('Added to wishlist!');
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  if (loading) return <SectionLoader height="min-h-[60vh]" />;
  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <Package size={48} className="mx-auto text-slate-300 mb-4" />
      <h2 className="text-xl font-semibold text-slate-700">Product not found</h2>
      <Link to="/products" className="btn-primary mt-4">Browse Products</Link>
    </div>
  );

  const discountedPrice = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const images = product.images?.length > 0 ? product.images : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-green-700">Home</Link>
        <ChevronRight size={14} />
        <Link to="/products" className="hover:text-green-700">Products</Link>
        <ChevronRight size={14} />
        <span className="text-slate-800 truncate max-w-48">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="aspect-square bg-stone-100 rounded-lg border border-slate-200 overflow-hidden mb-3">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain p-8"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={64} className="text-slate-300" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-green-600' : 'border-slate-200'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.categoryId?.name && (
            <Link to={`/products?category=${product.categoryId._id}`} className="text-xs font-medium text-green-700 hover:text-green-900 mb-2 inline-block">
              {product.categoryId.name}
            </Link>
          )}
          <h1 className="text-2xl font-bold text-slate-900 mb-3">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                    className={s <= Math.round(product.rating) ? 'text-yellow-500' : 'text-slate-200'}
                  fill={s <= Math.round(product.rating) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-slate-700">{product.rating?.toFixed(1)}</span>
            <span className="text-sm text-slate-400">({product.reviewCount} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-slate-900">{formatPrice(Math.round(discountedPrice))}</span>
            {product.discount > 0 && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatPrice(product.price)}</span>
                <span className="badge bg-yellow-100 text-amber-900">{product.discount}% OFF</span>
              </>
            )}
          </div>

          {/* Seller */}
          {product.sellerId && (
            <div className="flex items-center gap-2 mb-6 text-sm text-slate-600">
              <Store size={14} className="text-slate-400" />
              Sold by <span className="font-medium text-slate-800">{product.sellerId.storeName}</span>
            </div>
          )}

          {/* Description */}
          <p className="text-slate-600 leading-relaxed mb-6">{product.description}</p>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Specifications</h3>
              <div className="bg-slate-50 rounded-lg divide-y divide-slate-100">
                {Object.entries(product.specifications instanceof Map ? Object.fromEntries(product.specifications) : product.specifications).map(([key, val]) => (
                  <div key={key} className="flex py-2 px-3 text-sm">
                    <span className="text-slate-500 w-32 flex-shrink-0">{key}</span>
                    <span className="text-slate-800 font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          {product.status !== 'OUT_OF_STOCK' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-slate-50 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 hover:bg-slate-50 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-xs text-slate-400">{product.stock} in stock</span>
              </div>

              <div className="flex gap-3">
                {isAuthenticated && user?.role === 'CUSTOMER' && (
                  <>
                    <button
                      onClick={handleAddToCart}
                      disabled={adding}
                      className="btn-primary flex-1 py-3"
                    >
                      <ShoppingCart size={18} />
                      {adding ? 'Adding...' : 'Add to Cart'}
                    </button>
                    <button onClick={handleWishlist} className="btn-secondary p-3">
                      <Heart size={18} />
                    </button>
                  </>
                )}
                {!isAuthenticated && (
                  <Link to="/login" className="btn-primary flex-1 py-3 justify-center">
                    Login to Purchase
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <p className="text-red-600 font-semibold">Currently Out of Stock</p>
              <p className="text-sm text-red-400 mt-1">This item is temporarily unavailable</p>
            </div>
          )}

          {/* Trust */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
            {[
              { icon: Truck, label: 'Free Delivery' },
              { icon: Shield, label: 'Secure Payment' },
              { icon: RotateCcw, label: 'Easy Returns' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center">
                <Icon size={18} className="text-slate-400" />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-16">
        <h2 className="section-title mb-6">Customer Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <div className="card p-8 text-center">
            <Star size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-800 text-xs font-bold">{r.userId?.name?.[0] || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{r.userId?.name || 'Anonymous'}</p>
                      {r.verifiedPurchase && <span className="text-[10px] text-green-600 font-medium">✓ Verified Purchase</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} className={s <= r.rating ? 'text-yellow-500' : 'text-slate-200'} fill={s <= r.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductDetailPage;
