import { useRef } from 'react';

const ImageUploader = ({ files, setFiles }) => {
  const fileInputRef = useRef(null);

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
      className="border-2 border-dashed border-gray-300 rounded-md p-12 text-center bg-[#FAFAF7] hover:bg-gray-50 transition-colors"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="space-y-1">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex text-sm text-gray-600 justify-center">
          <label className="relative cursor-pointer bg-white rounded-md font-medium text-[#B8860B] hover:text-[#8B6914] focus-within:outline-none px-1">
            <span>Upload files</span>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              className="sr-only" 
              onChange={handleChange} 
              accept="image/*" 
            />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
      </div>
      {files && files.length > 0 && (
        <p className="mt-4 text-sm text-green-600 font-medium">{files.length} file(s) selected</p>
      )}
    </div>
  );
};

export default ImageUploader;
