import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import productService from '../services/productService';
import aiService from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ShoppingCart, Star, TrendingUp, Shield, Truck, Headphones, ArrowRight, Sparkles, Zap, Package } from 'lucide-react';

const formatPrice = (price) => '₹' + Number(price).toLocaleString('en-IN');

const ProductCard = ({ product }) => {
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const discountedPrice = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    setAdding(true);
    try {
      await addItem(product._id, 1);
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add to cart');
    }
    setAdding(false);
  };

  return (
    <Link to={`/products/${product._id}`} className="card-hover group block overflow-hidden">
      <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-slate-300" />
          </div>
        )}
        {product.discount > 0 && (
          <span className="absolute top-3 left-3 bg-yellow-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
            -{product.discount}%
          </span>
        )}
        {product.stock <= 3 && product.stock > 0 && (
          <span className="absolute top-3 right-3 bg-green-700 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            Only {product.stock} left
          </span>
        )}
        {product.status === 'OUT_OF_STOCK' && (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
            <span className="bg-white text-slate-800 font-semibold text-sm px-4 py-2 rounded-lg">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-indigo-600 font-medium mb-1">{product.categoryId?.name || 'General'}</p>
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2 group-hover:text-indigo-700 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-0.5 text-yellow-600">
            <Star size={13} fill="currentColor" />
            <span className="text-xs font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
          </div>
          <span className="text-xs text-slate-400">({product.reviewCount || 0})</span>
          {product.sellerId?.storeName && (
            <span className="text-xs text-slate-400 ml-auto truncate max-w-20">by {product.sellerId.storeName}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-slate-900">{formatPrice(Math.round(discountedPrice))}</span>
            {product.discount > 0 && (
              <span className="text-xs text-slate-400 line-through ml-1.5">{formatPrice(product.price)}</span>
            )}
          </div>
          {isAuthenticated && user?.role === 'CUSTOMER' && product.status !== 'OUT_OF_STOCK' && (
            <button
              onClick={handleAdd}
              disabled={adding}
              aria-label={`Add ${product.name} to cart`}
              className="p-2 rounded-lg bg-green-50 text-green-800 hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <ShoppingCart size={16} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [topRated, discounted, newest, recommended] = await Promise.all([
          productService.getProducts({ limit: 8, sort: 'rating' }),
          productService.getProducts({ limit: 8, hasDiscount: true, sort: 'newest' }),
          productService.getProducts({ limit: 8, sort: 'newest' }),
          aiService.getRecommendations({ limit: 8 }).catch(() => null)
        ]);
        if (topRated.success) setProducts(topRated.data.items || []);
        if (discounted.success) setDeals(discounted.data.items || []);
        if (newest.success) setNewArrivals(newest.data.items || []);
        setRecommendations(recommended?.data?.products || []);
      } catch { /* silent */ }
      setLoading(false);
    };
    load();
  }, []);

  const categories = [...new Map(
    products
      .filter((product) => product.categoryId?.name)
      .map((product) => [product.categoryId._id, product.categoryId])
  ).values()].slice(0, 6);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-green-950">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-yellow-400/10 skew-x-[-18deg] translate-x-1/4"></div>
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-yellow-300 text-green-950 rounded-full px-4 py-1.5 mb-6">
              <Sparkles size={14} />
              <span className="text-sm font-bold">A better way to shop together</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
              Discover products from <span className="text-yellow-300">trusted sellers.</span>
            </h1>
            <p className="text-lg text-green-50/80 leading-relaxed mb-8 max-w-lg">
              Shop smarter across one marketplace, with thoughtful picks, fair prices, and sellers worth coming back to.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="inline-flex items-center gap-2 bg-white text-green-900 font-semibold px-6 py-3 rounded-lg hover:bg-green-50 transition-colors shadow-lg">
                Browse Products <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="inline-flex items-center gap-2 bg-transparent text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors border border-green-200/40">
                Become a Seller <Zap size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
              { icon: Shield, title: 'Secure Payments', desc: '100% protected checkout' },
              { icon: Headphones, title: '24/7 Support', desc: 'Dedicated help center' },
              { icon: TrendingUp, title: 'Best Prices', desc: 'Price match guarantee' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-12">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Browse by mood</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">Find your next favorite</h2>
            </div>
            <Link to="/products" className="text-sm font-semibold text-green-800 hover:text-green-950">All categories <ArrowRight size={14} className="inline ml-1" /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((category) => (
              <Link key={category._id} to={`/products?category=${category._id}`} className="bg-white border border-slate-200 rounded-lg px-4 py-5 hover:border-green-300 hover:bg-green-50 transition-colors">
                <p className="font-semibold text-slate-800">{category.name}</p>
                <p className="text-xs text-slate-500 mt-1">Shop collection</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Top Rated Products</h2>
            <p className="text-slate-500 text-sm mt-1">Handpicked quality from our best sellers</p>
          </div>
          <Link to="/products" className="btn-secondary btn-sm hidden sm:inline-flex">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-4 space-y-3">
                <div className="skeleton aspect-[4/3] rounded-lg" />
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="skeleton h-5 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
        <div className="text-center mt-8 sm:hidden">
          <Link to="/products" className="btn-primary">View All Products</Link>
        </div>
      </section>

      {deals.length > 0 && (
        <section className="bg-yellow-50 border-y border-yellow-100">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-6">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">Limited offers</p><h2 className="text-2xl font-bold text-green-950 mt-1">Deals worth a look</h2></div>
              <Link to="/deals" className="text-sm font-semibold text-green-800">View deals <ArrowRight size={14} className="inline ml-1" /></Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{deals.slice(0, 4).map((product) => <ProductCard key={product._id} product={product} />)}</div>
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Personalized picks</p><h2 className="text-2xl font-bold text-slate-900 mt-1">For you</h2></div><Link to="/for-you" className="text-sm font-semibold text-green-800">See all <ArrowRight size={14} className="inline ml-1" /></Link></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{recommendations.slice(0, 4).map((product) => <ProductCard key={product._id} product={product} />)}</div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Fresh in</p><h2 className="text-2xl font-bold text-slate-900 mt-1">New arrivals</h2></div><Link to="/shop?sort=newest" className="text-sm font-semibold text-green-800">Shop new arrivals <ArrowRight size={14} className="inline ml-1" /></Link></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{newArrivals.slice(0, 4).map((product) => <ProductCard key={product._id} product={product} />)}</div>
        </section>
      )}

    </div>
  );
};

export { ProductCard, formatPrice };
export default HomePage;
