import { Moon, Sun, Languages, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import StartPageSelector from '../components/StartPageSelector';

export default function SettingsPage() {
  const {
    theme, language, fontSize,
    showThemeQuickAccess, showLangQuickAccess, showFontSizeQuickAccess, showFullscreenQuickAccess,
    updateSetting
  } = useTheme();

  const toggleSetting = (key, value) => {
    updateSetting(key, !value);
  };

  function handleClearCache() {
    try {
      localStorage.removeItem('yt_feed_posts_cache');
      localStorage.removeItem('yt_feed_seen');
      toast.success(t(language, 'cacheCleared'));
    } catch {}
  }

  return (
    <div className="bg-yt-bg-card rounded-xl p-6 md:p-8 lg:p-10 border border-yt-border">
      <h2 className="text-yt-text text-xl font-bold mb-8" style={{ fontSize: 'var(--font-size-xl)' }}>
        {t(language, 'settingsTitle')}
      </h2>

      <div className="space-y-8 max-w-lg">
        <div>
          <p className="text-yt-text-secondary text-xs font-semibold mb-3 uppercase tracking-wide">
            {t(language, 'theme')}
          </p>
          <div className="flex gap-3 md:gap-4">
            {['dark', 'light'].map(mode => (
              <button
                key={mode}
                onClick={() => updateSetting('theme', mode)}
                className={`flex-1 px-4 py-3 md:py-3.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                  theme === mode
                    ? 'bg-yt-accent text-white ring-2 ring-yt-accent/50'
                    : 'bg-yt-bg-tertiary text-yt-text-secondary hover:text-yt-text'
                }`}
              >
                {mode === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                {t(language, mode)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-yt-text-secondary text-xs font-semibold mb-3 uppercase tracking-wide">
            {t(language, 'language')}
          </p>
          <div className="flex gap-3 md:gap-4">
            {['ar', 'en'].map(lang => (
              <button
                key={lang}
                onClick={() => updateSetting('language', lang)}
                className={`flex-1 px-4 py-3 md:py-3.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                  language === lang
                    ? 'bg-yt-accent text-white ring-2 ring-yt-accent/50'
                    : 'bg-yt-bg-tertiary text-yt-text-secondary hover:text-yt-text'
                }`}
              >
                <Languages size={18} />
                {t(language, lang === 'ar' ? 'arabic' : 'english')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-yt-text-secondary text-xs font-semibold mb-3 uppercase tracking-wide">
            {t(language, 'fontSize')}
          </p>
          <div className="flex gap-3 md:gap-4">
            {['small', 'medium', 'large'].map(size => (
              <button
                key={size}
                onClick={() => updateSetting('fontSize', size)}
                className={`flex-1 px-4 py-3 md:py-3.5 rounded-lg text-sm font-medium transition ${
                  fontSize === size
                    ? 'bg-yt-accent text-white ring-2 ring-yt-accent/50'
                    : 'bg-yt-bg-tertiary text-yt-text-secondary hover:text-yt-text'
                }`}
              >
                {t(language, size)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-yt-text-secondary text-xs font-semibold mb-3 uppercase tracking-wide">
            {t(language, 'startPage')}
          </p>
          <p className="text-yt-text-muted text-xs mb-3">{t(language, 'startPageDesc')}</p>
          <StartPageSelector />
        </div>

        <div>
          <p className="text-yt-text-secondary text-xs font-semibold mb-3 uppercase tracking-wide">
            {t(language, 'clearCache')}
          </p>
          <p className="text-yt-text-muted text-xs mb-3">{t(language, 'clearCacheDesc')}</p>
          <button
            onClick={handleClearCache}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition border border-red-500/20"
          >
            <Trash2 size={16} />
            {t(language, 'clearCache')}
          </button>
        </div>

        <div>
          <p className="text-yt-text-secondary text-xs font-semibold mb-3 uppercase tracking-wide">
            {t(language, 'sidebarQuickAccess')}
          </p>
          <div className="flex flex-col gap-3">
            {[
              { key: 'showThemeQuickAccess', label: 'showThemeIcon', value: showThemeQuickAccess },
              { key: 'showLangQuickAccess', label: 'showLangIcon', value: showLangQuickAccess },
              { key: 'showFontSizeQuickAccess', label: 'showFontSizeIcon', value: showFontSizeQuickAccess },
              { key: 'showFullscreenQuickAccess', label: 'showFullscreenIcon', value: showFullscreenQuickAccess },
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                <span className="text-yt-text-secondary group-hover:text-yt-text transition-colors text-sm font-medium">
                  {t(language, item.label)}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={item.value}
                    onChange={() => toggleSetting(item.key, item.value)}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${item.value ? 'bg-yt-accent' : 'bg-yt-bg-tertiary border border-yt-border'}`}></div>
                  <div className={`absolute start-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${item.value ? 'translate-x-4 rtl:-translate-x-4' : ''}`}></div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
