import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import productService from '../services/productService';
import { SectionLoader } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { Search, Store, Star, ArrowRight } from 'lucide-react';

const SellersPage = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { productService.getProducts({ limit: 100 }).then((res) => { if (res.success) setProducts(res.data.items || []); }).finally(() => setLoading(false)); }, []);
  const sellers = useMemo(() => { const grouped = new Map(); products.forEach((product) => { const seller = product.sellerId; if (!seller?._id) return; const current = grouped.get(seller._id) || { ...seller, products: [] }; current.products.push(product); grouped.set(seller._id, current); }); return [...grouped.values()].filter((seller) => seller.storeName?.toLowerCase().includes(search.toLowerCase())); }, [products, search]);
  return <div className="max-w-7xl mx-auto px-4 py-10"><header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Marketplace stores</p><h1 className="page-title text-3xl mt-2">Explore sellers</h1><p className="text-slate-500 mt-2">Discover the stores behind the products you love.</p></div><div className="relative w-full md:w-72"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sellers" className="input pl-9" /></div></header>{loading ? <SectionLoader height="min-h-[40vh]" /> : sellers.length ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{sellers.map((seller) => <article key={seller._id} className="card p-5"><div className="flex items-start justify-between"><div className="w-12 h-12 rounded-lg bg-green-100 text-green-800 flex items-center justify-center"><Store size={22} /></div><span className="text-xs text-slate-500">{seller.products.length} products</span></div><h2 className="text-lg font-bold text-slate-900 mt-5">{seller.storeName}</h2><p className="text-sm text-slate-500 mt-1">{seller.products[0]?.categoryId?.name || 'Marketplace seller'}</p><div className="flex items-center gap-1 mt-4 text-yellow-600 text-sm"><Star size={15} fill="currentColor" /> {seller.rating?.toFixed?.(1) || 'New seller'}</div><Link to={`/sellers/${seller._id}`} className="btn-secondary btn-sm w-full mt-5 justify-center">Visit store <ArrowRight size={14} /></Link></article>)}</div> : <EmptyState icon="sellers" title="No sellers found" description="Try a different seller search." />}</div>;
};
export default SellersPage;
