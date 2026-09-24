import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';
import StatusBadge from '../components/common/StatusBadge';
import { User, Mail, Phone, MapPin, Lock, Shield, Check, Save } from 'lucide-react';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('details');

  // Profile details state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      postalCode: user?.address?.postalCode || '',
      country: user?.address?.country || 'India',
    }
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      setUpdatingProfile(true);
      const res = await authService.updateProfile({
        name: profileData.name.trim(),
        phone: profileData.phone.trim(),
        address: profileData.address,
      });

      if (res.success) {
        toast.success('Profile updated successfully');
        // Update stored user
        const updated = res.data?.user || { ...user, ...profileData };
        localStorage.setItem('shopsphere_user', JSON.stringify(updated));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setUpdatingPassword(true);
      const res = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Profile Summary Card */}
      <div className="card p-6 mb-8 bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-white text-2xl font-bold border border-white/20">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold">{user?.name}</h1>
              <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1 flex items-center gap-2">
              <Mail size={13} /> {user?.email}
              {user?.phone && (
                <>
                  <span>•</span>
                  <Phone size={13} /> {user.phone}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'details'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User size={16} /> Personal Details & Address
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Lock size={16} /> Security & Password
        </button>
      </div>

      {/* Tab 1: Personal Details */}
      {activeTab === 'details' && (
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="card p-6 shadow-sm">
            <h2 className="section-title text-base font-semibold mb-4 flex items-center gap-2">
              <User size={18} className="text-indigo-600" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="form-group sm:col-span-2">
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card p-6 shadow-sm">
            <h2 className="section-title text-base font-semibold mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-indigo-600" /> Default Shipping Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 form-group">
                <label className="label">Street Address</label>
                <input
                  type="text"
                  placeholder="Street / Apartment / Landmark"
                  value={profileData.address.street}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      address: { ...profileData.address, street: e.target.value }
                    })
                  }
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={profileData.address.city}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      address: { ...profileData.address, city: e.target.value }
                    })
                  }
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label">State</label>
                <input
                  type="text"
                  placeholder="State"
                  value={profileData.address.state}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      address: { ...profileData.address, state: e.target.value }
                    })
                  }
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label">Postal / ZIP Code</label>
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={profileData.address.postalCode}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      address: { ...profileData.address, postalCode: e.target.value }
                    })
                  }
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label">Country</label>
                <input
                  type="text"
                  placeholder="Country"
                  value={profileData.address.country}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      address: { ...profileData.address, country: e.target.value }
                    })
                  }
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatingProfile}
              className="btn-primary flex items-center gap-2 px-6 py-2.5"
            >
              <Save size={16} />
              {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl">
          <div className="card p-6 shadow-sm space-y-4">
            <h2 className="section-title text-base font-semibold mb-2 flex items-center gap-2">
              <Lock size={18} className="text-indigo-600" /> Update Password
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Ensure your account is using a long, random password to stay secure.
            </p>

            <div className="form-group">
              <label className="label">Current Password *</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="btn-primary mt-4 flex items-center gap-2"
            >
              <Shield size={16} />
              {updatingPassword ? 'Changing Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfilePage;
