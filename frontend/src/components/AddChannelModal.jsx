import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function AddChannelModal({ show, onClose, onAdd, categories }) {
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [favorite, setFavorite] = useState(false);
  const { language } = useTheme();

  function normalizeHandle(raw) {
    let handle = raw.trim();
    if (!handle) return '';
    if (handle.includes('youtube.com') || handle.includes('youtu.be')) {
      const match = handle.match(/@([\w.-]+)/);
      if (match) handle = `@${match[1]}`;
      else return '';
    }
    if (!handle.startsWith('@')) {
      handle = `@${handle}`;
    }
    return handle;
  }

  function reset() {
    setInput('');
    setName('');
    setCategory('');
    setFavorite(false);
  }

  function handleAdd() {
    const handle = normalizeHandle(input);
    if (!handle) return;

    onAdd({
      handle,
      name: name.trim(),
      category: category.trim() || 'Unspecified',
      favorite,
    });

    reset();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd();
  }

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-yt-bg-card rounded-xl p-6 border border-yt-border w-full max-w-md mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-yt-text text-lg font-bold mb-5">{t(language, 'addChannel')}</h2>

        <div className="space-y-4">
          <div>
            <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
              {t(language, 'addPlaceholder')}
            </label>
            <input
              value={input}
              onChange={e => {
                const val = e.target.value;
                setInput(val);
                let nameVal = val.trim();
                if (nameVal.includes('youtube.com') || nameVal.includes('youtu.be')) {
                  const match = nameVal.match(/@([\w.-]+)/);
                  if (match) nameVal = match[1];
                }
                nameVal = nameVal.replace(/^@/, '');
                nameVal = nameVal.replace(/[_#\-:/\\]+/g, ', ');
                nameVal = nameVal.replace(/\.(?=[A-Za-z])/g, '. ');
                nameVal = nameVal.replace(/([A-Z])/g, ' $1').trim();
                let formatted = nameVal.charAt(0).toUpperCase() + nameVal.slice(1);
                formatted = formatted.replace(/\s+/g, ' ').replace(/, ,/g, ', ').replace(/,+/g, ',').trim();
                setName(formatted);
              }}
              onKeyDown={handleKeyDown}
              placeholder={t(language, 'addPlaceholder')}
              className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
              autoFocus
            />
          </div>

          <div>
            <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
              {t(language, 'channelName')}
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(language, 'channelName')}
              className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
            />
          </div>

          <div>
            <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
              {t(language, 'category')}
            </label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder={t(language, 'unspecified')}
              list="category-suggestions"
              className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
            />
            <datalist id="category-suggestions">
              <option value={t(language, 'unspecified')} />
              {categories.filter(c => c !== 'Unspecified').map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              className={`p-1.5 rounded-lg transition ${
                favorite
                  ? 'text-red-500'
                  : 'text-yt-text-muted group-hover:text-yt-text-secondary'
              }`}
            >
              <Heart size={20} fill={favorite ? 'currentColor' : 'none'} />
            </button>
            <span className="text-yt-text text-sm font-medium">{t(language, 'addToFavorites')}</span>
          </label>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={() => { reset(); onClose(); }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-yt-text-secondary hover:bg-yt-bg-tertiary transition"
          >
            {t(language, 'cancel')}
          </button>
          <button
            onClick={handleAdd}
            className="bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {t(language, 'addChannel')}
          </button>
        </div>
      </div>
    </div>
  );
}
