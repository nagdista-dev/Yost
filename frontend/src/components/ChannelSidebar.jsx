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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="absolute start-0 top-0 bottom-0 w-72 bg-yt-sidebar flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 h-16 border-b border-yt-border shrink-0">
              <span className="text-yt-text text-lg font-extrabold tracking-tight">Yost</span>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-3 pt-3 pb-2 shrink-0">
              <button
                onClick={onAddChannel}
                className="w-full flex items-center justify-center gap-2 bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span>{t(language, 'addChannel')}</span>
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-0.5 px-2 pb-2 overflow-y-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); onClose(); }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-yt-accent text-white shadow-sm'
                        : 'text-yt-text-secondary hover:bg-yt-bg-tertiary hover:text-yt-text'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{t(language, tab.labelKey)}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-yt-border px-2 py-2 shrink-0">
              <button
                onClick={() => updateSetting('theme', theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-yt-text-secondary hover:bg-yt-bg-tertiary hover:text-yt-text transition-colors"
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
