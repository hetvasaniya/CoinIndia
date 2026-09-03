import { useTheme } from '../../context/ThemeContext';

const Loader = ({ fullScreen = false }) => {
  const { isDark } = useTheme();

  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gold-500/20 border-t-gold-500"></div>
        <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-gold-500/10"></div>
      </div>
      <p className="mt-4 text-gold-500 font-serif text-sm">Loading...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${
        isDark ? 'bg-dark-900/90 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'
      }`}>
        {content}
      </div>
    );
  }

  return (
    <div className="flex justify-center py-8">
      {content}
    </div>
  );
};

export default Loader;
