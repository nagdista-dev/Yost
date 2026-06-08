import { Home, Heart, Tv, Settings, Download, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const tabs = [
  { id: 'home', icon: Home, labelKey: 'tabHome' },
  { id: 'favorites', icon: Heart, labelKey: 'tabFavorites' },
  { id: 'channels', icon: Tv, labelKey: 'tabChannels' },
  { id: 'settings', icon: Settings, labelKey: 'tabSettings' },
  { id: 'export', icon: Download, labelKey: 'tabExport' },
];

export default function ChannelSidebar({ activeTab, setActiveTab }) {
  const { theme, language, updateSetting } = useTheme();

  return (
    <>
      <aside className="hidden md:flex fixed start-0 top-16 w-64 bg-yt-sidebar bottom-0 flex-col border-e border-yt-border z-30">
        <nav className="flex-1 flex flex-col gap-1 px-3 pt-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-yt-accent text-white'
                    : 'text-yt-text-secondary hover:bg-yt-bg-tertiary hover:text-yt-text'
                }`}
              >
                <Icon size={20} />
                <span>{t(language, tab.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <button
            onClick={() => updateSetting('theme', theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-yt-text-secondary hover:bg-yt-bg-tertiary hover:text-yt-text transition"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span>{theme === 'dark' ? t(language, 'light') : t(language, 'dark')}</span>
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-yt-sidebar border-t border-yt-border z-30 flex">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
                activeTab === tab.id
                  ? 'text-yt-accent'
                  : 'text-yt-text-muted'
              }`}
            >
              <Icon size={20} />
              <span>{t(language, tab.labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
