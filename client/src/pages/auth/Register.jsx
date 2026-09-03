import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', confirmPassword: '' 
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { isDark } = useTheme();
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
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors ${
      isDark ? 'bg-dark-900' : 'bg-[#FAF8F5]'
    }`}>
      <div className={`max-w-md w-full p-8 border rounded-xl shadow-xl ${
        isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
      }`}>
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center mb-4 group">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold-500/50 shadow-lg bg-dark-800 p-0.5 transition-transform group-hover:scale-105">
              <img 
                src="https://res.cloudinary.com/elitehomes/image/upload/v1788148596/nedeqh3gfpeilb1sgiv7.png" 
                alt="CoinIndia Logo" 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
            <span className="text-2xl font-serif font-bold tracking-wider mt-2">
              <span className={isDark ? 'text-white' : 'text-gray-900'}>Coin</span>
              <span className="text-gold-500">India</span>
            </span>
          </Link>
          <h2 className={`text-2xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Create Account</h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Join Coin India today</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Full Name" type="text" required placeholder="e.g., Vikramaditya Sharma" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Email Address" type="email" required placeholder="e.g., vikram@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <Input label="Password" type="password" required placeholder="Create a strong password (min 6 characters)" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          <Input label="Confirm Password" type="password" required placeholder="Re-enter your password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />

          <div className="flex items-center mt-4">
            <input id="terms" name="terms" type="checkbox" required className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded accent-gold-500" />
            <label htmlFor="terms" className={`ml-2 block text-xs ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>

          <Button type="submit" className="w-full mt-6 shadow-gold" isLoading={loading}>
            Register
          </Button>
        </form>

        <div className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Already have an account?{' '}
          <Link to="/login" className="text-gold-500 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
