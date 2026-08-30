const Loader = ({ fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8860B]"></div>
      <p className="mt-4 text-[#B8860B] font-serif">Loading...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
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
