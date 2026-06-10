import { Film, Play, Clock, Eye, Heart, TrendingUp } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import { formatViews } from '../utils/formatCount';
import { engagementRate } from '../utils/timeAgo';
import { watchScore } from '../utils/watchScore';
import WatchScoreRing from './WatchScoreRing';
import timeAgo from '../utils/timeAgo';

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
    <div className={`w-4 h-4 rounded-full ${color} flex items-center justify-center text-white text-[8px] font-bold shrink-0`}>
      {letter}
    </div>
  );
}

export default function ListCard({ video, ranks, onPlay }) {
  const { language } = useTheme();
  const ratio = engagementRate(video.likes, video.views);
  const ago = timeAgo(video.published);
  const viewsLabel = formatViews(video.views) || '0';
  const score = watchScore(video);
  const rank = ranks?.viewsRank;

  return (
    <div className="group bg-yt-bg-card rounded-xl border border-yt-border/50 shadow-sm hover:shadow-xl hover:border-yt-accent/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex gap-4 p-3">
      <div
        className="w-36 sm:w-44 h-20 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-yt-bg-tertiary relative cursor-pointer"
        onClick={() => onPlay(video.videoId)}
      >
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-yt-text-muted/30"><Film size={24} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-yt-accent/90 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play size={18} className="text-white ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-1 right-1 flex items-center gap-1">
          {rank && rank <= 3 && (
            <span className="bg-yt-accent text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
              #{rank}
            </span>
          )}
          {ago && (
            <span className="bg-black/70 text-white/90 text-[9px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm flex items-center gap-0.5">
              <Clock size={7} />
              {ago}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <div>
          <h3 className="text-yt-text font-semibold text-sm leading-snug line-clamp-1 group-hover:text-yt-accent transition-colors">
            {video.title || t(language, 'untitled')}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <ChannelAvatar name={video._channelName} />
            <p className="text-yt-text-muted text-xs truncate">
              {video._channelName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-yt-text-muted pt-1 border-t border-yt-border/30">
          <span className="inline-flex items-center gap-1">
            <Eye size={12} className="text-yt-text-secondary" />
            {viewsLabel}
          </span>
          {video.likes && (
            <span className="inline-flex items-center gap-1">
              <Heart size={12} className="text-yt-text-secondary" />
              {formatViews(video.likes)}
            </span>
          )}
          {ratio && (
            <span className="inline-flex items-center gap-1 text-emerald-500">
              <TrendingUp size={12} />
              {ratio}%
            </span>
          )}
          {score != null && (
            <WatchScoreRing score={score} size={16} strokeWidth={2} />
          )}
          {ranks?.viewsRank && ranks.viewsRank <= 3 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yt-accent/10 text-yt-accent">
              #{ranks.viewsRank} views
            </span>
          )}
          {ranks?.likesRank && ranks.likesRank <= 3 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yt-accent/10 text-yt-accent">
              #{ranks.likesRank} likes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
