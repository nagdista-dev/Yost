import { useState, useEffect, useCallback } from 'react';
import { ThemeContext } from './themeContext';

const STORAGE_KEY = 'yt_feed_settings';

const defaultSettings = {
  theme: 'light',
  language: 'ar',
  fontSize: 'medium',
  showThemeQuickAccess: true,
  showLangQuickAccess: true,
  showFontSizeQuickAccess: true,
  showFullscreenQuickAccess: true,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-lang', settings.language);
    document.documentElement.setAttribute('data-font-size', settings.fontSize);
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <ThemeContext.Provider value={{ ...settings, updateSetting }}>
      {children}
    </ThemeContext.Provider>
  );
}
