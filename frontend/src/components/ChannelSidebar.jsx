import { X, Home, Video, Heart, Tv, Settings, Download } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import TabButton from './TabButton';
import CategorySection from './CategorySection';
import SidebarFooter from './SidebarFooter';

const tabs = [
  { id: 'home', icon: Home, labelKey: 'tabHome' },
  { id: 'videos', icon: Video, labelKey: 'tabVideos' },
  { id: 'favorites', icon: Heart, labelKey: 'tabFavorites' },
  { id: 'channels', icon: Tv, labelKey: 'tabChannels' },
  { id: 'settings', icon: Settings, labelKey: 'tabSettings' },
  { id: 'export', icon: Download, labelKey: 'tabExport' },
];

export default function ChannelSidebar({ activeTab, setActiveTab, sidebarOpen, onClose, onAddChannel, categories, selectedCategory, onSelectCategory, channelCount }) {
  const { language } = useTheme();

  return (
    <>
      <aside className="hidden md:flex fixed start-0 top-16 w-64 bg-yt-sidebar bottom-0 flex-col border-e border-yt-border z-30">
        <nav className="flex-1 flex flex-col gap-1 px-3 pt-4 overflow-y-auto">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              tab={tab}
              activeTab={activeTab}
              onClick={() => setActiveTab(tab.id)}
              count={tab.id === 'channels' ? channelCount : undefined}
            />
          ))}

          <div className="border-t border-yt-border my-3" />

          <CategorySection categories={categories} selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} />
        </nav>

        <SidebarFooter onAdd={onAddChannel} />
      </aside>

      {sidebarOpen && (
        <div className="md:hidden fixed top-0 left-0 w-screen h-screen z-50" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute start-0 top-0 bottom-0 w-72 bg-yt-sidebar flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 h-16 border-b border-yt-border shrink-0">
              <span className="text-yt-text text-lg font-extrabold tracking-tight"><span className="brand-y" style={{ fontSize: '1.4em' }}>Y</span>ost</span>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-0.5 px-2 pb-2 pt-3 overflow-y-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); onClose(); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full ${
                    activeTab === tab.id
                      ? 'bg-yt-accent text-white shadow-sm'
                      : 'text-yt-text-secondary hover:bg-yt-bg-tertiary hover:text-yt-text'
                  }`}
                >
                  <tab.icon size={20} />
                  <span className="flex-1 text-start">{t(language, tab.labelKey)}</span>
                  {tab.id === 'channels' && channelCount != null && (
                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-yt-bg-tertiary text-yt-text-muted'
                    }`}>
                      {channelCount}
                    </span>
                  )}
                </button>
              ))}

              <div className="border-t border-yt-border my-3" />

              <CategorySection categories={categories} selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} />
            </nav>

            <SidebarFooter onAdd={onAddChannel} closeMobile={onClose} hideAddButton />
          </aside>
        </div>
      )}
    </>
  );
}
