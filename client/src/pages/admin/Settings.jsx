import { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { useTheme } from '../../context/ThemeContext';
import settingsService from '../../services/settingsService';
import supportService from '../../services/supportService';
import toast from 'react-hot-toast';
import { 
  FiSun, FiMoon, FiMail, FiTruck, FiFileText, FiMessageSquare, 
  FiSave, FiUploadCloud, FiTrash2, FiExternalLink, FiClock, 
  FiCheckCircle, FiAlertCircle, FiSearch, FiSend, FiRefreshCw
} from 'react-icons/fi';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('support'); // 'support', 'shipping', 'privacy', 'inquiries'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    theme: 'dark',
    supportEmail: 'support@coinomart.com',
    contactFormEnabled: true,
    contactFormHeading: 'Get in Touch with Numismatic Support',
    contactFormDescription: 'Have questions about rare coin authenticity, historical provenance, or order tracking? Send us a message below.',
    shippingCharge: 50,
    freeShippingThreshold: 999,
    minDeliveryDays: 3,
    maxDeliveryDays: 7,
    privacyPolicyPdfUrl: '',
    privacyPolicyUploadedAt: null
  });

  // Privacy Policy File State
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Inquiries State
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('');
  const [inquirySearch, setInquirySearch] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('pending');
  const [updatingInquiry, setUpdatingInquiry] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchInquiries();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getAdminSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async (status = inquiryStatusFilter, search = inquirySearch) => {
    try {
      setInquiriesLoading(true);
      const data = await supportService.getAdminInquiries(status, search);
      setInquiries(data || []);
    } catch (error) {
      toast.error('Failed to load support requests');
    } finally {
      setInquiriesLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    
    // Validation
    if (Number(settings.shippingCharge) < 0) {
      toast.error('Shipping charge cannot be negative');
      return;
    }
    if (Number(settings.freeShippingThreshold) < 0) {
      toast.error('Free shipping threshold cannot be negative');
      return;
    }
    if (Number(settings.minDeliveryDays) < 1) {
      toast.error('Minimum delivery days must be at least 1');
      return;
    }
    if (Number(settings.maxDeliveryDays) < Number(settings.minDeliveryDays)) {
      toast.error('Maximum delivery days cannot be less than minimum delivery days');
      return;
    }

    try {
      setSaving(true);
      const res = await settingsService.updateSettings(settings);
      toast.success(res.message || 'Settings saved successfully!');
      if (res.data) setSettings(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePdfUpload = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      toast.error('Please select a PDF file first');
      return;
    }
    if (!pdfFile.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files (.pdf) are allowed');
      return;
    }

    try {
      setUploadingPdf(true);
      const res = await settingsService.uploadPrivacyPolicy(pdfFile);
      toast.success(res.message || 'Privacy Policy uploaded successfully!');
      setPdfFile(null);
      fetchSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload Privacy Policy');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleDeletePrivacyPolicy = async () => {
    if (!window.confirm('Are you sure you want to remove the Privacy Policy PDF?')) {
      return;
    }
    try {
      await settingsService.deletePrivacyPolicy();
      toast.success('Privacy Policy removed successfully');
      fetchSettings();
    } catch (error) {
      toast.error('Failed to remove Privacy Policy');
    }
  };

  const handleOpenInquiryModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setReplyText(inquiry.adminReply || '');
    setReplyStatus(inquiry.status || 'pending');
  };

  const handleUpdateInquiry = async () => {
    if (!selectedInquiry) return;
    try {
      setUpdatingInquiry(true);
      await supportService.updateInquiry(selectedInquiry._id, {
        status: replyStatus,
        adminReply: replyText
      });
      toast.success('Support inquiry updated successfully');
      setSelectedInquiry(null);
      fetchInquiries();
    } catch (error) {
      toast.error('Failed to update inquiry');
    } finally {
      setUpdatingInquiry(false);
    }
  };

  const handleDeleteInquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer inquiry?')) return;
    try {
      await supportService.deleteInquiry(id);
      toast.success('Inquiry deleted');
      if (selectedInquiry?._id === id) setSelectedInquiry(null);
      fetchInquiries();
    } catch (error) {
      toast.error('Failed to delete inquiry');
    }
  };

  if (loading) return <Loader fullScreen />;

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';
  const labelClass = `block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const inputClass = `w-full px-3.5 py-2.5 border rounded-lg shadow-sm sm:text-sm ${
    isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header & Global Theme Switcher */}
      <div className={`p-6 border rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <h1 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Admin Settings</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage global support settings, contact form, shipping rules, policies, and customer help requests.
          </p>
        </div>

        {/* Global Theme Toggle - Top Right */}
        <button
          onClick={toggleTheme}
          type="button"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all shadow-sm ${
            isDark 
              ? 'bg-dark-700 hover:bg-dark-600 text-amber-400 border-gold-500/30' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
          }`}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? <FiSun className="text-lg text-amber-400" /> : <FiMoon className="text-lg text-indigo-600" />}
          <span>Theme: <strong className="uppercase text-gold-500">{isDark ? 'Dark' : 'Light'}</strong></span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-dark-700/50 pb-2">
        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'support'
              ? 'bg-gold-500 text-dark-900 font-bold shadow-md'
              : isDark ? 'text-gray-400 hover:bg-dark-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FiMail /> Help & Support
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'shipping'
              ? 'bg-gold-500 text-dark-900 font-bold shadow-md'
              : isDark ? 'text-gray-400 hover:bg-dark-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FiTruck /> Shipping & Delivery
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'privacy'
              ? 'bg-gold-500 text-dark-900 font-bold shadow-md'
              : isDark ? 'text-gray-400 hover:bg-dark-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FiFileText /> Privacy Policy PDF
        </button>
        <button
          onClick={() => { setActiveTab('inquiries'); fetchInquiries(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'inquiries'
              ? 'bg-gold-500 text-dark-900 font-bold shadow-md'
              : isDark ? 'text-gray-400 hover:bg-dark-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FiMessageSquare /> Customer Requests
          {inquiries.filter(i => i.status === 'pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {inquiries.filter(i => i.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Help & Support Settings */}
      {activeTab === 'support' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className={`p-6 border rounded-xl shadow-sm space-y-6 ${cardBg}`}>
            <div className={`flex items-center gap-3 border-b pb-3 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <FiMail className="text-2xl text-gold-500" />
              <div>
                <h2 className={`text-lg font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Help & Support Configuration</h2>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Configure client-side technical support email and customer inquiry form.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Technical Support Email"
                  type="email"
                  required
                  placeholder="e.g., support@coinomart.com"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
                <p className="text-xs text-gray-500 -mt-3">This email address will be prominently displayed on the customer Help & Support page.</p>
              </div>

              <div className="md:col-span-2 flex items-center gap-3 p-4 rounded-xl border bg-gold-500/5 border-gold-500/20">
                <input
                  type="checkbox"
                  id="contactFormEnabled"
                  checked={settings.contactFormEnabled}
                  onChange={(e) => setSettings({ ...settings, contactFormEnabled: e.target.checked })}
                  className="w-5 h-5 text-gold-500 focus:ring-gold-500 rounded cursor-pointer accent-gold-500"
                />
                <label htmlFor="contactFormEnabled" className={`text-sm font-medium cursor-pointer ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Enable Customer Contact / Inquiry Form on Client Help & Support Page
                </label>
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Contact Form Heading"
                  placeholder="e.g., Get in Touch with Numismatic Support"
                  value={settings.contactFormHeading}
                  onChange={(e) => setSettings({ ...settings, contactFormHeading: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Contact Form Subtitle / Description</label>
                <textarea
                  rows="3"
                  className={inputClass}
                  placeholder="Describe support guidelines..."
                  value={settings.contactFormDescription}
                  onChange={(e) => setSettings({ ...settings, contactFormDescription: e.target.value })}
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-dark-700/50">
              <Button type="submit" isLoading={saving} className="flex items-center gap-2 shadow-gold">
                <FiSave /> Save Changes
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Shipping & Delivery Settings */}
      {activeTab === 'shipping' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className={`p-6 border rounded-xl shadow-sm space-y-6 ${cardBg}`}>
            <div className={`flex items-center gap-3 border-b pb-3 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <FiTruck className="text-2xl text-gold-500" />
              <div>
                <h2 className={`text-lg font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Shipping & Delivery Configurations</h2>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Set website-wide shipping fees, free shipping rules, and delivery estimated days.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Standard Shipping Charge (₹ INR)"
                type="number"
                min="0"
                required
                placeholder="e.g., 50"
                value={settings.shippingCharge}
                onChange={(e) => setSettings({ ...settings, shippingCharge: e.target.value })}
              />

              <Input
                label="Free Shipping Order Threshold (₹ INR)"
                type="number"
                min="0"
                required
                placeholder="e.g., 999"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: e.target.value })}
              />

              <Input
                label="Minimum Delivery Days"
                type="number"
                min="1"
                required
                placeholder="e.g., 3"
                value={settings.minDeliveryDays}
                onChange={(e) => setSettings({ ...settings, minDeliveryDays: e.target.value })}
              />

              <Input
                label="Maximum Delivery Days"
                type="number"
                min="1"
                required
                placeholder="e.g., 7"
                value={settings.maxDeliveryDays}
                onChange={(e) => setSettings({ ...settings, maxDeliveryDays: e.target.value })}
              />
            </div>

            {/* Preview Box */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'}`}>
              <h4 className="text-xs uppercase tracking-wider text-gold-500 font-semibold mb-2">Live Customer Display Preview</h4>
              <p className="text-sm">
                • <strong>Shipping Fee:</strong> ₹{settings.shippingCharge} (Free on orders above ₹{settings.freeShippingThreshold})
              </p>
              <p className="text-sm mt-1">
                • <strong>Estimated Delivery:</strong> {settings.minDeliveryDays}–{settings.maxDeliveryDays} business days
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-dark-700/50">
              <Button type="submit" isLoading={saving} className="flex items-center gap-2 shadow-gold">
                <FiSave /> Save Changes
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: Privacy Policy Management */}
      {activeTab === 'privacy' && (
        <div className={`p-6 border rounded-xl shadow-sm space-y-6 ${cardBg}`}>
          <div className={`flex items-center gap-3 border-b pb-3 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
            <FiFileText className="text-2xl text-gold-500" />
            <div>
              <h2 className={`text-lg font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Privacy Policy Management</h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Upload and manage the official PDF Privacy Policy document accessible by customers.
              </p>
            </div>
          </div>

          {/* Current PDF Status */}
          <div className={`p-5 rounded-xl border ${
            settings.privacyPolicyPdfUrl 
              ? isDark ? 'bg-dark-700/60 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'
              : isDark ? 'bg-dark-700/60 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {settings.privacyPolicyPdfUrl ? (
                  <FiCheckCircle className="text-3xl text-emerald-500 flex-shrink-0" />
                ) : (
                  <FiAlertCircle className="text-3xl text-amber-500 flex-shrink-0" />
                )}
                <div>
                  <h3 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {settings.privacyPolicyPdfUrl ? 'Official Privacy Policy PDF Uploaded' : 'No Privacy Policy PDF Uploaded Yet'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {settings.privacyPolicyUploadedAt 
                      ? `Uploaded on: ${new Date(settings.privacyPolicyUploadedAt).toLocaleString()}` 
                      : 'Upload a PDF file below so customers can view your official policy.'}
                  </p>
                </div>
              </div>

              {settings.privacyPolicyPdfUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={settings.privacyPolicyPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-gold-500 text-dark-900 font-semibold text-xs flex items-center gap-1.5 hover:bg-gold-400 transition-colors shadow-sm"
                  >
                    <FiExternalLink /> View/Download PDF
                  </a>
                  <button
                    onClick={handleDeletePrivacyPolicy}
                    type="button"
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                    title="Delete Privacy Policy PDF"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* PDF Upload Form */}
          <form onSubmit={handlePdfUpload} className="space-y-4">
            <label className={labelClass}>Upload / Replace Privacy Policy PDF File (.pdf only)</label>
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDark ? 'border-dark-600 bg-dark-700/40 hover:border-gold-500' : 'border-gray-300 bg-[#FAFAF7] hover:border-gold-500'
            }`}>
              <FiUploadCloud className="mx-auto text-4xl text-gold-500 mb-3" />
              <div className="flex flex-col items-center justify-center gap-2 text-sm">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-500/20 file:text-gold-400 hover:file:bg-gold-500/30 cursor-pointer"
                />
                <span className="text-xs text-gray-400">Maximum file size: 15MB (.pdf format only)</span>
              </div>
              {pdfFile && (
                <div className="mt-4 p-2 bg-gold-500/10 border border-gold-500/30 rounded-lg inline-block text-xs font-semibold text-gold-400">
                  Selected File: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={uploadingPdf} disabled={!pdfFile} className="flex items-center gap-2 shadow-gold">
                <FiUploadCloud /> {settings.privacyPolicyPdfUrl ? 'Replace PDF Document' : 'Upload PDF Document'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Customer Support Requests Dashboard */}
      {activeTab === 'inquiries' && (
        <div className={`p-6 border rounded-xl shadow-sm space-y-6 ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-dark-700/50">
            <div className="flex items-center gap-3">
              <FiMessageSquare className="text-2xl text-gold-500" />
              <div>
                <h2 className={`text-lg font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Customer Support Requests</h2>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  View, reply to, and resolve questions submitted through the Help & Support page.
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchInquiries()}
              className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-300 border border-dark-600 flex items-center gap-1.5 text-xs transition-colors self-start sm:self-auto"
            >
              <FiRefreshCw className={inquiriesLoading ? 'animate-spin' : ''} /> Refresh List
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Status Filter */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {['', 'pending', 'in_progress', 'resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => { setInquiryStatusFilter(st); fetchInquiries(st, inquirySearch); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    inquiryStatusFilter === st
                      ? 'bg-gold-500 text-dark-900 shadow-sm'
                      : isDark ? 'bg-dark-700 text-gray-400 hover:bg-dark-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st === '' ? 'All Status' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search inquiries..."
                value={inquirySearch}
                onChange={(e) => { setInquirySearch(e.target.value); fetchInquiries(inquiryStatusFilter, e.target.value); }}
                className={inputClass}
              />
              <FiSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* Inquiries Table */}
          {inquiriesLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading support inquiries...</div>
          ) : inquiries.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 border border-dashed rounded-xl p-8">
              No customer support inquiries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
                <thead className={isDark ? 'bg-dark-700/50' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Subject & Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
                  {inquiries.map((inq) => (
                    <tr key={inq._id} className={`transition-colors ${isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-sm">{inq.name}</div>
                        <div className="text-xs text-gray-400">{inq.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium line-clamp-1">{inq.subject}</div>
                        {inq.orderId && (
                          <div className="text-xs text-gold-500 font-mono">Order ID: {inq.orderId}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">
                        {new Date(inq.createdAt).toLocaleDateString()} {new Date(inq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${
                          inq.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : inq.status === 'in_progress'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {inq.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => handleOpenInquiryModal(inq)}
                          className="px-3 py-1 bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 text-xs rounded border border-gold-500/30 transition-colors"
                        >
                          View / Reply
                        </button>
                        <button
                          onClick={() => handleDeleteInquiry(inq._id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Request"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal for View / Reply */}
          {selectedInquiry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className={`w-full max-w-2xl p-6 rounded-2xl border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${cardBg}`}>
                <div className="flex justify-between items-start border-b pb-3 border-dark-700/60">
                  <div>
                    <h3 className={`text-xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Support Inquiry Details</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Submitted on {new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => setSelectedInquiry(null)} className="text-gray-400 hover:text-white text-xl">
                    &times;
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">Customer Name:</span>
                    <strong className="text-sm font-medium">{selectedInquiry.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Customer Email:</span>
                    <strong className="text-sm font-medium text-gold-400">{selectedInquiry.email}</strong>
                  </div>
                  {selectedInquiry.orderId && (
                    <div className="col-span-2">
                      <span className="text-gray-400 block">Associated Order ID:</span>
                      <strong className="text-sm font-mono text-gold-400">{selectedInquiry.orderId}</strong>
                    </div>
                  )}
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="text-xs text-gold-500 font-semibold block mb-1">Subject: {selectedInquiry.subject}</span>
                  <p className="text-sm whitespace-pre-wrap">{selectedInquiry.message}</p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className={labelClass}>Update Status & Send Admin Reply</label>
                  <div className="flex items-center gap-4">
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value)}
                      className={inputClass}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <textarea
                    rows="4"
                    className={inputClass}
                    placeholder="Write a response or internal notes to the customer..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-dark-700/60">
                  <button
                    onClick={() => handleDeleteInquiry(selectedInquiry._id)}
                    type="button"
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <FiTrash2 /> Delete Inquiry
                  </button>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedInquiry(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateInquiry} isLoading={updatingInquiry} className="flex items-center gap-1.5 shadow-gold">
                      <FiSend /> Save & Update Status
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
