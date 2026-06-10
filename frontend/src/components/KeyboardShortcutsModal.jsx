import { X, Keyboard } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import { useEffect } from 'react';

const SHORTCUTS = [
  { key: '?', labelKey: 'shortcutHelp' },
  { key: 's', labelKey: 'shortcutSearch' },
  { key: 'h', labelKey: 'shortcutHome' },
  { key: 'v', labelKey: 'shortcutVideos' },
  { key: 'c', labelKey: 'shortcutChannels' },
  { key: 'Esc', labelKey: 'shortcutClose' },
];

export default function KeyboardShortcutsModal({ show, onClose }) {
  const { language } = useTheme();

  useEffect(() => {
    if (!show) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-yt-card border border-yt-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-yt-border">
          <div className="flex items-center gap-2 text-yt-text font-semibold text-base">
            <Keyboard size={18} />
            <span>{t(language, 'keyboardShortcuts')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-yt-text-secondary hover:text-yt-text hover:bg-yt-bg-tertiary transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {SHORTCUTS.map(s => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-sm text-yt-text-secondary">{t(language, s.labelKey)}</span>
              <kbd className="px-2.5 py-1 bg-yt-bg-tertiary border border-yt-border rounded-md text-xs font-mono text-yt-text font-semibold">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
