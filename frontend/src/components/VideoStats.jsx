import { Eye, Heart, TrendingUp } from 'lucide-react';
import { formatViews } from '../utils/formatCount';
import { engagementRate } from '../utils/timeAgo';
import { watchScore } from '../utils/watchScore';
import WatchScoreRing from './WatchScoreRing';

function StatPill({ icon, value, accent }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
      accent
        ? 'bg-yt-accent/8 text-yt-accent'
        : 'bg-yt-bg-tertiary/40 text-yt-text-secondary'
    }`}>
      <span className={accent ? 'text-yt-accent' : 'text-yt-text-muted'}>{icon}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

export default function VideoStats({ video, ranks }) {
  const r = ranks || {};
  const viewsFormatted = formatViews(video.views) || '0';
  const likesFormatted = formatViews(video.likes) || '0';
  const ratio = engagementRate(video.likes, video.views);
  const score = watchScore(video);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatPill
        icon={<Eye size={12} />}
        value={viewsFormatted}
        accent={r.viewsRank && r.viewsRank <= 3}
      />
      <StatPill
        icon={<Heart size={12} />}
        value={likesFormatted}
        accent={r.likesRank && r.likesRank <= 3}
      />
      {ratio && (
        <StatPill
          icon={<TrendingUp size={12} />}
          value={`${ratio}%`}
        />
      )}
      {score != null && (
        <WatchScoreRing score={score} size={24} strokeWidth={2.5} />
      )}
    </div>
  );
}
