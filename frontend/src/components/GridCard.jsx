import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import VideoThumbnail from './VideoThumbnail';
import VideoStats from './VideoStats';

export default function GridCard({ video, ranks, onPlay, onChannelClick }) {
  const { language } = useTheme();
  const rank = ranks?.viewsRank;

  const isLive = video.isLive;

  return (
    <div className={`group bg-yt-bg-card rounded-xl border shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col ${
      isLive
        ? 'border-red-500/30 hover:border-red-500/50 ring-1 ring-red-500/10'
        : 'border-yt-border/50 hover:border-yt-accent/20'
    }`}>
      <VideoThumbnail video={video} rank={rank} onPlay={onPlay} language={language} />

      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5">
            {isLive && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-500 uppercase tracking-wider animate-pulse shrink-0">
                LIVE
              </span>
            )}
            <h3 className={`text-yt-text font-semibold text-sm leading-snug line-clamp-2 transition-colors duration-200 ${
              isLive ? 'group-hover:text-red-400' : 'group-hover:text-yt-accent'
            }`}>
              {video.title || t(language, 'untitled')}
            </h3>
          </div>
          <span
            className="text-yt-text-muted text-xs truncate cursor-pointer hover:text-yt-accent transition-colors"
            onClick={(e) => { e.stopPropagation(); onChannelClick?.(video._channelHandle); }}
          >
            {video._channelHandle}
          </span>
        </div>

        <div className="pt-1 border-t border-yt-border/30" />

        <VideoStats video={video} ranks={ranks} />
      </div>
    </div>
  );
}
