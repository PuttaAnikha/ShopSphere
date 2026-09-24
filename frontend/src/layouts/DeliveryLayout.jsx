import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Truck, LayoutDashboard, Bell, Menu, X, LogOut, ChevronRight } from 'lucide-react';

const DeliveryLayout = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isActive = (path) => location.pathname.startsWith(path);
  const items = [{ to: '/delivery/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { to: '/notifications', label: 'Notifications', icon: Bell }];
  const handleLogout = async () => { await logout(); toast.success('Logged out successfully'); navigate('/login'); };
  const Sidebar = () => <div className="flex flex-col h-full"><div className="px-6 py-5 border-b border-slate-100"><Link to="/delivery/dashboard" className="flex items-center gap-2"><div className="w-9 h-9 rounded-lg bg-green-700 flex items-center justify-center"><Truck size={18} className="text-white" /></div><div><p className="font-bold text-slate-900 text-sm">ShopSphere</p><p className="text-xs text-slate-500">Delivery Portal</p></div></Link></div><nav className="flex-1 px-3 py-4 space-y-1">{items.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setOpen(false)} className={isActive(to) ? 'sidebar-link-active' : 'sidebar-link-inactive'}><Icon size={18} /><span>{label}</span>{isActive(to) && <ChevronRight size={14} className="ml-auto" />}</Link>)}</nav><div className="px-3 py-4 border-t border-slate-100"><p className="px-3 text-sm font-semibold text-slate-900 truncate">{user?.name}</p><p className="px-3 text-xs text-slate-500 mb-3">Delivery Partner</p><button onClick={handleLogout} className="sidebar-link-inactive w-full text-red-600"><LogOut size={18} />Logout</button></div></div>;
  return <div className="flex h-screen bg-stone-50 overflow-hidden"><aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200"><Sidebar /></aside>{open && <div className="lg:hidden fixed inset-0 z-50"><div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} /><div className="relative w-64 h-full bg-white"><button className="absolute top-4 right-4" onClick={() => setOpen(false)}><X size={20} /></button><Sidebar /></div></div>}<div className="flex-1 flex flex-col overflow-hidden"><div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200"><button onClick={() => setOpen(true)}><Menu size={20} /></button><span className="font-semibold">Delivery Portal</span></div><main className="flex-1 overflow-y-auto p-6"><Outlet /></main></div></div>;
};

export default DeliveryLayout;
