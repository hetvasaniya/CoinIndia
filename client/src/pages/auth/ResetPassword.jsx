import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, formData.password);
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-sm shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-[#1a1a1a]">Set New Password</h2>
          <p className="mt-2 text-sm text-gray-600">Please enter your new password below</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="New Password"
            type="password"
            required
            placeholder="Enter new password (min 6 characters)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          
          <Input
            label="Confirm New Password"
            type="password"
            required
            placeholder="Re-enter your new password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />
          
          <Button type="submit" className="w-full" isLoading={loading}>
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
