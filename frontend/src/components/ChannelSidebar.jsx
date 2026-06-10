import { useState, useCallback, useEffect } from 'react';
import { Home, Heart, Tv, Settings, Download, Sun, Moon, Plus, X, Tag, Languages, Type, Maximize, Minimize, Video } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const tabs = [
  { id: 'home', icon: Home, labelKey: 'tabHome' },
  { id: 'videos', icon: Video, labelKey: 'tabVideos' },
  { id: 'favorites', icon: Heart, labelKey: 'tabFavorites' },
  { id: 'channels', icon: Tv, labelKey: 'tabChannels' },
  { id: 'settings', icon: Settings, labelKey: 'tabSettings' },
  { id: 'export', icon: Download, labelKey: 'tabExport' },
];

const FONT_SIZES = ['small', 'medium', 'large'];

function useFullscreen() {
  const [isFs, setIsFs] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const handler = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  return { isFs, toggle };
}

export default function ChannelSidebar({ activeTab, setActiveTab, sidebarOpen, onClose, onAddChannel, categories, selectedCategory, onSelectCategory }) {
  const {
    theme, language, fontSize, updateSetting,
    showThemeQuickAccess, showLangQuickAccess, showFontSizeQuickAccess, showFullscreenQuickAccess
  } = useTheme();
  const { isFs, toggle: toggleFs } = useFullscreen();

  const validCategories = categories.filter(c => c !== 'Unspecified');

  const nextFontSize = () => {
    const idx = FONT_SIZES.indexOf(fontSize);
    return FONT_SIZES[(idx + 1) % FONT_SIZES.length];
  };

  // ── Shared sub-components ─────────────────────────────────────────────────
  function TabButton({ tab, onClick }) {
    const Icon = tab.icon;
    return (
      <button
        onClick={onClick}
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
  }

  function CategoryButton({ cat, isSelected, onClick }) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition ${
          isSelected
            ? 'bg-yt-accent/10 text-yt-accent'
            : 'text-yt-text-secondary hover:bg-yt-bg-tertiary hover:text-yt-text'
        }`}
      >
        <Tag size={14} className="opacity-60" />
        <span className="truncate">{cat}</span>
      </button>
    );
  }

  function CategorySection() {
    if (validCategories.length === 0) return null;
    return (
      <div className="px-3">
        <div className="text-yt-text-muted text-[11px] font-semibold uppercase tracking-wider px-3 py-2">
          {t(language, 'categories')}
        </div>
        <div className="flex flex-col gap-0.5">
          <CategoryButton
            cat={t(language, 'allCategories')}
            isSelected={!selectedCategory}
            onClick={() => onSelectCategory(null)}
          />
          {validCategories.map(cat => (
            <CategoryButton
              key={cat}
              cat={cat}
              isSelected={selectedCategory === cat}
              onClick={() => onSelectCategory(cat)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Quick-access icon button (used at the bottom of the sidebar)
  function QuickButton({ icon: Icon, label, onClick, active }) {
    return (
      <button
        onClick={onClick}
        title={label}
        className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
          active
            ? 'bg-yt-accent/15 text-yt-accent'
            : 'text-yt-text-muted hover:bg-yt-bg-tertiary hover:text-yt-text'
        }`}
      >
        <Icon size={18} />
      </button>
    );
  }

  // The shared footer with Add + quick-access buttons
  function SidebarFooter({ onAdd, closeMobile }) {
    return (
      <div className="shrink-0 border-t border-yt-border">
        {/* Add Channel button */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => { onAdd(); if (closeMobile) closeMobile(); }}
            className="w-full flex items-center justify-center gap-2 bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>{t(language, 'addChannel')}</span>
          </button>
        </div>

        {/* Quick-access row */}
        <div className="flex items-center justify-center gap-1 px-3 pb-3 pt-1">
          {/* Theme toggle */}
          {showThemeQuickAccess && (
            <QuickButton
              icon={theme === 'dark' ? Sun : Moon}
              label={theme === 'dark' ? t(language, 'light') : t(language, 'dark')}
              onClick={() => updateSetting('theme', theme === 'dark' ? 'light' : 'dark')}
            />
          )}
          {/* Language toggle */}
          {showLangQuickAccess && (
            <QuickButton
              icon={Languages}
              label={language === 'ar' ? t(language, 'english') : t(language, 'arabic')}
              onClick={() => updateSetting('language', language === 'ar' ? 'en' : 'ar')}
            />
          )}
          {/* Font size cycle */}
          {showFontSizeQuickAccess && (
            <QuickButton
              icon={Type}
              label={`${t(language, 'fontSize')}: ${t(language, nextFontSize())}`}
              onClick={() => updateSetting('fontSize', nextFontSize())}
              active={fontSize !== 'medium'}
            />
          )}
          {/* Fullscreen toggle */}
          {showFullscreenQuickAccess && (
            <QuickButton
              icon={isFs ? Minimize : Maximize}
              label={isFs ? 'Exit Fullscreen' : 'Fullscreen'}
              onClick={toggleFs}
              active={isFs}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Desktop sidebar ───────────────────────────────────────────────────────
  return (
    <>
      <aside className="hidden md:flex fixed start-0 top-16 w-64 bg-yt-sidebar bottom-0 flex-col border-e border-yt-border z-30">
        <nav className="flex-1 flex flex-col gap-1 px-3 pt-4 overflow-y-auto">
          {tabs.map(tab => (
            <TabButton key={tab.id} tab={tab} onClick={() => setActiveTab(tab.id)} />
          ))}

          <div className="border-t border-yt-border my-3" />

          <CategorySection />
        </nav>

        <SidebarFooter onAdd={onAddChannel} />
      </aside>

      {/* ── Mobile sidebar (drawer) ──────────────────────────────────────── */}
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-yt-accent text-white shadow-sm'
                      : 'text-yt-text-secondary hover:bg-yt-bg-tertiary hover:text-yt-text'
                  }`}
                >
                  <tab.icon size={20} />
                  <span>{t(language, tab.labelKey)}</span>
                </button>
              ))}

              <div className="border-t border-yt-border my-3" />

              <CategorySection />
            </nav>

            <SidebarFooter onAdd={onAddChannel} closeMobile={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}