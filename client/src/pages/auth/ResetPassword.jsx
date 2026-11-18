import { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { STATIC_IMAGES } from '../../data/staticImages';
import toast from 'react-hot-toast';
import { validateResetPasswordForm } from '../../utils/validation';
import { FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const ResetPassword = () => {
  const { token: paramToken } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const queryParams = new URLSearchParams(location.search);
  const token = paramToken || queryParams.get('token') || '';

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (field) => {
    if (field === 'password' && formData.password) {
      if (formData.password.length < 6) {
        setErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }));
      }
    }
    if (field === 'confirmPassword' && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Missing password reset token. Please request a new reset link.');
      return;
    }

    const { isValid, errors: validationErrors } = validateResetPasswordForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, formData.password);
      setIsSuccess(true);
      toast.success('Password reset successfully');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reset password. Link may have expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8 transition-colors ${
      isDark ? 'bg-dark-900' : 'bg-[#FAF8F5]'
    }`}>
      <div className={`max-w-md w-full p-5 sm:p-8 border rounded-xl shadow-xl ${
        isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
      }`}>
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center mb-4 group">
            <img 
              src={STATIC_IMAGES.logo.main} 
              alt="Coinomart" 
              className="h-16 w-auto max-w-[200px] object-contain rounded transition-transform group-hover:scale-105" 
            />
          </Link>
          <h2 className={`text-2xl font-serif mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Set New Password</h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Please enter your new password below</p>
        </div>

        {!token ? (
          <div className="text-center">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm mb-6 flex items-start gap-2">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-semibold">Invalid Reset Link</p>
                <p className="text-xs mt-1">No security reset token was found in this link. Please request a new password reset.</p>
              </div>
            </div>
            <Link to="/forgot-password">
              <Button className="w-full">Request New Reset Link</Button>
            </Link>
          </div>
        ) : isSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <FiCheckCircle className="w-10 h-10" />
            </div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Password Updated!</h3>
            <p className={`text-sm mt-2 mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your password has been securely updated. Redirecting you to sign in...
            </p>
            <Link to="/login">
              <Button className="w-full">Go to Sign In</Button>
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="relative">
              <Input 
                label="New Password" 
                name="password"
                type={showPassword ? 'text' : 'password'} 
                required 
                placeholder="Enter new password (min 6 characters)" 
                value={formData.password} 
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className={`absolute right-3 ${errors.password ? 'top-8' : 'top-9'} text-gray-400 hover:text-gold-500 focus:outline-none transition-colors`}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input 
                label="Confirm New Password" 
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'} 
                required 
                placeholder="Re-enter your new password" 
                value={formData.confirmPassword} 
                onChange={handleChange}
                onBlur={() => handleBlur('confirmPassword')}
                error={errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className={`absolute right-3 ${errors.confirmPassword ? 'top-8' : 'top-9'} text-gray-400 hover:text-gold-500 focus:outline-none transition-colors`}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>

            <Button type="submit" className="w-full shadow-gold" isLoading={loading}>Reset Password</Button>
            
            <div className="text-center text-sm pt-2">
              <Link to="/login" className="text-gold-500 hover:underline">Return to Sign In</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
