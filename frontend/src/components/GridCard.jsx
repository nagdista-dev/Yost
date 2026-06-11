import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import VideoThumbnail from './VideoThumbnail';
import VideoStats from './VideoStats';

export default function GridCard({ video, ranks, onPlay, onChannelClick }) {
  const { language } = useTheme();
  const rank = ranks?.viewsRank;

  return (
    <div className="group bg-yt-bg-card rounded-xl border border-yt-border/50 shadow-sm hover:shadow-xl hover:border-yt-accent/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col">
      <VideoThumbnail video={video} rank={rank} onPlay={onPlay} language={language} />

      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
        <div className="flex-1 min-w-0 space-y-1.5">
          <h3 className="text-yt-text font-semibold text-sm leading-snug line-clamp-2 group-hover:text-yt-accent transition-colors duration-200">
            {video.title || t(language, 'untitled')}
          </h3>
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
