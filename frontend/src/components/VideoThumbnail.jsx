import { Film, Play, Clock } from 'lucide-react';
import timeAgo from '../utils/timeAgo';

export default function VideoThumbnail({ video, rank, onPlay }) {
  const ago = timeAgo(video.published);

  return (
    <div
      className="aspect-video bg-yt-bg-tertiary overflow-hidden relative cursor-pointer"
      onClick={() => onPlay(video.videoId)}
    >
      {video.thumbnail ? (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
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
