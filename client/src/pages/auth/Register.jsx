import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      navigate('/');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-sm shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-[#1a1a1a]">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">Join Coin India today</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            required
            placeholder="e.g., Vikramaditya Sharma"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g., vikram@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          
          <Input
            label="Password"
            type="password"
            required
            placeholder="Create a strong password (min 6 characters)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <Input
            label="Confirm Password"
            type="password"
            required
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />

          <div className="flex items-center mt-4">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-[#B8860B] focus:ring-[#B8860B] border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-xs text-gray-900">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>

          <Button type="submit" className="w-full mt-6" isLoading={loading}>
            Register
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-[#B8860B] hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
