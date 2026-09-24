import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../services/orderService';
import { formatPrice } from './HomePage';
import StatusBadge from '../components/common/StatusBadge';
import { SectionLoader } from '../components/common/Spinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle2,
  AlertCircle, Truck, XCircle, RotateCcw, Store, ShieldCheck
} from 'lucide-react';

const ORDER_STEPS = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrderById(id);
      if (res.success) {
        setOrder(res.data.order || res.data);
      }
    } catch (err) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please specify a reason for cancellation');
      return;
    }
    try {
      setCancelling(true);
      const res = await orderService.cancelOrder(id, cancelReason.trim());
      if (res.success) {
        toast.success('Order cancelled successfully');
        setCancelModalOpen(false);
        fetchOrder();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <SectionLoader height="min-h-[50vh]" />;

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">We couldn't find the requested order details.</p>
        <Link to="/orders" className="btn-primary">Back to Orders</Link>
      </div>
    );
  }

  const isCancelled = order.orderStatus === 'CANCELLED';
  const isDelivered = order.orderStatus === 'DELIVERED';
  const canCancel = ['PLACED', 'CONFIRMED'].includes(order.orderStatus);

  // Stepper progress index
  const currentStepIdx = ORDER_STEPS.indexOf(order.orderStatus);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link to="/orders" className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
              </h1>
              <StatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {canCancel && (
          <button
            onClick={() => setCancelModalOpen(true)}
            className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 btn-sm self-start sm:self-auto"
          >
            <XCircle size={14} /> Cancel Order
          </button>
        )}
      </div>

      {/* Visual Tracking Stepper */}
      {!isCancelled ? (
        <div className="card p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-6">Delivery Progress</h2>
          <div className="relative flex items-center justify-between max-w-4xl mx-auto">
            {/* Progress line */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-100 z-0">
              <div
                className="h-full bg-indigo-600 transition-all duration-500"
                style={{
                  width: currentStepIdx >= 0 ? `${(currentStepIdx / (ORDER_STEPS.length - 1)) * 100}%` : '0%'
                }}
              />
            </div>

            {ORDER_STEPS.map((step, idx) => {
              const completed = currentStepIdx >= idx;
              const current = currentStepIdx === idx;

              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                      completed
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 ring-4 ring-white'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                    }`}
                  >
                    {completed ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-2 whitespace-nowrap capitalize ${
                      current ? 'text-indigo-600 font-bold' : completed ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {step.toLowerCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card p-5 mb-8 border-red-200 bg-red-50/50 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-900">This order was cancelled</h3>
            {order.cancellationReason && (
              <p className="text-xs text-red-700 mt-1">Reason: {order.cancellationReason}</p>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Items */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card p-6 shadow-sm">
            <h2 className="section-title text-base font-semibold mb-4">
              Ordered Items ({order.items?.length || 0})
            </h2>

            <div className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div key={item._id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {item.productImage ? (
                      <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                    ) : item.productId?.images?.[0] ? (
                      <img src={item.productId.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={20} className="text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.productId?._id || item.productId}`}
                      className="text-sm font-semibold text-slate-900 hover:text-indigo-600 line-clamp-1"
                    >
                      {item.productName || item.productId?.name || 'Product'}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Store size={12} />
                      {item.sellerId?.storeName || 'ShopSphere Partner'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Unit Price: {formatPrice(item.priceAtPurchase || item.price)} × {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">
                      {formatPrice(item.subtotal || (item.priceAtPurchase || item.price) * item.quantity)}
                    </span>
                    <div className="mt-1">
                      <StatusBadge status={item.status || order.orderStatus} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Address, Payment, Cost Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Shipping Address */}
          <div className="card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 text-slate-900 font-semibold text-sm">
              <MapPin size={16} className="text-indigo-600" />
              Delivery Address
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-900">{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
              <p>{order.shippingAddress?.country || 'India'}</p>
              {order.shippingAddress?.phone && (
                <p className="pt-1 text-slate-500 font-medium">Phone: {order.shippingAddress.phone}</p>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 text-slate-900 font-semibold text-sm">
              <CreditCard size={16} className="text-indigo-600" />
              Payment Information
            </div>
            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="font-medium text-slate-900">
                  {order.paymentMethod === 'ONLINE_DEMO' || order.paymentMethod === 'MOCK_GATEWAY'
                    ? 'Online Payment (Demo)'
                    : 'Cash on Delivery'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
              {order.paymentDetails?.transactionId && (
                <div className="flex justify-between">
                  <span>Transaction ID</span>
                  <span className="font-mono text-slate-700">{order.paymentDetails.transactionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cost Summary */}
          <div className="card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              Payment Breakdown
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span className="font-semibold">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="text-emerald-600 font-medium">
                  {order.shippingAmount > 0 ? formatPrice(order.shippingAmount) : 'FREE'}
                </span>
              </div>
              <hr className="my-2 border-slate-100" />
              <div className="flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="text-indigo-600">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Cancel Order"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="form-group">
              <label className="label">Cancellation Reason *</label>
              <textarea
                rows={3}
                placeholder="Please state why you want to cancel..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="btn-secondary btn-sm"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelling || !cancelReason.trim()}
                onClick={handleCancelOrder}
                className="btn-danger btn-sm"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrderDetailPage;
