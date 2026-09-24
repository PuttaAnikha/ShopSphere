import { useEffect, useState } from 'react';
import productService from '../services/productService';
import { ProductCard } from './HomePage';
import { SectionLoader } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { Tag } from 'lucide-react';

const DealsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { productService.getProducts({ limit: 40, hasDiscount: true, sort: 'newest' }).then((res) => { if (res.success) setProducts(res.data.items || []); }).finally(() => setLoading(false)); }, []);
  const best = [...products].sort((a, b) => (b.discount || 0) - (a.discount || 0));
  return <div className="max-w-7xl mx-auto px-4 py-10 space-y-12"><header className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Offers worth opening</p><h1 className="page-title text-3xl mt-2">Deals</h1><p className="text-slate-500 mt-2">Actual discounts from ShopSphere sellers, refreshed from the marketplace.</p></header>{loading ? <SectionLoader height="min-h-[40vh]" /> : products.length === 0 ? <EmptyState icon="search" title="No deals available" description="Check back soon for new seller offers." /> : <><section><div className="flex items-center gap-2 mb-5"><Tag size={18} className="text-yellow-600" /><h2 className="section-title">Today's deals</h2></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{products.slice(0, 8).map((product) => <ProductCard key={product._id} product={product} />)}</div></section><section><h2 className="section-title mb-5">Best discounts</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{best.slice(0, 8).map((product) => <ProductCard key={product._id} product={product} />)}</div></section></>}</div>;
};
export default DealsPage;
