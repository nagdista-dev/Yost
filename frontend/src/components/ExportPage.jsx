import { useRef } from 'react';
import { Download, Upload, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function ExportPage({ channels, onImport }) {
  const { language } = useTheme();
  const fileInputRef = useRef(null);

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error('Not an array');
        data.forEach(ch => {
          if (!ch.handle) throw new Error('Missing handle');
        });
        onImport(data);
        toast.success(t(language, 'importSuccess', data.length));
      } catch {
        toast.error(t(language, 'importError'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

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
    a.download = 'yost-channels.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t(language, 'exportSuccess'));
  }

  return (
    <div className="bg-yt-bg-card rounded-xl p-6 md:p-8 lg:p-10 border border-yt-border">
      <h2 className="text-yt-text text-xl font-bold mb-3" style={{ fontSize: 'var(--font-size-xl)' }}>
        {t(language, 'exportTitle')}
      </h2>
      <p className="text-yt-text-secondary mb-6 md:mb-8" style={{ fontSize: 'var(--font-size-base)' }}>
        {t(language, 'exportDesc')}
      </p>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleExport}
          className="bg-yt-accent hover:bg-yt-accent-hover text-white px-6 md:px-8 py-3 md:py-3.5 rounded-lg text-base font-medium transition inline-flex items-center gap-2"
        >
          <Download size={20} />
          {t(language, 'exportBtn')}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-yt-bg-tertiary hover:bg-yt-border text-yt-text px-6 md:px-8 py-3 md:py-3.5 rounded-lg text-base font-medium transition inline-flex items-center gap-2"
        >
          <Upload size={20} />
          {t(language, 'importBtn')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      <p className="text-yt-text-muted text-sm mt-3">{t(language, 'importDesc')}</p>

      {channels.length > 0 && (
        <div className="mt-8 md:mt-10">
          <h3 className="text-yt-text-secondary text-sm font-semibold mb-3 md:mb-4 uppercase tracking-wide">
            {t(language, 'tabChannels')} ({channels.length})
          </h3>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {channels.map(ch => (
              <div key={ch.handle} className="flex items-center gap-2 bg-yt-bg-tertiary rounded-lg px-3 py-2.5">
                <div className="w-7 h-7 rounded-full bg-yt-accent/20 flex items-center justify-center text-yt-accent text-xs flex-shrink-0 font-bold">
                  {ch.handle.replace('@', '').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-yt-text text-sm truncate">{ch.handle}</p>
                </div>
                {ch.favorite && (
                  <Heart size={12} className="text-red-500 ml-auto flex-shrink-0" fill="currentColor" />
                )}
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
