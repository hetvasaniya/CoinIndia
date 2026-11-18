import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { STATIC_IMAGES } from '../../data/staticImages';
import { validateLoginForm, isValidEmail } from '../../utils/validation';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (unverifiedEmail) {
      setUnverifiedEmail(null);
    }
  };

  const handleBlur = (field) => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateLoginForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setUnverifiedEmail(null);
    try {
      const user = await login(formData);
      if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (error) {
      if (error.response?.data?.isEmailVerified === false) {
        setUnverifiedEmail(error.response.data.email || formData.email);
      }
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
          <h2 className={`text-2xl font-serif mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome Back</h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Please sign in to your account</p>
        </div>

        {unverifiedEmail && (
          <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm">
            <div className="flex items-start gap-2">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Email Not Verified</p>
                <p className="mt-1 text-xs opacity-90">
                  Your email address requires verification before you can log in.
                </p>
                <div className="mt-3">
                  <Link
                    to={`/verify-otp?email=${encodeURIComponent(unverifiedEmail)}`}
                    state={{ email: unverifiedEmail }}
                    className="inline-block bg-gold-500 hover:bg-gold-600 text-dark-900 font-semibold text-xs px-3 py-1.5 rounded transition-colors"
                  >
                    Enter Verification Code
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="e.g., admin@coinomart.com or user@example.com"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            error={errors.email}
          />
          
          <div>
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password (min 6 characters)"
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
            <div className="flex justify-end -mt-2">
              <Link to="/forgot-password" className="text-xs text-gold-500 hover:underline">
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full shadow-gold" isLoading={loading}>
            Sign In
          </Button>
        </form>

        <div className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Don't have an account?{' '}
          <Link to="/register" className="text-gold-500 hover:underline font-medium">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
