import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import authService from '../../services/authService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import { validateProfileForm, isValidPhone, isValidPincode } from '../../utils/validation';

const Profile = () => {
  const { user, updateUser } = useAuth();
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
  const [errors, setErrors] = useState({});
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (field) => {
    if (field === 'name' && formData.name) {
      if (formData.name.trim().length < 2) {
        setErrors((prev) => ({ ...prev, name: 'Full name must be at least 2 characters' }));
      }
    }
    if (field === 'phone' && formData.phone && formData.phone.trim()) {
      if (!isValidPhone(formData.phone)) {
        setErrors((prev) => ({ ...prev, phone: 'Please enter a valid phone number (e.g. 9876543210)' }));
      }
    }
    if (field === 'zipCode' && formData.zipCode && formData.zipCode.trim()) {
      if (!isValidPincode(formData.zipCode)) {
        setErrors((prev) => ({ ...prev, zipCode: 'Please enter a valid 6-digit PIN code' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateProfileForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        addresses: [{
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
          country: formData.country.trim(),
          isDefault: true
        }]
      });
      if (updatedUser) {
        updateUser(updatedUser);
      }
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen py-6 sm:py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <h1 className={`text-2xl sm:text-3xl font-serif font-bold mb-6 sm:mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Account Profile
        </h1>

        <div className={`border rounded-2xl p-4 sm:p-8 shadow-xs ${cardBg}`}>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            
            <h2 className={`text-base sm:text-lg font-serif font-bold border-b pb-3 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
              Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Input 
                label="Full Name" 
                name="name"
                value={formData.name} 
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                error={errors.name}
                required 
              />
              <Input 
                label="Email Address" 
                value={formData.email} 
                disabled 
                className="opacity-60 cursor-not-allowed" 
              />
              <div className="sm:col-span-2">
                <Input 
                  label="Phone Number" 
                  name="phone"
                  value={formData.phone} 
                  onChange={handleChange}
                  onBlur={() => handleBlur('phone')}
                  error={errors.phone}
                  placeholder="+91 98765 43210" 
                />
              </div>
            </div>

            <h2 className={`text-base sm:text-lg font-serif font-bold border-b pb-3 pt-2 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
              Saved Shipping Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="sm:col-span-2">
                <Input 
                  label="Street Address" 
                  name="street"
                  value={formData.street} 
                  onChange={handleChange}
                  placeholder="House/Flat No., Street, Landmark" 
                />
              </div>
              <Input 
                label="City" 
                name="city"
                value={formData.city} 
                onChange={handleChange}
                placeholder="e.g. Mumbai" 
              />
              <Input 
                label="State" 
                name="state"
                value={formData.state} 
                onChange={handleChange}
                placeholder="e.g. Maharashtra" 
              />
              <Input 
                label="PIN Code" 
                name="zipCode"
                value={formData.zipCode} 
                onChange={handleChange}
                onBlur={() => handleBlur('zipCode')}
                error={errors.zipCode}
                placeholder="e.g. 400001" 
              />
              <Input 
                label="Country" 
                name="country"
                value={formData.country} 
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end pt-4 border-t border-gray-500/20">
              <Button type="submit" isLoading={loading} className="w-full sm:w-auto shadow-gold">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
