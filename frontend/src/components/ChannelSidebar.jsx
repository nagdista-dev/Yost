import { Home, Heart, Tv, Settings, Download, Sun, Moon, Plus, X } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const tabs = [
  { id: 'home', icon: Home, labelKey: 'tabHome' },
  { id: 'favorites', icon: Heart, labelKey: 'tabFavorites' },
  { id: 'channels', icon: Tv, labelKey: 'tabChannels' },
  { id: 'settings', icon: Settings, labelKey: 'tabSettings' },
  { id: 'export', icon: Download, labelKey: 'tabExport' },
];

export default function ChannelSidebar({ activeTab, setActiveTab, sidebarOpen, onClose, onAddChannel }) {
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

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={onClose}>
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className={`absolute start-0 top-0 bottom-0 w-64 bg-yt-sidebar flex flex-col border-e border-yt-border shadow-2xl transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 pt-4 pb-2">
              <button
                onClick={onAddChannel}
                className="flex items-center gap-2 bg-yt-accent hover:bg-yt-accent-hover text-white px-3 py-2 rounded-lg text-sm font-medium transition"
              >
                <Plus size={18} />
                <span>{t(language, 'addChannel')}</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary transition"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-1 px-3 pt-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); onClose(); }}
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
        </div>
      )}
    </>
  );
}
