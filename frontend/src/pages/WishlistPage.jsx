import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import wishlistService from '../services/wishlistService';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from './HomePage';
import { SectionLoader } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { Heart, ShoppingCart, Trash2, Star, Package, ArrowRight } from 'lucide-react';

const WishlistPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { toast } = useToast();

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await wishlistService.getWishlist();
      if (res.success) {
        setProducts(res.data.wishlist?.products || []);
      }
    } catch (err) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      const res = await wishlistService.removeFromWishlist(productId);
      if (res.success) {
        setProducts(products.filter((p) => p._id !== productId));
        toast.success('Removed from wishlist');
      }
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const res = await addItem(product._id, 1);
      if (res.success) {
        toast.success(`Added ${product.name} to cart!`);
      } else {
        toast.error(res.message || 'Failed to add to cart');
      }
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) return <SectionLoader height="min-h-[50vh]" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h1 className="page-title text-2xl font-bold flex items-center gap-2">
            <Heart className="text-rose-500 fill-rose-500" size={24} /> My Wishlist ({products.length})
          </h1>
          <p className="text-sm text-slate-500">Products you've saved for later</p>
        </div>
        {products.length > 0 && (
          <Link to="/products" className="btn-secondary btn-sm">
            Continue Browsing
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon="heart"
          title="Your wishlist is empty"
          description="Save items you love by tapping the heart icon while browsing our marketplace."
          action={
            <Link to="/products" className="btn-primary">
              Discover Products
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const hasDiscount = product.discount > 0;
            const finalPrice = hasDiscount
              ? Math.round(product.price * (1 - product.discount / 100))
              : product.price;

            return (
              <div
                key={product._id}
                className="card group hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Image */}
                <div className="relative aspect-square bg-slate-100 overflow-hidden">
                  <Link to={`/products/${product._id}`}>
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={36} className="text-slate-300" />
                      </div>
                    )}
                  </Link>

                  {hasDiscount && (
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      -{product.discount}%
                    </span>
                  )}

                  <button
                    onClick={() => handleRemove(product._id)}
                    className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm transition-all"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-indigo-600 uppercase tracking-wider block mb-1">
                      {product.brand || 'ShopSphere'}
                    </span>
                    <Link
                      to={`/products/${product._id}`}
                      className="font-semibold text-slate-800 text-sm hover:text-indigo-600 line-clamp-2"
                    >
                      {product.name}
                    </Link>

                    {/* Rating */}
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="flex items-center text-amber-400 text-xs">
                          <Star size={13} fill="currentColor" />
                          <span className="ml-1 font-semibold text-slate-700">{product.rating.toFixed(1)}</span>
                        </div>
                        {product.numReviews > 0 && (
                          <span className="text-[11px] text-slate-400">({product.numReviews})</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-slate-900">{formatPrice(finalPrice)}</span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-400 line-through ml-1.5">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                      className="btn-primary btn-sm flex items-center gap-1.5 px-3"
                    >
                      <ShoppingCart size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
