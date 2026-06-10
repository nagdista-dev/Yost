import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import VideoThumbnail from './VideoThumbnail';
import VideoStats from './VideoStats';

function ChannelAvatar({ name }) {
  const letter = (name || '?').charAt(0).toUpperCase();
  const colors = [
    'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500',
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
    'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-green-500',
    'bg-lime-500', 'bg-yellow-500', 'bg-amber-500', 'bg-orange-500',
  ];
  const color = colors[name ? name.charCodeAt(0) % colors.length : 0];

  return (
    <div className={`w-5 h-5 rounded-full ${color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
      {letter}
    </div>
  );
}

export default function GridCard({ video, ranks, onPlay }) {
  const { language } = useTheme();
  const rank = ranks?.viewsRank;

  return (
    <div className="group bg-yt-bg-card rounded-xl border border-yt-border/50 shadow-sm hover:shadow-xl hover:border-yt-accent/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col">
      <VideoThumbnail video={video} rank={rank} onPlay={onPlay} />

      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
        <div className="flex-1 min-w-0 space-y-1.5">
          <h3 className="text-yt-text font-semibold text-sm leading-snug line-clamp-2 group-hover:text-yt-accent transition-colors duration-200">
            {video.title || t(language, 'untitled')}
          </h3>
          <div className="flex items-center gap-1.5">
            <ChannelAvatar name={video._channelName} />
            <span className="text-yt-text-muted text-xs truncate">
              {video._channelName}
            </span>
          </div>
        </div>

        <div className="pt-1 border-t border-yt-border/30" />

        <VideoStats video={video} ranks={ranks} />
      </div>
    </div>
  );
}
