import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselControlsProps {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
}

export function CarouselControls({
  currentIndex,
  total,
  onPrev,
  onNext,
  onGoTo,
}: CarouselControlsProps) {
  if (total <= 1) return null;

  const atStart = currentIndex === 0;
  const atEnd = currentIndex === total - 1;

  return (
    <>
      <button
        onClick={onPrev}
        disabled={atStart}
        aria-label="Previous image"
        className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 ${
          atStart
            ? "bg-black/30 text-white/30 cursor-default"
            : "bg-black/50 hover:bg-black/70 text-white"
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={onNext}
        disabled={atEnd}
        aria-label="Next image"
        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 ${
          atEnd
            ? "bg-black/30 text-white/30 cursor-default"
            : "bg-black/50 hover:bg-black/70 text-white"
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5"
        role="tablist"
        aria-label="Image carousel"
      >
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            onClick={() => onGoTo(i)}
            role="tab"
            aria-selected={i === currentIndex}
            aria-label={`Image ${i + 1} of ${total}`}
            className={`w-1.5 h-1.5 rounded-full ${
              i === currentIndex ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </>
  );
}
