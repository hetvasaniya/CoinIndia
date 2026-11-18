import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import { STATIC_IMAGES } from '../../data/staticImages';
import { FiMail, FiShield, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendVerification } = useAuth();
  const { isDark } = useTheme();

  // Extract email from query param or router state
  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get('email') || location.state?.email || '';

  const [email] = useState(initialEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState('');

  const inputRefs = useRef([]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index, value) => {
    setError('');
    // Allow only numeric digits
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;

    const newOtp = [...otp];

    if (cleaned.length > 1) {
      // Handle paste of full 6-digit code
      const pastedDigits = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedDigits[i] || '';
      }
      setOtp(newOtp);
      const nextFocus = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto-advance to next box
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move back and clear previous box
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = ['', '', '', '', '', ''];
    pastedData.split('').forEach((char, idx) => {
      if (idx < 6) newOtp[idx] = char;
    });
    setOtp(newOtp);

    const nextFocus = Math.min(pastedData.length, 5);
    inputRefs.current[nextFocus]?.focus();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join('');

    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await verifyOtp({
        email: email.trim().toLowerCase(),
        otp: fullOtp,
      });

      if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired verification code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email.trim()) return;

    setResending(true);
    setError('');

    try {
      await resendVerification(email.trim().toLowerCase());
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend verification code';
      setError(msg);
      if (err.response?.data?.cooldown) {
        setCooldown(err.response.data.cooldown);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8 transition-colors ${
      isDark ? 'bg-dark-900' : 'bg-[#FAF8F5]'
    }`}>
      <div className={`max-w-md w-full p-4 sm:p-8 border rounded-xl shadow-xl ${
        isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
      }`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center mb-4 group">
            <img 
              src={STATIC_IMAGES.logo.main} 
              alt="Coinomart" 
              className="h-16 w-auto max-w-[200px] object-contain rounded transition-transform group-hover:scale-105" 
            />
          </Link>
          
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500">
            <FiShield className="w-6 h-6" />
          </div>

          <h2 className={`text-2xl font-serif mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Enter Verification Code
          </h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            We've sent a 6-digit verification code to
          </p>
          <div className="mt-1 flex items-center justify-center gap-1 font-medium text-gold-500 text-sm">
            <FiMail className="w-4 h-4 inline" />
            <span>{email || 'your email'}</span>
          </div>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 6-digit OTP Inputs */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-3 text-center ${
              isDark ? 'text-gray-400' : 'text-gray-700'
            }`}>
              6-Digit Security Code
            </label>
            
            <div className="flex justify-between items-center gap-1.5 min-[360px]:gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-9 h-12 min-[360px]:w-10 min-[360px]:h-12 min-[380px]:w-11 min-[380px]:h-13 sm:w-12 sm:h-14 text-center text-lg min-[360px]:text-xl sm:text-2xl font-bold font-mono rounded-lg border transition-all duration-200 outline-none ${
                    error
                      ? 'border-red-500 bg-red-50/10 text-red-500 focus:border-red-500'
                      : digit
                      ? isDark
                        ? 'border-gold-500 bg-dark-700 text-white'
                        : 'border-gold-500 bg-gold-50/30 text-gray-900'
                      : isDark
                      ? 'border-dark-600 bg-dark-700 text-white focus:border-gold-500'
                      : 'border-gray-300 bg-white text-gray-900 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                  }`}
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-500 text-center font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full shadow-gold"
            isLoading={loading}
            disabled={otp.join('').length !== 6}
          >
            Verify & Activate Account
          </Button>

          {/* Resend Section with Cooldown */}
          <div className="text-center pt-2 border-t border-gray-100 dark:border-dark-700">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Didn't receive the email code?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                cooldown > 0 || resending
                  ? isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                  : 'text-gold-500 hover:text-gold-600 hover:underline cursor-pointer'
              }`}
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              {resending
                ? 'Sending code...'
                : cooldown > 0
                ? `Resend Code in ${cooldown}s`
                : 'Resend Verification Code'}
            </button>
          </div>

          {/* Back to login link */}
          <div className="text-center pt-1">
            <Link
              to="/login"
              className={`inline-flex items-center gap-1 text-xs font-medium ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
};

export default VerifyOtp;
