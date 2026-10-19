import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchX, X } from 'lucide-react';

interface NoResultsDialogProps {
  query: string;
  onClear: () => void;
}

/** Friendly pop-up shown once per search when nothing matches */
const NoResultsDialog = ({ query, onClear }: NoResultsDialogProps) => {
  const [open, setOpen] = useState(true);

  // Re-open for each new search term
  useEffect(() => setOpen(true), [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px] animate-fade-in"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="no-results-title"
    >
      <div
        className="relative w-full max-w-sm bg-white shadow-2xl text-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-black/60 hover:text-black"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-7 pt-10 pb-7">
          <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-army-green/10 flex items-center justify-center">
            <SearchX className="w-6 h-6 text-army-green" strokeWidth={1.75} />
          </div>
          <h2
            id="no-results-title"
            className="text-xl font-bold tracking-[0.12em] uppercase text-army-green mb-3"
          >
            Oops!
          </h2>
          <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-black leading-relaxed mb-2">
            We&apos;re sorry — we couldn&apos;t find &ldquo;{query}&rdquo;.
          </p>
          <p className="text-[10px] font-bold tracking-[0.06em] uppercase text-black/45 leading-relaxed">
            It may not be in stock yet. Please check back again soon, or have it made just for you.
          </p>
        </div>

        <div className="grid grid-cols-2 border-t border-black/10">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onClear();
            }}
            className="py-4 text-[10px] font-bold tracking-[0.2em] uppercase text-black hover:bg-black/[0.03] border-r border-black/10"
          >
            Browse all
          </button>
          <Link
            to="/custom-design"
            className="py-4 text-[10px] font-bold tracking-[0.2em] uppercase text-white bg-army-green hover:bg-army-green-light"
          >
            Custom order
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NoResultsDialog;
