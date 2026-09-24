import { useToast } from '../../context/ToastContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColors = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

const Toast = ({ toast: t }) => {
  const { removeToast } = useToast();
  const Icon = icons[t.type] || Info;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg min-w-72 max-w-sm ${colors[t.type]} animate-in slide-in-from-right duration-300`}>
      <Icon size={18} className={`mt-0.5 flex-shrink-0 ${iconColors[t.type]}`} />
      <p className="flex-1 text-sm font-medium">{t.message}</p>
      <button onClick={() => removeToast(t.id)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
};

export default ToastContainer;
