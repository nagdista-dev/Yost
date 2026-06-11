import { useState } from 'react';
import { Film, Play, Clock } from 'lucide-react';
import timeAgo, { formatDuration } from '../utils/timeAgo';

const THUMB_FALLBACKS = ['maxresdefault', 'hqdefault', 'mqdefault', 'default'];

export default function VideoThumbnail({ video, rank, onPlay, language = 'en' }) {
  const ago = timeAgo(video.published, language);
  const duration = formatDuration(video.length);
  const [thumbIdx, setThumbIdx] = useState(0);

  const thumbUrl = video.videoId
    ? `https://i.ytimg.com/vi/${video.videoId}/${THUMB_FALLBACKS[thumbIdx]}.jpg`
    : null;

  function onThumbError() {
    if (thumbIdx < THUMB_FALLBACKS.length - 1) {
      setThumbIdx(thumbIdx + 1);
    }
  }

  return (
    <div
      className="aspect-video bg-yt-bg-tertiary overflow-hidden relative cursor-pointer"
      onClick={() => video.videoId && onPlay(video.videoId)}
    >
      {thumbUrl ? (
          <img
            key={thumbUrl}
            src={thumbUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={onThumbError}
          />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-yt-text-muted/30">
          <Film size={48} />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-yt-accent/90 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
          <Play size={24} className="text-white ml-0.5" />
        </div>
      </div>

      {duration && (
        <div className="absolute bottom-2 left-2">
          <span className="bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
            {duration}
          </span>
        </div>
      )}

      <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
        {rank && rank <= 3 && (
          <span className="bg-yt-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
            #{rank}
          </span>
        )}
        {ago && (
          <span className="bg-black/70 text-white/90 text-[10px] px-2 py-0.5 rounded font-medium backdrop-blur-sm flex items-center gap-1">
            <Clock size={10} />
            {ago}
          </span>
        )}
      </div>
    </div>
  );
}
