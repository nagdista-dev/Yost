import { watchScoreColor } from '../utils/watchScore';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function WatchScoreRing({ score, size = 30, strokeWidth = 2.5 }) {
  const { language } = useTheme();

  if (score == null) return null;

  const color = watchScoreColor(score);
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      title={t(language, 'watchScore', score)}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bg-card)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span
        className="absolute font-semibold leading-none select-none"
        style={{ fontSize: size * 0.35, color }}
      >
        {score}
      </span>
    </div>
  );
}
