import { Film, Play, Clock, Eye, Heart, TrendingUp, Edit2, Bookmark } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import { formatViews } from '../utils/formatCount';
import { engagementRate } from '../utils/timeAgo';
import timeAgo, { formatDuration } from '../utils/timeAgo';

export default function ListCard({ video, ranks, onPlay, onChannelClick, onEditChannel, onSave, isSaved }) {
  const { language } = useTheme();

  if (video._noVideo) {
    const avatarLetter = (video._channelName || video._channelHandle || '').replace('@', '').charAt(0).toUpperCase();
    return (
      <div className="group bg-yt-bg-card rounded-xl border border-yt-border/50 shadow-sm overflow-hidden flex items-center gap-3 p-3 opacity-70">
        <div className="w-36 sm:w-44 h-20 sm:h-28 shrink-0 rounded-xl bg-yt-bg-tertiary flex items-center justify-center text-yt-text-muted/40">
          <span className="text-xs font-medium">{t(language, 'noVideo')}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="w-6 h-6 rounded-full bg-yt-accent/20 text-yt-accent text-[10px] font-bold flex items-center justify-center shrink-0">
            {avatarLetter}
          </span>
          <span className="text-yt-text-secondary text-sm truncate">
            {video._channelName || video._channelHandle}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onEditChannel?.(video._channelHandle); }}
            className="p-1 rounded-lg text-yt-text-muted/60 hover:bg-yt-accent/10 hover:text-yt-accent transition shrink-0"
          >
            <Edit2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  const ratio = engagementRate(video.likes, video.views);
  const ago = timeAgo(video.published, language);
  const duration = formatDuration(video.length);
  const viewsLabel = formatViews(video.views) || '0';
  const likesLabel = formatViews(video.likes) || '0';
  const rank = ranks?.viewsRank;
  const isLive = video.isLive;
  const avatarLetter = (video._channelName || video._channelHandle || '').replace('@', '').charAt(0).toUpperCase();

  return (
    <div className={`group bg-yt-bg-card rounded-xl border shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex gap-4 p-3 ${
      isLive
        ? 'border-red-500/30 hover:border-red-500/50 ring-1 ring-red-500/10'
        : 'border-yt-border/50 hover:border-yt-accent/20'
    }`}>
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
        <div className="absolute bottom-1 left-1 flex items-center gap-1">
          {isLive ? (
            <span className="bg-red-500/90 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
              LIVE
            </span>
          ) : duration ? (
            <span className="bg-black/80 text-white text-[9px] px-1 py-0.5 rounded font-medium">
              {duration}
            </span>
          ) : null}
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
          <div className="flex items-center gap-1.5">
            {isLive && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-500 uppercase tracking-wider animate-pulse shrink-0">
                LIVE
              </span>
            )}
            <h3 className={`text-yt-text font-semibold text-sm leading-snug line-clamp-1 transition-colors ${
              isLive ? 'group-hover:text-red-400' : 'group-hover:text-yt-accent'
            }`}>
              {video.title || t(language, 'untitled')}
            </h3>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="w-4 h-4 rounded-full bg-yt-accent/20 text-yt-accent text-[9px] font-bold flex items-center justify-center shrink-0">
              {avatarLetter}
            </span>
            <p
              className="text-yt-text-muted text-xs truncate cursor-pointer hover:text-yt-accent transition-colors"
              onClick={(e) => { e.stopPropagation(); onChannelClick?.(video._channelHandle); }}
            >
              {video._channelName || video._channelHandle}
            </p>
            {onSave && (
              <button
                onClick={(e) => { e.stopPropagation(); onSave(video); }}
                className={`p-1 rounded-lg transition shrink-0 ${
                  isSaved?.(video.videoId)
                    ? 'text-yellow-500'
                    : 'text-yt-text-muted/60 opacity-0 group-hover:opacity-100 hover:text-yellow-500'
                }`}
                title={isSaved?.(video.videoId) ? t(language, 'unsaveVideo') : t(language, 'saveVideo')}
              >
                <Bookmark size={12} fill={isSaved?.(video.videoId) ? 'currentColor' : 'none'} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEditChannel?.(video._channelHandle); }}
              className="p-1 rounded-lg text-yt-text-muted/60 opacity-0 group-hover:opacity-100 hover:bg-yt-accent/10 hover:text-yt-accent transition-all shrink-0"
              title="Edit channel"
            >
              <Edit2 size={12} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-yt-text-muted pt-1 border-t border-yt-border/30">
          <span className="inline-flex items-center gap-1">
            <Eye size={12} className="text-yt-text-secondary" />
            {viewsLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart size={12} className="text-yt-text-secondary" />
            {likesLabel}
          </span>
          {ratio && (
            <span className="inline-flex items-center gap-1 text-emerald-500">
              <TrendingUp size={12} />
              {ratio}%
            </span>
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
