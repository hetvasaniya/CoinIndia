import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { isDark } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
      toast.success('Reset link sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors ${
      isDark ? 'bg-dark-900' : 'bg-[#FAF8F5]'
    }`}>
      <div className={`max-w-md w-full p-8 border rounded-xl shadow-xl ${
        isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
      }`}>
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-serif tracking-wider inline-block mb-4">
            <span className={isDark ? 'text-white' : 'text-gray-900'}>Coin</span>
            <span className="text-gold-500">India</span>
          </Link>
          <h2 className={`text-2xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Reset Password</h2>
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
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input label="Email Address" type="email" required placeholder="e.g., your.email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
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
