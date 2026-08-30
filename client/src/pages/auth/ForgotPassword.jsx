import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-sm shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-[#1a1a1a]">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your email to receive a reset link</p>
        </div>
        
        {success ? (
          <div className="text-center">
            <div className="bg-green-50 text-green-800 p-4 rounded-sm mb-6">
              A password reset link has been sent to <strong>{email}</strong>. Please check your inbox.
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full">Return to Login</Button>
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="e.g., your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <Button type="submit" className="w-full" isLoading={loading}>
              Send Reset Link
            </Button>
            
            <div className="text-center text-sm">
              <Link to="/login" className="text-gray-500 hover:text-[#B8860B] transition-colors">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
