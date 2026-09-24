import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, UserCheck, UserX, Shield, Filter } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const { toast } = useToast();

  const debouncedSearch = useDebounce(search, 400);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (role) params.role = role;
      if (status) params.status = status;

      const res = await adminService.getUsers(params);
      if (res.success) {
        setUsers(res.data.items || res.data.users || []);
        setTotalPages(res.data.pagination?.totalPages || res.data.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch, role, status]);

  const handleStatusChange = async (userId, newStatus) => {
    try {
      setUpdatingId(userId);
      const res = await adminService.updateUserStatus(userId, newStatus);
      if (res.success) {
        toast.success(`User status updated to ${newStatus}`);
        setUsers(users.map((u) => (u._id === userId ? { ...u, status: newStatus } : u)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="page-title text-2xl font-bold">Manage Users</h1>
        <p className="text-xs text-slate-500">Monitor and manage marketplace buyer, seller, and staff accounts</p>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-9 text-xs"
          />
        </div>

        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="input sm:w-44 text-xs"
        >
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="SELLER">Seller</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPPORT_AGENT">Support Agent</option>
          <option value="DELIVERY_PARTNER">Delivery Partner</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="input sm:w-36 text-xs"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card shadow-sm overflow-hidden">
        {loading ? (
          <SectionLoader height="min-h-[40vh]" />
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No users found matching current filters.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div>
                        <p className="font-semibold text-slate-900 text-xs">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral text-[10px] font-semibold">{u.role}</span>
                    </td>
                    <td>
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          disabled={updatingId === u._id}
                          onClick={() =>
                            handleStatusChange(u._id, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')
                          }
                          className={`btn-sm text-xs font-semibold rounded-lg px-2.5 py-1 ${
                            u.status === 'ACTIVE'
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {updatingId === u._id ? 'Updating...' : u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
