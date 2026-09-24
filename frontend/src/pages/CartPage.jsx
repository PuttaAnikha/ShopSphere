import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { SectionLoader } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { formatPrice } from './HomePage';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Package } from 'lucide-react';

const CartPage = () => {
  const { cart, loading, updateItem, removeItem, clearCart } = useCart();
  const { toast } = useToast();

  if (loading) return <SectionLoader height="min-h-[50vh]" />;

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          description="Explore our products and add items to your cart"
          action={<Link to="/products" className="btn-primary">Browse Products</Link>}
        />
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const sellerGroups = items.reduce((groups, item) => {
    const sellerKey = item.sellerId?._id || item.sellerId || 'marketplace';
    const sellerName = item.sellerId?.storeName || 'ShopSphere Seller';
    if (!groups[sellerKey]) groups[sellerKey] = { name: sellerName, items: [] };
    groups[sellerKey].items.push(item);
    return groups;
  }, {});

  const handleQuantity = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    try {
      await updateItem(item._id, newQty);
    } catch {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemove = async (item) => {
    try {
      await removeItem(item._id);
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Shopping Cart ({items.length})</h1>
        <button onClick={handleClear} className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
          <Trash2 size={14} /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {Object.values(sellerGroups).map((group) => (
            <section key={group.name} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="w-7 h-7 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-bold">{group.name[0]}</span>
                <h2 className="text-sm font-bold text-slate-800">Sold by {group.name}</h2>
              </div>
              {group.items.map((item) => (
            <div key={item._id} className="card p-4 flex gap-4">
              <Link to={`/products/${item.productId?._id || item.productId}`} className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                {item.productId?.images?.[0] ? (
                  <img src={item.productId.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-slate-300" /></div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.productId?._id || item.productId}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-600 line-clamp-1">
                  {item.productId?.name || 'Product'}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5">
                  {group.name}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-slate-200 rounded-lg">
                    <button onClick={() => handleQuantity(item, -1)} className="p-1.5 hover:bg-slate-50"><Minus size={14} /></button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => handleQuantity(item, 1)} className="p-1.5 hover:bg-slate-50"><Plus size={14} /></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                    <button onClick={() => handleRemove(item)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
              ))}
            </section>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h3 className="section-title mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal ({items.length} items)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <hr className="border-slate-100" />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-indigo-600">{formatPrice(subtotal)}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full mt-6 py-3 justify-center">
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/products" className="btn-ghost w-full mt-2 justify-center text-sm">
              <ShoppingBag size={14} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
