import { useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(e => {
    e.stopPropagation();
    setIdx(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(e => {
    e.stopPropagation();
    setIdx(i => (i + 1) % images.length);
  }, [images.length]);

  return (
    <div
      className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <span className="absolute top-4 left-4 z-10 text-white/70 text-sm font-medium">
          {idx + 1} / {images.length}
        </span>
      )}

      <img
        src={images[idx]}
        alt={`Image ${idx + 1}`}
        className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain select-none"
        onClick={e => e.stopPropagation()}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-5 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIdx(i); }}
              className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
