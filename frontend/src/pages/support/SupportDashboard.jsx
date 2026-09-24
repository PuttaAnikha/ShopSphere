import { useEffect, useState } from 'react';
import supportService from '../../services/supportService';
import StatusBadge from '../../components/common/StatusBadge';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { Headphones, Ticket } from 'lucide-react';

const SupportDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await supportService.getTickets({ limit: 50 });
        if (res.success) setTickets(res.data.items || res.data.tickets || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load support tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [toast]);

  const openCount = tickets.filter((ticket) => ticket.status === 'OPEN').length;
  const activeCount = tickets.filter((ticket) => ['IN_PROGRESS', 'PENDING'].includes(ticket.status)).length;
  const resolvedCount = tickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(ticket.status)).length;

  if (loading) return <SectionLoader height="min-h-[50vh]" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Support workspace</p>
        <h1 className="page-title mt-1">Customer care desk</h1>
        <p className="text-sm text-slate-500 mt-1">Keep every customer conversation moving toward a clear resolution.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          ['Open tickets', openCount, 'text-amber-700 bg-yellow-50'],
          ['In progress', activeCount, 'text-green-800 bg-green-50'],
          ['Resolved', resolvedCount, 'text-slate-700 bg-slate-100']
        ].map(([label, value, color]) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Ticket size={19} /></div>
            <p className="text-xs text-slate-500 mt-4">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2"><Headphones size={18} className="text-green-700" /><h2 className="section-title">Recent tickets</h2></div>
        {tickets.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No support tickets yet.</p> : (
          <div className="table-container border-0 rounded-none"><table className="table"><thead><tr><th>Subject</th><th>Customer</th><th>Priority</th><th>Status</th></tr></thead><tbody>
            {tickets.slice(0, 10).map((ticket) => <tr key={ticket._id}><td className="font-semibold text-xs">{ticket.subject}</td><td className="text-xs">{ticket.customerId?.name || 'Customer'}</td><td className="text-xs">{ticket.priority}</td><td><StatusBadge status={ticket.status} /></td></tr>)}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
};

export default SupportDashboard;
