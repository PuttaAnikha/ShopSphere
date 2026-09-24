import { PackageX, ShoppingCart, Heart, Bell, Search, FileText, Store } from 'lucide-react';

const icons = {
  products: PackageX,
  cart: ShoppingCart,
  wishlist: Heart,
  notifications: Bell,
  search: Search,
  orders: FileText,
  sellers: Store,
  default: PackageX,
};

const EmptyState = ({ icon = 'default', title, description, action }) => {
  const Icon = icons[icon] || icons.default;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-6 max-w-xs">{description}</p>}
      {action && action}
    </div>
  );
};

export default EmptyState;
