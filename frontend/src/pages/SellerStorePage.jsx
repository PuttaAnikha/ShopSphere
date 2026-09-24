import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import productService from '../services/productService';
import { ProductCard } from './HomePage';
import { SectionLoader } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { Store, Star, ArrowLeft } from 'lucide-react';

const SellerStorePage = () => {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { productService.getProducts({ seller: id, limit: 100 }).then((res) => { const items = res.data?.items || []; setProducts(items); setSeller(items[0]?.sellerId || null); }).finally(() => setLoading(false)); }, [id]);
  if (loading) return <SectionLoader height="min-h-[50vh]" />;
  return <div className="max-w-7xl mx-auto px-4 py-10"><Link to="/sellers" className="inline-flex items-center gap-2 text-sm text-green-800 font-semibold mb-8"><ArrowLeft size={15} /> All sellers</Link><header className="card p-6 md:p-8 mb-8 flex items-start gap-4"><div className="w-14 h-14 rounded-lg bg-green-100 text-green-800 flex items-center justify-center"><Store size={26} /></div><div><h1 className="page-title">{seller?.storeName || 'Seller store'}</h1><p className="text-sm text-slate-500 mt-1">{seller?.description || 'Browse products from this marketplace seller.'}</p><div className="flex items-center gap-1 text-sm text-yellow-600 mt-3"><Star size={15} fill="currentColor" /> {seller?.rating?.toFixed?.(1) || 'New seller'}</div></div></header><h2 className="section-title mb-5">Store products</h2>{products.length ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div> : <EmptyState icon="search" title="No products in this store" description="This seller has no active products right now." />}</div>;
};
export default SellerStorePage;
