import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { SectionLoader } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { Tag, Plus, Edit2, Trash2, Search, Image as ImageIcon } from 'lucide-react';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [formData, setFormData] = useState({ name: '', description: '', image: '', status: 'ACTIVE' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCategories();
      if (res.success) {
        setCategories(res.data.categories || res.data || []);
      }
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', image: '', status: 'ACTIVE' });
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      status: cat.status || 'ACTIVE'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        const res = await adminService.updateCategory(editingCategory._id, formData);
        if (res.success) {
          toast.success('Category updated successfully');
        }
      } else {
        const res = await adminService.createCategory(formData);
        if (res.success) {
          toast.success('Category created successfully');
        }
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      const res = await adminService.deleteCategory(confirmDelete.id);
      if (res.success) {
        toast.success('Category deleted successfully');
        setConfirmDelete({ open: false, id: null });
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold">Categories</h1>
          <p className="text-xs text-slate-500">Organize and classify products across the marketplace</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 shadow-sm max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-xs"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="card shadow-sm overflow-hidden">
        {loading ? (
          <SectionLoader height="min-h-[40vh]" />
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No categories found. Create your first category above!
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <Tag size={16} />
                        </div>
                        <span className="font-semibold text-slate-900 text-xs">{c.name}</span>
                      </div>
                    </td>
                    <td className="text-xs font-mono text-slate-500">{c.slug || '-'}</td>
                    <td className="text-xs text-slate-500 max-w-xs truncate">
                      {c.description || 'No description provided'}
                    </td>
                    <td>
                      <StatusBadge status={c.status || 'ACTIVE'} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ open: true, id: c._id })}
                          className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingCategory ? 'Edit Category' : 'Create New Category'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Category Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Consumer Electronics"
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of items in this category"
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Image URL (Optional)</label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/category.jpg"
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary btn-sm"
              >
                {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete.open}
        title="Delete Category"
        message="Are you sure you want to delete this category? Products linked to this category may be affected."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </div>
  );
};

export default AdminCategories;
