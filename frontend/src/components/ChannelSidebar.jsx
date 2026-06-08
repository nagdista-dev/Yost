import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const tabs = [
  { id: 'channels', icon: '📺', labelKey: 'tabChannels' },
  { id: 'settings', icon: '⚙', labelKey: 'tabSettings' },
  { id: 'export', icon: '📥', labelKey: 'tabExport' },
];

export default function ChannelSidebar({ activeTab, setActiveTab }) {
  const { theme, language, updateSetting } = useTheme();

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 w-64 bg-yt-sidebar h-screen flex-col border-r border-yt-border z-30">
        <div className="px-5 pt-5 pb-6">
          <h1 className="text-yt-text text-lg font-bold tracking-tight">SocialTube</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-yt-accent text-white'
                  : 'text-yt-text-secondary hover:bg-yt-bg-tertiary hover:text-yt-text'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{t(language, tab.labelKey)}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 pb-4">
          <button
            onClick={() => updateSetting('theme', theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-yt-text-secondary hover:bg-yt-bg-tertiary hover:text-yt-text transition"
          >
            <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? t(language, 'light') : t(language, 'dark')}</span>
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-yt-sidebar border-t border-yt-border z-30 flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
              activeTab === tab.id
                ? 'text-yt-accent'
                : 'text-yt-text-muted'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{t(language, tab.labelKey)}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
