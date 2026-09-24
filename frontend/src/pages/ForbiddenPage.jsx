import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

const ForbiddenPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-600 shadow-sm">
          <ShieldAlert size={40} />
        </div>
        <div className="text-4xl font-extrabold text-slate-900 mb-2">403</div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h1>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          You do not have permission to access this area. If you believe this is an error, please log into an authorized account or contact support.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
            <Home size={16} /> Return to Home
          </Link>
          <Link to="/login" className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
