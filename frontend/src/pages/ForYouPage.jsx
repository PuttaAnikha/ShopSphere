import { useEffect, useState } from 'react';
import aiService from '../services/aiService';
import productService from '../services/productService';
import { ProductCard } from './HomePage';
import { SectionLoader } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { Sparkles } from 'lucide-react';

const ForYouPage = () => {
  const [products, setProducts] = useState([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const load = async () => { try { const res = await aiService.getRecommendations({ limit: 12 }); const recommended = res.data?.products || res.data?.items || []; if (recommended.length) { setProducts(recommended); setPersonalized(true); } else { const fallback = await productService.getProducts({ limit: 12, sort: 'rating' }); setProducts(fallback.data?.items || []); } } catch { const fallback = await productService.getProducts({ limit: 12, sort: 'rating' }); setProducts(fallback.data?.items || []); } finally { setLoading(false); } }; load(); }, []);
  return <div className="max-w-7xl mx-auto px-4 py-10"><header className="max-w-2xl mb-8"><div className="inline-flex items-center gap-2 text-green-800 bg-green-50 rounded-full px-3 py-1 text-xs font-bold"><Sparkles size={14} /> {personalized ? 'Picked from your activity' : 'Popular while we learn your taste'}</div><h1 className="page-title text-3xl mt-3">For You</h1><p className="text-slate-500 mt-2">{personalized ? 'Recommendations shaped by how you browse and shop.' : 'Explore popular products while we learn what you like.'}</p></header>{loading ? <SectionLoader height="min-h-[40vh]" /> : products.length ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div> : <EmptyState icon="search" title="Nothing to recommend yet" description="Browse the shop and we will tailor this space for you." />}</div>;
};
export default ForYouPage;
