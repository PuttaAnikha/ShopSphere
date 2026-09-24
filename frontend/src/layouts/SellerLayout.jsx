import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  LayoutDashboard, Package, PlusSquare, Boxes,
  ShoppingBag, BarChart3, Store, Bell, Menu, X,
  LogOut, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/seller/products', icon: Package, label: 'Products' },
  { to: '/seller/products/create', icon: PlusSquare, label: 'Add Product' },
  { to: '/seller/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/seller/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/seller/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/seller/profile', icon: Store, label: 'Store Profile' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const SellerLayout = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/seller/products' && location.pathname === '/seller/products') return true;
    if (path !== '/seller/products') return location.pathname.startsWith(path);
    return false;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <Link to="/seller/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Store size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">ShopSphere</p>
            <p className="text-xs text-slate-500">Seller Portal</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={isActive(to) ? 'sidebar-link-active' : 'sidebar-link-inactive'}
          >
            <Icon size={18} />
            <span>{label}</span>
            {isActive(to) && <ChevronRight size={14} className="ml-auto" />}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-700 text-xs font-bold">{user?.name?.[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">Seller</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link-inactive w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-white flex flex-col shadow-2xl">
            <button className="absolute top-4 right-4 p-1" onClick={() => setSidebarOpen(false)}>
              <X size={20} className="text-slate-600" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100">
            <Menu size={20} className="text-slate-600" />
          </button>
          <span className="font-semibold text-slate-800">Seller Portal</span>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
