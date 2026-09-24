import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { Star } from 'lucide-react';

const AdminReviews = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const fetchReviews = async () => {
    try { const res = await adminService.getReviews({ limit: 20 }); if (res.success) setItems(res.data.items || []); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed to load reviews'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchReviews(); }, []);
  const moderate = async (reviewId, status) => {
    try { await adminService.updateReview(reviewId, { status }); toast.success(`Review ${status.toLowerCase()}`); fetchReviews(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed to moderate review'); }
  };
  if (loading) return <SectionLoader height="min-h-[50vh]" />;
  return <div className="space-y-6"><div><h1 className="page-title">Review moderation</h1><p className="text-sm text-slate-500 mt-1">See customer feedback alongside every product, including products with no reviews yet.</p></div><div className="space-y-4">{items.map(({ product, reviews }) => <section key={product._id} className="card overflow-hidden"><div className="p-4 bg-stone-50 border-b border-slate-200 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">{product.name}</h2><p className="text-xs text-slate-500">{product.sellerId?.storeName || 'Marketplace Seller'}</p></div><span className="text-xs font-semibold text-slate-600">{reviews.length} review{reviews.length === 1 ? '' : 's'}</span></div>{reviews.length === 0 ? <p className="p-5 text-sm text-slate-500">No customer reviews yet.</p> : <div className="divide-y divide-slate-100">{reviews.map((review) => <div key={review._id} className="p-4 flex gap-4 items-start"><div className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-bold">{review.userId?.name?.[0] || '?'}</div><div className="flex-1"><div className="flex items-center gap-2"><span className="text-sm font-semibold">{review.userId?.name || 'Customer'}</span><span className="text-yellow-600 text-xs">{'★'.repeat(review.rating)}</span><span className="text-xs text-slate-400">{review.status}</span></div><p className="text-sm text-slate-600 mt-1">{review.comment}</p></div><div className="flex gap-2">{review.status !== 'ACTIVE' && <button onClick={() => moderate(review._id, 'ACTIVE')} className="btn-secondary btn-sm">Approve</button>}{review.status === 'ACTIVE' && <button onClick={() => moderate(review._id, 'REJECTED')} className="btn-sm text-red-700 hover:bg-red-50">Remove</button>}</div></div>)}</div>}</section>)}{items.length === 0 && <div className="card p-8 text-center text-sm text-slate-500"><Star className="mx-auto mb-2 text-slate-300" />No products available for review moderation.</div>}</div></div>;
};
export default AdminReviews;
