import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RailArrowsProps {
  onPrev: () => void;
  onNext: () => void;
}

const arrowClass =
  'w-8 h-8 inline-flex items-center justify-center rounded-md border border-black/15 bg-white text-black hover:border-black transition-colors';

const RailArrows = ({ onPrev, onNext }: RailArrowsProps) => (
  <div className="flex items-center gap-2">
    <button type="button" className={arrowClass} onClick={onPrev} aria-label="Previous">
      <ChevronLeft className="w-4 h-4" />
    </button>
    <button type="button" className={arrowClass} onClick={onNext} aria-label="Next">
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

export default RailArrows;
