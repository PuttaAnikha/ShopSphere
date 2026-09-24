import { Link } from 'react-router-dom';
import { Store, Mail, Phone, MapPin, Globe } from 'lucide-react';

const Footer = () => (
  <footer className="bg-green-950 text-green-50/80 mt-16">
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
              <Store size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-white">Shop<span className="text-yellow-300">Sphere</span></span>
          </div>
          <p className="text-sm text-green-100/70 leading-relaxed">
            Multi-vendor marketplace connecting buyers and sellers across India.
          </p>
          <div className="flex gap-3 mt-4 text-green-100/60">
            <a href="#" className="p-2 bg-green-900 rounded-lg hover:bg-green-700 hover:text-white transition-colors" aria-label="Website">
              <Globe size={16} />
            </a>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="text-white font-semibold mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
            <li><Link to="/products?hasDiscount=true" className="hover:text-white transition-colors">Deals & Offers</Link></li>
            <li><Link to="/products?sort=newest" className="hover:text-white transition-colors">New Arrivals</Link></li>
            <li><Link to="/products?sort=rating" className="hover:text-white transition-colors">Top Rated</Link></li>
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 className="text-white font-semibold mb-4">Account</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
            <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
            <li><Link to="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
            <li><Link to="/support" className="hover:text-white transition-colors">Support</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><Mail size={14} /> support@shopsphere.com</li>
            <li className="flex items-center gap-2"><Phone size={14} /> +91 98765 43210</li>
            <li className="flex items-center gap-2"><MapPin size={14} /> Mumbai, India</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} ShopSphere. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Seller Agreement</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
