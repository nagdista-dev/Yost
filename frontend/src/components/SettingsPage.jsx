import { Moon, Sun, Languages } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function SettingsPage() {
  const { theme, language, fontSize, updateSetting } = useTheme();

  return (
    <div className="bg-yt-bg-card rounded-xl p-6 md:p-8 border border-yt-border">
      <h2 className="text-yt-text text-xl font-bold mb-6" style={{ fontSize: 'var(--font-size-xl)' }}>
        {t(language, 'settingsTitle')}
      </h2>

      <div className="space-y-7 max-w-md">
        <div>
          <p className="text-yt-text-secondary text-xs font-semibold mb-3 uppercase tracking-wide">
            {t(language, 'theme')}
          </p>
          <div className="flex gap-3">
            {['dark', 'light'].map(mode => (
              <button
                key={mode}
                onClick={() => updateSetting('theme', mode)}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
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
          <div className="flex gap-3">
            {['ar', 'en'].map(lang => (
              <button
                key={lang}
                onClick={() => updateSetting('language', lang)}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
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
          <div className="flex gap-3">
            {['small', 'medium', 'large'].map(size => (
              <button
                key={size}
                onClick={() => updateSetting('fontSize', size)}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition ${
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
      </div>
    </div>
  );
}
