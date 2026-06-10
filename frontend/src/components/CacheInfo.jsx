import { RefreshCw, Database } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import formatAge from '../utils/formatAge';

export default function CacheInfo({ loading, cacheInfo, onRefresh }) {
  const { language } = useTheme();

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-yt-text-muted bg-yt-bg-tertiary px-3 py-1.5 rounded-full animate-pulse">
        <RefreshCw size={12} className="text-yt-accent animate-spin" />
        <span>{t(language, 'updating')}</span>
      </div>
    );
  }

  if (cacheInfo) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-yt-text-muted bg-yt-bg-tertiary px-3 py-1.5 rounded-full">
        <Database size={12} className="text-yt-accent" />
        <span>{t(language, 'cached', formatAge(cacheInfo.oldestFetchedAt, language))}</span>
      </div>
    );
  }

  return <div />;
}
