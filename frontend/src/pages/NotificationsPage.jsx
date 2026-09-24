import { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';
import { SectionLoader } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { Bell, CheckCheck, Clock, Package, AlertCircle, Sparkles, Tag } from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ limit: 50 });
      if (res.success) {
        setNotifications(res.data.notifications || res.data.items || res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications(
          notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
        toast.success('All marked as read');
      }
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER_DELIVERED':
      case 'ORDER_PLACED':
      case 'ORDER_STATUS_UPDATED':
        return <Package size={18} className="text-indigo-600" />;
      case 'PROMOTION':
      case 'COUPON':
        return <Tag size={18} className="text-amber-500" />;
      case 'SYSTEM':
      case 'DISPUTE':
        return <AlertCircle size={18} className="text-red-500" />;
      default:
        return <Bell size={18} className="text-indigo-600" />;
    }
  };

  if (loading) return <SectionLoader height="min-h-[50vh]" />;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h1 className="page-title text-2xl font-bold flex items-center gap-2">
            <Bell size={24} className="text-indigo-600" /> Notifications
          </h1>
          <p className="text-sm text-slate-500">
            {unreadCount > 0 ? `You have ${unreadCount} unread alerts` : 'All caught up!'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="btn-secondary btn-sm flex items-center gap-1.5"
          >
            <CheckCheck size={14} /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon="bell"
          title="No notifications yet"
          description="We'll notify you about orders, delivery status, and exclusive marketplace offers here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
              className={`card p-4 flex items-start gap-4 transition-all cursor-pointer ${
                !notif.isRead
                  ? 'border-indigo-100 bg-indigo-50/20 hover:bg-indigo-50/40 shadow-sm'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 flex-shrink-0">
                {getNotificationIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`text-sm ${
                      !notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-800'
                    }`}
                  >
                    {notif.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                    <Clock size={11} />
                    {new Date(notif.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
              </div>

              {!notif.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
