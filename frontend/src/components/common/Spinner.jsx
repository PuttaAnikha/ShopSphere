const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10', xl: 'w-16 h-16' };
  return (
    <div className={`${sizes[size]} border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin ${className}`} />
  );
};

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="xl" />
      <p className="text-slate-500 text-sm">Loading...</p>
    </div>
  </div>
);

export const SectionLoader = ({ height = 'h-64' }) => (
  <div className={`flex items-center justify-center ${height}`}>
    <Spinner size="lg" />
  </div>
);

export default Spinner;
