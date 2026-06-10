import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function TabButton({ tab, onClick, activeTab, count }) {
  const Icon = tab.icon;
  const { language } = useTheme();

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition w-full ${
        activeTab === tab.id
          ? 'bg-yt-accent text-white'
          : 'text-yt-text-secondary hover:bg-yt-bg-tertiary hover:text-yt-text'
      }`}
    >
      <Icon size={20} />
      <span className="flex-1 text-start">{t(language, tab.labelKey)}</span>
      {count != null && (
        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
          activeTab === tab.id
            ? 'bg-white/20 text-white'
            : 'bg-yt-bg-tertiary text-yt-text-muted'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}
