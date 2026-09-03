import { forwardRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

const Input = forwardRef(({ 
  label, 
  error, 
  id, 
  required,
  className = '', 
  ...props 
}, ref) => {
  const { isDark } = useTheme();
  
  const isRequired = required || props.required;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className={`block text-sm font-medium mb-1 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {label}
          {isRequired && <span className="text-red-500 ml-1 font-bold">*</span>}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={`w-full px-3 py-2.5 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 sm:text-sm ${
          error 
            ? 'border-red-500' 
            : isDark 
              ? 'border-dark-600 bg-dark-700 text-white placeholder-gray-500' 
              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
