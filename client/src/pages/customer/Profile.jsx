import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import authService from '../../services/authService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, checkUser } = useAuth();
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const addr = user.addresses?.[0] || {};
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        street: addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        zipCode: addr.zipCode || '',
        country: addr.country || 'India'
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateProfile({
        name: formData.name,
        phone: formData.phone,
        addresses: [{
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          isDefault: true
        }]
      });
      await checkUser();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className={`text-3xl font-serif mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>Account Profile</h1>

        <div className={`border rounded-xl p-8 shadow-sm ${cardBg}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className={`text-xl font-serif border-b pb-3 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="Email Address" value={formData.email} disabled className="opacity-60 cursor-not-allowed" />
              <Input label="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>

            <h2 className={`text-xl font-serif border-b pb-3 pt-4 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
              Saved Shipping Address
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input label="Street Address" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} placeholder="House/Flat No., Street, Landmark" />
              </div>
              <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="e.g. Mumbai" />
              <Input label="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="e.g. Maharashtra" />
              <Input label="PIN Code" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} placeholder="e.g. 400001" />
              <Input label="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={loading} className="shadow-gold">Save Changes</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
