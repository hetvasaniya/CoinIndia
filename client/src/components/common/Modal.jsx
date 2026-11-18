import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  const { isDark } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen p-3 sm:p-4 text-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" 
          aria-hidden="true" 
          onClick={onClose}
        />

        {/* Modal Window */}
        <div className={`relative w-full ${maxWidth} my-auto rounded-2xl text-left shadow-2xl transform transition-all max-h-[92vh] flex flex-col overflow-hidden border ${
          isDark ? 'bg-dark-800 border-dark-600 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          {/* Header */}
          <div className={`px-5 py-4 flex justify-between items-center border-b flex-shrink-0 ${
            isDark ? 'border-dark-700 bg-dark-750/50' : 'border-gray-200 bg-[#FAFAF7]'
          }`}>
            <h3 className={`text-lg leading-6 font-serif font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`} id="modal-title">
              {title}
            </h3>
            <button 
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-dark-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Close modal"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 touch-scroll">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
