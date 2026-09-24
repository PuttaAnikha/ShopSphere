import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { ScrollText } from 'lucide-react';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  useEffect(() => { adminService.getAuditLogs({ limit: 50 }).then((res) => { if (res.success) setLogs(res.data.items || []); }).catch((error) => toast.error(error.response?.data?.message || 'Failed to load audit logs')).finally(() => setLoading(false)); }, [toast]);
  if (loading) return <SectionLoader height="min-h-[50vh]" />;
  return <div className="space-y-6"><div><h1 className="page-title">Audit logs</h1><p className="text-sm text-slate-500 mt-1">A record of important marketplace actions.</p></div><div className="card overflow-hidden">{logs.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No audit activity recorded yet.</p> : <div className="table-container border-0 rounded-none"><table className="table"><thead><tr><th>User</th><th>Role</th><th>Action</th><th>Entity</th><th>Date</th></tr></thead><tbody>{logs.map((log) => <tr key={log._id}><td className="text-xs font-semibold">{log.userId?.name || 'System'}</td><td className="text-xs">{log.role}</td><td className="text-xs">{log.action}</td><td className="text-xs">{log.entityType}</td><td className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>}</div><div className="flex items-center gap-2 text-xs text-slate-500"><ScrollText size={15} /> Changes are retained by the platform audit service.</div></div>;
};
export default AdminAuditLogs;
