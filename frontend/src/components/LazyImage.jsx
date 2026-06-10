import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function LazyImage({ src, alt, imgClassName, wrapperClassName, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${wrapperClassName || ''}`}
      onClick={onClick}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 bg-yt-bg-tertiary animate-pulse" />
      )}
      {!error ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`${imgClassName || ''} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-yt-bg-tertiary flex items-center justify-center">
          <ImageOff size={24} className="text-yt-text-muted/50" />
        </div>
      )}
    </div>
  );
}
