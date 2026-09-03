import { useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

const ImageUploader = ({ files, setFiles }) => {
  const fileInputRef = useRef(null);
  const { isDark } = useTheme();

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
        isDark 
          ? 'border-dark-600 bg-dark-700 hover:border-gold-500/50 hover:bg-dark-700/80' 
          : 'border-gray-300 bg-[#FAFAF7] hover:border-gold-500/50 hover:bg-gray-50'
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="space-y-1">
        <svg className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className={`flex text-sm justify-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <label className={`relative cursor-pointer rounded-md font-medium text-gold-500 hover:text-gold-400 focus-within:outline-none px-1`}>
            <span>Upload files</span>
            <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={handleChange} accept="image/*" />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>PNG, JPG, GIF up to 5MB</p>
      </div>
      {files && files.length > 0 && (
        <p className="mt-4 text-sm text-emerald-500 font-medium">{files.length} file(s) selected</p>
      )}
    </div>
  );
};

export default ImageUploader;
