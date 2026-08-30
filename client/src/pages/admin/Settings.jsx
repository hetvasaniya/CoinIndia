import { useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { FiCloud, FiDatabase, FiLock, FiSave, FiCheckCircle } from 'react-icons/fi';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'Coin India',
    adminEmail: 'admin@coinindia.com',
    currency: 'INR (₹)',
    cloudinaryStatus: 'Connected',
    cloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME || 'coin_india_storage',
  });

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Admin settings updated successfully');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-serif text-[#1a1a1a]">Admin Settings</h1>
        <p className="text-sm text-gray-500">Configure Cloudinary database integrations, system credentials, and store preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Cloudinary Integration Section */}
        <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
          <div className="flex items-center gap-3 mb-4 border-b pb-3">
            <FiCloud className="text-2xl text-[#B8860B]" />
            <div>
              <h2 className="text-lg font-serif text-[#1a1a1a]">Cloudinary Storage Integration</h2>
              <p className="text-xs text-gray-500">Image hosting and CDN media management</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
              <FiCheckCircle /> Configured (.env)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Storage Provider</label>
              <input 
                type="text" 
                value="Cloudinary v2 (Multer Storage)" 
                disabled 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Environment File Location</label>
              <input 
                type="text" 
                value="server/.env" 
                disabled 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 font-mono"
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-[#FAFAF7] border border-amber-200/60 rounded-md text-xs text-amber-900 space-y-1">
            <p className="font-semibold">Required Environment Variables in server/.env:</p>
            <code className="block font-mono bg-white p-2 rounded border text-gray-700">
              CLOUDINARY_CLOUD_NAME=your_cloud_name<br />
              CLOUDINARY_API_KEY=your_api_key<br />
              CLOUDINARY_API_SECRET=your_api_secret
            </code>
          </div>
        </div>

        {/* General Store Preferences */}
        <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b pb-3">
            <FiDatabase className="text-2xl text-[#B8860B]" />
            <div>
              <h2 className="text-lg font-serif text-[#1a1a1a]">General Store Preferences</h2>
              <p className="text-xs text-gray-500">System settings and default display options</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Store Platform Name" 
              value={settings.siteName} 
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} 
            />
            <Input 
              label="System Admin Email" 
              value={settings.adminEmail} 
              onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })} 
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={loading} className="flex items-center gap-2">
            <FiSave /> {loading ? 'Saving Settings...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
