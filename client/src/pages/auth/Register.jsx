import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { STATIC_IMAGES } from '../../data/staticImages';
import { validateRegisterForm, isValidEmail } from '../../utils/validation';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', confirmPassword: '', terms: false 
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
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
    if (field === 'email' && formData.email) {
      if (!isValidEmail(formData.email)) {
        setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      }
    }
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

    const { isValid, errors: validationErrors } = validateRegisterForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
      navigate(`/verify-otp?email=${encodeURIComponent(formData.email.trim())}`, {
        state: { email: formData.email.trim() }
      });
    } catch (error) {
      console.error(error);
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
          <h2 className={`text-2xl font-serif mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Create Account</h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Join Coinomart today</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Input 
            label="Full Name" 
            name="name"
            type="text" 
            required 
            placeholder="e.g., Vikramaditya Sharma" 
            value={formData.name} 
            onChange={handleChange}
            onBlur={() => handleBlur('name')}
            error={errors.name}
          />

          <Input 
            label="Email Address" 
            name="email"
            type="email" 
            required 
            placeholder="e.g., vikram@example.com" 
            value={formData.email} 
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            error={errors.email}
          />

          <div className="relative">
            <Input 
              label="Password" 
              name="password"
              type={showPassword ? 'text' : 'password'} 
              required 
              placeholder="Create a password (min 6 characters)" 
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
              label="Confirm Password" 
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'} 
              required 
              placeholder="Re-enter your password" 
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

          <div>
            <div className="flex items-center mt-3">
              <input 
                id="terms" 
                name="terms" 
                type="checkbox" 
                checked={formData.terms} 
                onChange={handleChange}
                className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded accent-gold-500 cursor-pointer" 
              />
              <label htmlFor="terms" className={`ml-2 block text-xs cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                I agree to the Terms of Service and Privacy Policy <span className="text-red-500 font-bold">*</span>
              </label>
            </div>
            {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms}</p>}
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
