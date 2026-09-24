import { Link } from 'react-router-dom';
import { Home, Search, ShoppingBag } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-indigo-600 mb-2 tracking-tight">404</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
            <Home size={16} /> Back to Home
          </Link>
          <Link to="/products" className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
            <ShoppingBag size={16} /> Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
