import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="btn-secondary btn-sm px-2 disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="btn-secondary btn-sm px-3">1</button>
          {start > 2 && <span className="text-slate-400 px-1">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`btn-sm px-3 rounded-lg text-sm font-medium transition-colors ${
            p === page
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-slate-400 px-1">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="btn-secondary btn-sm px-3">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="btn-secondary btn-sm px-2 disabled:opacity-40"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;
