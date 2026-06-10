import { Plus, Sun, Moon, Languages, Type, Maximize, Minimize } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import useFullscreen from '../hooks/useFullscreen';
import QuickButton from './QuickButton';

const FONT_SIZES = ['small', 'medium', 'large'];

export default function SidebarFooter({ onAdd, closeMobile, hideAddButton }) {
  const {
    theme, language, fontSize, updateSetting,
    showThemeQuickAccess, showLangQuickAccess, showFontSizeQuickAccess, showFullscreenQuickAccess
  } = useTheme();
  const { isFs, toggle: toggleFs } = useFullscreen();

  const nextFontSize = () => {
    const idx = FONT_SIZES.indexOf(fontSize);
    return FONT_SIZES[(idx + 1) % FONT_SIZES.length];
  };

  return (
    <div className="shrink-0 border-t border-yt-border">
      {!hideAddButton && (
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => { onAdd(); if (closeMobile) closeMobile(); }}
            className="w-full flex items-center justify-center gap-2 bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>{t(language, 'addChannel')}</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-1 px-3 pb-3 pt-1">
        {showThemeQuickAccess && (
          <QuickButton
            icon={theme === 'dark' ? Sun : Moon}
            label={theme === 'dark' ? t(language, 'light') : t(language, 'dark')}
            onClick={() => updateSetting('theme', theme === 'dark' ? 'light' : 'dark')}
          />
        )}
        {showLangQuickAccess && (
          <QuickButton
            icon={Languages}
            label={language === 'ar' ? t(language, 'english') : t(language, 'arabic')}
            onClick={() => updateSetting('language', language === 'ar' ? 'en' : 'ar')}
          />
        )}
        {showFontSizeQuickAccess && (
          <QuickButton
            icon={Type}
            label={`${t(language, 'fontSize')}: ${t(language, nextFontSize())}`}
            onClick={() => updateSetting('fontSize', nextFontSize())}
            active={fontSize !== 'medium'}
          />
        )}
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
