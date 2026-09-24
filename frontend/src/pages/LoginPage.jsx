import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useForm } from 'react-hook-form';
import { Store, Eye, EyeOff, Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  // Redirect if already authenticated - use useEffect to avoid render-phase update
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'SELLER') {
        navigate('/seller/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location.state]);

  if (isAuthenticated) return null;

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data);
      toast.success(`Welcome back, ${result.user.name}!`);
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (result.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (result.user.role === 'SELLER') {
        navigate('/seller/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Store size={22} className="text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-900">
              Shop<span className="text-indigo-600">Sphere</span>
            </span>
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-6">Sign in to your account to continue</p>

          {location.search?.includes('session=expired') && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg p-3 mb-4">
              Your session has expired. Please log in again.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-group">
              <label className="label" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  className="input pl-9"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' }
                  })}
                />
              </div>
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="Enter your password"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:text-indigo-700">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
