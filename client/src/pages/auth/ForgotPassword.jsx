import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { STATIC_IMAGES } from '../../data/staticImages';
import { validateForgotPasswordForm, isValidEmail } from '../../utils/validation';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { isDark } = useTheme();

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleBlur = () => {
    if (email && !isValidEmail(email)) {
      setError('Please enter a valid email address');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors } = validateForgotPasswordForm(email);
    if (!isValid) {
      setError(errors.email);
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSuccess(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
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
          <h2 className={`text-2xl font-serif mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Reset Password</h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Enter your email to receive a reset link</p>
        </div>
        
        {success ? (
          <div className="text-center">
            <div className={`p-4 rounded-lg mb-6 text-sm border ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              A password reset link has been sent to <strong>{email}</strong>. Please check your inbox.
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full">Return to Login</Button>
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <Input 
              label="Email Address" 
              type="email" 
              required 
              placeholder="e.g., your.email@example.com" 
              value={email} 
              onChange={handleChange}
              onBlur={handleBlur}
              error={error}
            />
            <Button type="submit" className="w-full shadow-gold" isLoading={loading}>Send Reset Link</Button>
            <div className="text-center text-sm">
              <Link to="/login" className="text-gold-500 hover:underline">Back to Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
