import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import orderService from '../services/orderService';
import couponService from '../services/couponService';
import { formatPrice } from './HomePage';
import { SectionLoader } from '../components/common/Spinner';
import {
  MapPin, CreditCard, Tag, CheckCircle2, ShieldCheck,
  Truck, ArrowLeft, Package, Sparkles
} from 'lucide-react';

const CheckoutPage = () => {
  const { user } = useAuth();
  const { cart, loading: cartLoading, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const items = cart?.items || [];

  const [shippingAddress, setShippingAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || 'India',
    phone: user?.phone || '',
  });

  const [paymentMethod, setPaymentMethod] = useState('ONLINE_DEMO');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  if (cartLoading) return <SectionLoader height="min-h-[50vh]" />;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Package size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">No items to checkout</h2>
        <p className="text-sm text-slate-500 mb-6">Your shopping cart is empty. Add items before checking out.</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const shippingAmount = 0; // Free shipping
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingAmount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      setValidatingCoupon(true);
      const res = await couponService.validateCoupon(couponCode.trim().toUpperCase(), subtotal);
      if (res.success) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountAmount: res.data.discount || res.data.discountAmount || 0,
          ...res.data
        });
        toast.success(res.message || 'Coupon applied successfully!');
      } else {
        toast.error(res.message || 'Invalid coupon code');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const validateForm = () => {
    const errors = {};
    if (!shippingAddress.street.trim()) errors.street = 'Street address is required';
    if (!shippingAddress.city.trim()) errors.city = 'City is required';
    if (!shippingAddress.state.trim()) errors.state = 'State is required';
    if (!shippingAddress.postalCode.trim()) errors.postalCode = 'Postal code is required';
    if (!shippingAddress.phone.trim()) errors.phone = 'Phone number is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      toast.error('Please complete all required shipping fields');
      return;
    }

    try {
      setSubmitting(true);
      if (paymentMethod === 'ONLINE_DEMO') {
        setProcessingPayment(true);
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
      const orderPayload = {
        shippingAddress,
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      };

      const res = await orderService.createOrder(orderPayload);
      if (res.success) {
        await clearCart();
        toast.success('Order placed successfully!');
        const orderId = res.data?.order?._id;
        if (orderId) {
          navigate(`/orders/${orderId}`);
        } else {
          navigate('/orders');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setProcessingPayment(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/cart" className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title text-2xl font-bold">Checkout</h1>
          <p className="text-sm text-slate-500">Review your order and enter shipping details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Shipping + Payment */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Address */}
          <div className="card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <MapPin className="text-green-700" size={20} />
              <h2 className="font-semibold text-slate-900 text-lg">Shipping Address</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 form-group">
                <label className="label">Street Address *</label>
                <input
                  type="text"
                  placeholder="Apartment, suite, unit, building, floor, street"
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  className={`input ${formErrors.street ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {formErrors.street && <span className="form-error">{formErrors.street}</span>}
              </div>

              <div className="form-group">
                <label className="label">City *</label>
                <input
                  type="text"
                  placeholder="City"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className={`input ${formErrors.city ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {formErrors.city && <span className="form-error">{formErrors.city}</span>}
              </div>

              <div className="form-group">
                <label className="label">State / Province *</label>
                <input
                  type="text"
                  placeholder="State"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  className={`input ${formErrors.state ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {formErrors.state && <span className="form-error">{formErrors.state}</span>}
              </div>

              <div className="form-group">
                <label className="label">Postal Code *</label>
                <input
                  type="text"
                  placeholder="PIN / Postal Code"
                  value={shippingAddress.postalCode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                  className={`input ${formErrors.postalCode ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {formErrors.postalCode && <span className="form-error">{formErrors.postalCode}</span>}
              </div>

              <div className="form-group">
                <label className="label">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  className={`input ${formErrors.phone ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {formErrors.phone && <span className="form-error">{formErrors.phone}</span>}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <CreditCard className="text-green-700" size={20} />
              <h2 className="font-semibold text-slate-900 text-lg">Payment Method</h2>
            </div>

            <div className="space-y-3">
              <label
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'ONLINE_DEMO'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="ONLINE_DEMO"
                  checked={paymentMethod === 'ONLINE_DEMO'}
                  onChange={() => setPaymentMethod('ONLINE_DEMO')}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm">Online Payment (Demo)</span>
                    <span className="badge bg-green-100 text-green-800 text-[10px]">Demo payment</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Simulates a successful payment for development and project demonstration. No real gateway is connected.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'border-green-600 bg-green-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="CASH_ON_DELIVERY"
                  checked={paymentMethod === 'CASH_ON_DELIVERY'}
                  onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                  className="mt-1 text-green-700 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm">Cash on Delivery</span>
                    <span className="badge badge-neutral text-[10px]">Pay on Arrival</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Pay securely using cash or UPI upon delivery at your doorstep.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary: Items + Coupon + Totals */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card p-6 shadow-sm sticky top-24">
            <h2 className="section-title text-base font-semibold mb-4">Order Items ({items.length})</h2>

            {/* Items list */}
            <div className="max-h-60 overflow-y-auto space-y-3 mb-6 pr-1 divide-y divide-slate-50">
              {items.map((item) => (
                <div key={item._id} className="pt-2 first:pt-0 flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {item.productId?.images?.[0] ? (
                      <img src={item.productId.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={18} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">
                      {item.productId?.name || 'Product'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Qty: {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            <div className="mb-6 pt-4 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 flex mb-1.5 items-center gap-1.5">
                <Tag size={13} className="text-green-700" /> Have a Promo Code?
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{appliedCoupon.code}</span>
                      <p className="text-[11px] text-emerald-600">Saved {formatPrice(discountAmount)}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10 or FLAT100"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="input uppercase text-xs h-9 flex-1"
                  />
                  <button
                    type="submit"
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="btn-secondary btn-sm h-9 px-3"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </form>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Standard Delivery</span>
                <span className="text-emerald-600 font-medium">FREE</span>
              </div>
              <hr className="my-2 border-slate-100" />
              <div className="flex justify-between text-base font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="text-indigo-600">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="btn-primary w-full mt-6 py-3 justify-center text-sm font-semibold shadow-md shadow-indigo-100"
            >
                {processingPayment ? 'Processing payment...' : submitting ? 'Placing Order...' : `Place Order • ${formatPrice(finalTotal)}`}
            </button>

            {/* Trust badges */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-around text-slate-400 text-[11px]">
              <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-indigo-600" /> Safe Payment</span>
              <span className="flex items-center gap-1"><Truck size={14} className="text-indigo-600" /> Fast Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
