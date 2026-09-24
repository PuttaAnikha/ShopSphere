import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useForm } from 'react-hook-form';
import { Store, Eye, EyeOff, User, Mail, Lock, Phone } from 'lucide-react';

const RegisterPage = () => {
  const { register: registerUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('CUSTOMER');

  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data, role };
      if (role === 'SELLER') {
        payload.storeName = data.storeName;
        payload.storeDescription = data.storeDescription;
      }
      await registerUser(payload);
      toast.success('Account created successfully!');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
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
          <h1 className="text-xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-sm text-slate-500 mb-6">Join ShopSphere to start shopping or selling</p>

          {/* Role Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setRole('CUSTOMER')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'CUSTOMER' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setRole('SELLER')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'SELLER' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
            >
              Seller
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-group">
              <label className="label" htmlFor="name">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="name"
                  className="input pl-9"
                  placeholder="John Doe"
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                />
              </div>
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label className="label" htmlFor="reg-email">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="reg-email"
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
              <label className="label" htmlFor="phone">Phone (optional)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="phone"
                  className="input pl-9"
                  placeholder="+91 98765 43210"
                  {...register('phone')}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="reg-password">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="Min 6 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'At least 6 characters' }
                  })}
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

            {/* Seller-specific fields */}
            {role === 'SELLER' && (
              <>
                <div className="form-group">
                  <label className="label" htmlFor="storeName">Store Name</label>
                  <div className="relative">
                    <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="storeName"
                      className="input pl-9"
                      placeholder="Your Store Name"
                      {...register('storeName', { required: role === 'SELLER' ? 'Store name is required' : false })}
                    />
                  </div>
                  {errors.storeName && <span className="form-error">{errors.storeName.message}</span>}
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="storeDescription">Store Description (optional)</label>
                  <textarea
                    id="storeDescription"
                    className="input"
                    rows={2}
                    placeholder="Tell buyers about your store..."
                    {...register('storeDescription')}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? 'Creating Account...' : role === 'SELLER' ? 'Create Seller Account' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-700">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
