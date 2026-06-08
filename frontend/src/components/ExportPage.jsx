import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function ExportPage({ channels }) {
  const { language } = useTheme();

  function handleExport() {
    if (channels.length === 0) {
      toast.error(t(language, 'exportEmpty'));
      return;
    }
    const data = JSON.stringify(channels, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'social-tube-channels.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t(language, 'exportSuccess'));
  }

  return (
    <div className="bg-yt-bg-card rounded-xl p-6 md:p-8 border border-yt-border">
      <h2 className="text-yt-text text-xl font-bold mb-3" style={{ fontSize: 'var(--font-size-xl)' }}>
        {t(language, 'exportTitle')}
      </h2>
      <p className="text-yt-text-secondary mb-6" style={{ fontSize: 'var(--font-size-base)' }}>
        {t(language, 'exportDesc')}
      </p>

      <button
        onClick={handleExport}
        className="bg-yt-accent hover:bg-yt-accent-hover text-white px-6 py-3 rounded-lg text-base font-medium transition inline-flex items-center gap-2"
      >
        <span>📥</span>
        {t(language, 'exportBtn')}
      </button>

      {channels.length > 0 && (
        <div className="mt-6">
          <h3 className="text-yt-text-secondary text-sm font-semibold mb-3 uppercase tracking-wide">
            Saved Channels ({channels.length})
          </h3>
          <div className="space-y-2">
            {channels.map(ch => (
              <div key={ch} className="flex items-center gap-2 bg-yt-bg-tertiary rounded-lg px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-yt-accent/20 flex items-center justify-center text-yt-accent text-xs flex-shrink-0 font-bold">
                  {ch.replace('@', '').charAt(0).toUpperCase()}
                </div>
                <span className="text-yt-text text-sm">{ch}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {channels.length === 0 && (
        <p className="text-yt-text-muted text-sm mt-4">{t(language, 'exportEmpty')}</p>
      )}
    </div>
  );
}
