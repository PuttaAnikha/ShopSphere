import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import notificationService from '../../services/notificationService';
import {
  ShoppingCart, Heart, Bell, User, Menu, X, Search, Package,
  LogOut, Settings, ChevronDown, Store, LayoutDashboard, Sparkles
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';

const Navbar = ({ onSearch }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [notifCount, setNotifCount] = useState(0);
  const debouncedSearch = useDebounce(searchVal, 400);
  const userMenuRef = useRef(null);

  useEffect(() => {
    api.get('/categories').then((res) => {
      if (res.data?.success) setCategories(res.data.data?.items || res.data.data?.categories || []);
    }).catch(() => {});
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    if (isAuthenticated) {
      notificationService.getNotifications({ limit: 1 }).then((res) => {
        if (res.success) {
          const unread = (res.data.notifications || res.data.items || []).filter(n => !n.isRead).length;
          setNotifCount(unread);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    if (onSearch && ['/products', '/shop'].includes(location.pathname)) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch, location.pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const getDashboardLink = () => {
    const role = user?.role;
    if (role === 'SELLER') return '/seller/dashboard';
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'SUPPORT_AGENT') return '/support/dashboard';
    if (role === 'DELIVERY_PARTNER') return '/delivery/dashboard';
    return '/';
  };

  const navLinks = [
    { to: '/', label: 'Home' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-700 rounded-lg flex items-center justify-center shadow-sm">
              <Store size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">
              Shop<span className="text-green-700">Sphere</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="input pl-9 pr-4 h-10 rounded-full border-slate-200"
              />
            </div>
          </form>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === link.to ? 'text-green-800 bg-green-50' : 'text-slate-600 hover:text-green-800 hover:bg-green-50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="relative">
              <button onClick={() => setShopOpen(!shopOpen)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors">
                Shop <ChevronDown size={14} className="inline ml-1" />
              </button>
              {shopOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl p-4 z-50">
                  <Link to="/shop" onClick={() => setShopOpen(false)} className="block text-sm font-bold text-green-800 pb-3 mb-3 border-b border-slate-100">All Products <span className="float-right">→</span></Link>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Categories</p>
                  <div className="grid grid-cols-2 gap-1">
                    {categories.map((category) => <Link key={category._id} to={`/shop?category=${category._id}`} onClick={() => setShopOpen(false)} className="text-xs text-slate-600 hover:text-green-800 hover:bg-green-50 rounded px-2 py-2">{category.name}</Link>)}
                  </div>
                </div>
              )}
            </div>
            {[['/deals', 'Deals'], ['/sellers', 'Sellers'], ['/for-you', 'For You']].map(([to, label]) => (
              <Link key={to} to={to} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${location.pathname.startsWith(to) ? 'text-green-800 bg-green-50' : 'text-slate-600 hover:text-green-800 hover:bg-green-50'}`}>{label}</Link>
            ))}

            {isAuthenticated ? (
              <>
                {/* Cart - only for customers */}
                {user?.role === 'CUSTOMER' && (
                  <Link to="/cart" className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <ShoppingCart size={20} strokeWidth={1.8} />
                    {totalItems > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-yellow-500 text-slate-900 text-xs rounded-full flex items-center justify-center font-bold">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </Link>
                )}

                {/* Wishlist - only for customers */}
                {user?.role === 'CUSTOMER' && (
                  <Link to="/wishlist" className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                    <Heart size={20} strokeWidth={1.8} />
                  </Link>
                )}

                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 text-slate-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                  <Bell size={20} strokeWidth={1.8} />
                  {notifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                      <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-800 text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700 max-w-24 truncate">{user?.name}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                      <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <span className="badge-neutral badge mt-1 text-[10px]">{user?.role}</span>
                      </div>

                      {user?.role !== 'CUSTOMER' && (
                        <Link
                          to={getDashboardLink()}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <LayoutDashboard size={15} />
                          Dashboard
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Settings size={15} />
                        Profile Settings
                      </Link>

                      {user?.role === 'CUSTOMER' && (
                        <Link
                          to="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Package size={15} />
                          My Orders
                        </Link>
                      )}

                      <hr className="my-1 border-slate-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn-primary btn-sm">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="input pl-9 h-9 text-sm rounded-full"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              {link.label}
            </Link>
          ))}
          <Link to="/shop" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-700 hover:bg-green-50 rounded-lg">Shop</Link>
          <Link to="/deals" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-700 hover:bg-green-50 rounded-lg">Deals</Link>
          <Link to="/sellers" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-700 hover:bg-green-50 rounded-lg">Sellers</Link>
          <Link to="/for-you" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-slate-700 hover:bg-green-50 rounded-lg">For You</Link>
          {isAuthenticated ? (
            <>
              {user?.role === 'CUSTOMER' && (
                <Link to="/cart" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                  <ShoppingCart size={16} /> Cart {totalItems > 0 && `(${totalItems})`}
                </Link>
              )}
              {user?.role === 'CUSTOMER' && (
                <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                  <Heart size={16} /> Wishlist
                </Link>
              )}
              <Link to="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                <Bell size={16} /> Notifications
              </Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                <User size={16} /> Profile
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary btn-sm flex-1 justify-center">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary btn-sm flex-1 justify-center">Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
