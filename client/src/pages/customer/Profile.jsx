import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, checkUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      const defaultAddr = user.addresses?.[0] || {};
      setAddressData({
        street: defaultAddr.street || '',
        city: defaultAddr.city || '',
        state: defaultAddr.state || '',
        zipCode: defaultAddr.zipCode || '',
        country: defaultAddr.country || 'India',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: profileData.name,
        phone: profileData.phone,
        addresses: [
          {
            ...addressData,
            isDefault: true,
          },
        ],
      };
      await authService.updateProfile(payload);
      toast.success('Profile and default address saved');
      await checkUser();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif text-[#1a1a1a] mb-8">My Profile</h1>
      
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden mb-8">
        <div className="px-6 py-4 bg-[#FAFAF7] border-b border-gray-200">
          <h2 className="text-xl font-serif text-[#1a1a1a]">Personal Information & Address</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                placeholder="e.g., Vikramaditya Sharma"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              />
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="your.email@example.com"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled
              />
              <Input
                label="Phone Number"
                required
                placeholder="e.g., +91 98765 43210"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-base font-serif text-[#1a1a1a] mb-3">Saved Shipping Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Street Address"
                  placeholder="e.g., Flat 402, Heritage Heights, MG Road"
                  className="md:col-span-2"
                  value={addressData.street}
                  onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                />
                <Input
                  label="City"
                  placeholder="e.g., Mumbai"
                  value={addressData.city}
                  onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                />
                <Input
                  label="State"
                  placeholder="e.g., Maharashtra"
                  value={addressData.state}
                  onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                />
                <Input
                  label="PIN Code"
                  placeholder="e.g., 400001"
                  value={addressData.zipCode}
                  onChange={(e) => setAddressData({ ...addressData, zipCode: e.target.value })}
                />
                <Input
                  label="Country"
                  placeholder="e.g., India"
                  value={addressData.country}
                  onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">* Email address cannot be changed</p>
            
            <Button type="submit" isLoading={loading}>Save Profile & Address</Button>
          </form>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="px-6 py-4 bg-[#FAFAF7] border-b border-gray-200">
          <h2 className="text-xl font-serif text-[#1a1a1a]">Change Password</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type="password"
              required
              placeholder="Enter current password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            />
            <Input
              label="New Password"
              type="password"
              required
              placeholder="Enter new password (min 6 chars)"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            />
            <Input
              label="Confirm New Password"
              type="password"
              required
              placeholder="Re-enter new password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            />
            
            <Button type="submit" isLoading={passwordLoading}>Change Password</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
