import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import settingsService from '../../services/settingsService';
import supportService from '../../services/supportService';
import toast from 'react-hot-toast';
import { validateSupportForm, isValidEmail } from '../../utils/validation';
import { 
  FiMail, FiTruck, FiFileText, FiShield, FiClock, 
  FiHelpCircle, FiSend, FiExternalLink, FiCheckCircle, FiUserCheck, FiStar
} from 'react-icons/fi';

const HelpSupport = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    supportEmail: 'support@coinomart.com',
    contactFormEnabled: true,
    contactFormHeading: 'Get in Touch with Numismatic Support',
    contactFormDescription: 'Have questions about rare coin authenticity, historical provenance, or order tracking? Send us a message below.',
    shippingCharge: 50,
    freeShippingThreshold: 999,
    minDeliveryDays: 3,
    maxDeliveryDays: 7,
    privacyPolicyPdfUrl: ''
  });

  // Support Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    orderId: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getPublicSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load public settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupportAdminClick = () => {
    if (user?.role === 'admin') {
      navigate('/admin/settings');
    } else {
      const formElement = document.getElementById('support-request-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (field) => {
    if (field === 'name' && formData.name) {
      if (formData.name.trim().length < 2) {
        setErrors((prev) => ({ ...prev, name: 'Name must be at least 2 characters' }));
      }
    }
    if (field === 'email' && formData.email) {
      if (!isValidEmail(formData.email)) {
        setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      }
    }
    if (field === 'subject' && formData.subject) {
      if (formData.subject.trim().length < 3) {
        setErrors((prev) => ({ ...prev, subject: 'Subject must be at least 3 characters' }));
      }
    }
    if (field === 'message' && formData.message) {
      if (formData.message.trim().length < 10) {
        setErrors((prev) => ({ ...prev, message: 'Message must be at least 10 characters' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateSupportForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      const res = await supportService.submitInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        orderId: formData.orderId.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });
      setSubmittedSuccess(true);
      toast.success(res.message || 'Support request submitted successfully!');
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        orderId: '',
        subject: '',
        message: ''
      });
      setErrors({});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit support request');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrivacyPolicyClick = () => {
    if (settings.privacyPolicyPdfUrl) {
      window.open(settings.privacyPolicyPdfUrl, '_blank');
    } else {
      toast.error('Privacy Policy is currently unavailable. Please contact support.');
    }
  };

  if (loading) return <Loader fullScreen />;

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';
  const labelClass = `block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const textareaClass = `w-full px-3.5 py-2.5 border rounded-lg shadow-sm sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 ${
    isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  return (
    <div className={`min-h-screen py-8 sm:py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        
        {/* Header with Help & Support Admin Button */}
        <div className={`p-5 sm:p-8 border rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 ${cardBg}`}>
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 bg-gold-500/20 text-gold-400 font-semibold text-xs rounded-full uppercase tracking-wider">
              Customer Experience & Assistance
            </span>
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Help & Support Center
            </h1>
            <p className={`text-xs sm:text-sm max-w-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              We are dedicated to supporting your numismatic collecting journey. Find answers, check shipping policies, or send an inquiry below.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-shrink-0">
            {/* Customer Reviews Button */}
            <Link
              to="/reviews"
              className={`w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl border font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                isDark
                  ? 'border-gold-500/50 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500'
                  : 'border-gold-500 text-gold-600 hover:bg-gold-50 hover:border-gold-600'
              }`}
            >
              <FiStar className="text-lg" />
              Customer Reviews
            </Link>
            {/* Help & Support Admin / Submit Button */}
            <button
              onClick={handleSupportAdminClick}
              type="button"
              className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-dark-950 font-bold text-xs sm:text-sm shadow-gold hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <FiUserCheck className="text-lg" />
              {user?.role === 'admin' ? 'Help & Support Admin' : 'Submit Support Request'}
            </button>
          </div>
        </div>

        {/* Info Grid: Support Email & Shipping Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Technical Support Email */}
          <div className={`p-6 border rounded-2xl shadow-sm space-y-4 flex flex-col justify-between ${cardBg}`}>
            <div>
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 text-gold-500 flex items-center justify-center text-2xl mb-4 border border-gold-500/20">
                <FiMail />
              </div>
              <h2 className={`text-xl font-serif font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Technical Support
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Need direct assistance with an order, authentication certificate, or account inquiry? Email our team anytime.
              </p>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'}`}>
              <div>
                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold block">Official Support Email</span>
                <a href={`mailto:${settings.supportEmail}`} className="text-sm font-semibold text-gold-400 hover:underline">
                  {settings.supportEmail}
                </a>
              </div>
              <a
                href={`mailto:${settings.supportEmail}`}
                className="p-2.5 rounded-lg bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>

          {/* Card 2: Shipping & Delivery Information */}
          <div className={`p-6 border rounded-2xl shadow-sm space-y-4 flex flex-col justify-between ${cardBg}`}>
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl mb-4 border border-emerald-500/20">
                <FiTruck />
              </div>
              <h2 className={`text-xl font-serif font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Shipping & Delivery Information
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                All coin shipments are fully insured and packed in museum-grade protective capsules.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'}`}>
                <span className="text-gray-500 block font-medium">Standard Shipping</span>
                <strong className="text-sm font-semibold text-gold-400">₹{settings.shippingCharge}</strong>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'}`}>
                <span className="text-gray-500 block font-medium">Free Shipping Above</span>
                <strong className="text-sm font-semibold text-emerald-400">₹{settings.freeShippingThreshold}</strong>
              </div>
              <div className={`col-span-2 p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <FiClock className="text-gold-500 text-base" />
                  <div>
                    <span className="text-gray-500 block text-[11px] font-medium">Estimated Delivery Time</span>
                    <strong className="text-xs font-semibold">{settings.minDeliveryDays}–{settings.maxDeliveryDays} business days</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Policy Documents Section */}
        <div className={`p-6 border rounded-2xl shadow-sm ${cardBg}`}>
          <div className="flex items-center gap-3 mb-6 border-b pb-4 border-dark-700/50">
            <FiShield className="text-2xl text-gold-500" />
            <div>
              <h2 className={`text-lg font-serif font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Important Marketplace Policies
              </h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Review our terms of service, consumer rights, and official documentation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Privacy Policy PDF Button */}
            <button
              onClick={handlePrivacyPolicyClick}
              type="button"
              className={`p-4 rounded-xl border text-left transition-all hover:border-gold-500 group ${
                isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <FiFileText className="text-2xl text-gold-500 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Privacy Policy</h3>
              <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                Official PDF Document <FiExternalLink className="text-[10px]" />
              </p>
            </button>

            {/* Terms & Conditions */}
            <div className={`p-4 rounded-xl border text-left ${isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'}`}>
              <FiShield className="text-2xl text-gold-500 mb-2" />
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Terms of Service</h3>
              <p className="text-[11px] text-gray-500 mt-1">Numismatic Sales Agreement</p>
            </div>

            {/* Shipping Policy */}
            <div className={`p-4 rounded-xl border text-left ${isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'}`}>
              <FiTruck className="text-2xl text-gold-500 mb-2" />
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Shipping Policy</h3>
              <p className="text-[11px] text-gray-500 mt-1">Transit Protection & Insurance</p>
            </div>

            {/* Refund & Cancellation Policy */}
            <div className={`p-4 rounded-xl border text-left ${isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'}`}>
              <FiHelpCircle className="text-2xl text-gold-500 mb-2" />
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Refunds & Returns</h3>
              <p className="text-[11px] text-gray-500 mt-1">Guaranteed Lifetime Authenticity</p>
            </div>
          </div>
        </div>

        {/* Contact Form / Support Request Section */}
        {settings.contactFormEnabled && (
          <div id="support-request-form" className={`p-5 sm:p-8 border rounded-2xl shadow-sm ${cardBg}`}>
            <div className="mb-6 border-b pb-4 border-dark-700/50">
              <h2 className={`text-xl sm:text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {settings.contactFormHeading || 'Get in Touch with Numismatic Support'}
              </h2>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {settings.contactFormDescription || 'Have questions about rare coin authenticity, historical provenance, or order tracking? Send us a message below.'}
              </p>
            </div>

            {submittedSuccess ? (
              <div className={`p-6 sm:p-8 rounded-xl border text-center space-y-4 ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <FiCheckCircle className="mx-auto text-4xl sm:text-5xl text-emerald-500" />
                <h3 className="text-lg sm:text-xl font-serif font-bold">Request Submitted Successfully!</h3>
                <p className="text-xs sm:text-sm max-w-md mx-auto">
                  Your support request has been submitted successfully. Our support team will review your inquiry and get back to you soon.
                </p>
                <Button onClick={() => setSubmittedSuccess(false)} variant="outline" className="mt-4 w-full sm:w-auto">
                  Send Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <Input
                    label="Full Name"
                    name="name"
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

                  <Input
                    label="Order ID (Optional)"
                    name="orderId"
                    placeholder="e.g., ORD-2026-9482 or leave blank"
                    value={formData.orderId}
                    onChange={handleChange}
                  />

                  <Input
                    label="Subject"
                    name="subject"
                    required
                    placeholder="e.g., Question about 1862 Queen Victoria Coin"
                    value={formData.subject}
                    onChange={handleChange}
                    onBlur={() => handleBlur('subject')}
                    error={errors.subject}
                  />

                  <div className="md:col-span-2">
                    <label className={labelClass}>Message <span className="text-red-500 font-bold">*</span></label>
                    <textarea
                      rows="5"
                      name="message"
                      required
                      className={`${textareaClass} ${errors.message ? 'border-red-500' : ''}`}
                      placeholder="Please describe your question or support request in detail..."
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={() => handleBlur('message')}
                    ></textarea>
                    {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end pt-2">
                  <Button type="submit" isLoading={submitting} className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-gold text-sm sm:text-base px-8 py-3">
                    <FiSend /> Submit Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpSupport;
