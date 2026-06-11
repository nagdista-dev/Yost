import { useState, useRef, useEffect } from 'react';
import { X, ListMusic } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import api from '../api';

export default function AddPlaylistModal({ show, onClose, onAdd, categories }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState('');
  const { language } = useTheme();
  const categoryRef = useRef(null);
  const resolveTimer = useRef(null);

  useEffect(() => {
    return () => { if (resolveTimer.current) clearTimeout(resolveTimer.current); };
  }, []);

  useEffect(() => {
    if (!show) return;
    setUrl('');
    setName('');
    setChannelName('');
    setResolving(false);
    setSelectedCategories([]);
    setCategoryInput('');
    if (resolveTimer.current) clearTimeout(resolveTimer.current);
  }, [show]);

  const availableCategories = categories.filter(c => c !== 'Unspecified' && !selectedCategories.includes(c));

  function addCategory(cat) {
    const trimmed = cat.trim();
    if (!trimmed || selectedCategories.includes(trimmed)) return;
    if (trimmed === 'Unspecified') return;
    setSelectedCategories(prev => [...prev, trimmed]);
    setCategoryInput('');
    categoryRef.current?.focus();
  }

  function removeCategory(cat) {
    setSelectedCategories(prev => prev.filter(c => c !== cat));
  }

  function handleCategoryKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (categoryInput.trim()) addCategory(categoryInput);
    }
    if (e.key === 'Backspace' && !categoryInput && selectedCategories.length > 0) {
      removeCategory(selectedCategories[selectedCategories.length - 1]);
    }
  }

  function reset() {
    setUrl('');
    setName('');
    setChannelName('');
    setSelectedCategories([]);
    setCategoryInput('');
  }

  function getPlaylistId(inputUrl) {
    const m = inputUrl.match(/[?&]list=([^&]+)/);
    return m ? m[1] : null;
  }

  function handleAdd() {
    const playlistId = getPlaylistId(url);
    if (!playlistId) return;
    onAdd({
      playlistId,
      url: url.trim(),
      name: name.trim(),
      channelName: channelName.trim(),
      categories: selectedCategories.length > 0 ? selectedCategories : ['Unspecified'],
    });
    reset();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !categoryInput) handleAdd();
  }

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-yt-bg-card rounded-xl p-6 border border-yt-border w-full max-w-md mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-yt-text text-lg font-bold mb-5">{t(language, 'addPlaylist')}</h2>

        <div className="space-y-4">
          <div>
            <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
              {t(language, 'playlistUrl')}
            </label>
            <input
              value={url}
              onChange={e => {
                const val = e.target.value;
                setUrl(val);
                if (resolveTimer.current) clearTimeout(resolveTimer.current);
                resolveTimer.current = setTimeout(async () => {
                  const playlistId = getPlaylistId(val);
                  if (!playlistId) return;
                  setResolving(true);
                  try {
                    const { data } = await api.get('/api/resolve-playlist', { params: { playlistUrl: val } });
                    if (data.name) setName(data.name);
                    if (data.channelName) setChannelName(data.channelName);
                  } catch {}
                  setResolving(false);
                }, 600);
              }}
              onKeyDown={handleKeyDown}
              placeholder="https://youtube.com/playlist?list=..."
              className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
              autoFocus
            />
          </div>

          <div>
            <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
              {t(language, 'playlistName')}
            </label>
            <div className="relative">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t(language, 'playlistName')}
                className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 pe-10 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
              />
              <button
                type="button"
                onClick={async () => {
                  const playlistId = getPlaylistId(url);
                  if (!playlistId) return;
                  setResolving(true);
                  try {
                    const { data } = await api.get('/api/resolve-playlist', { params: { playlistUrl: url } });
                    if (data.name) setName(data.name);
                    if (data.channelName) setChannelName(data.channelName);
                  } catch {}
                  setResolving(false);
                }}
                disabled={resolving}
                className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-yt-text-muted hover:text-yt-accent transition disabled:opacity-50"
                title={t(language, 'populateName')}
              >
                <ListMusic size={16} className={resolving ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div>
            <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
              {t(language, 'channelName')}
            </label>
            <input
              value={channelName}
              onChange={e => setChannelName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(language, 'channelName')}
              className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
            />
          </div>

          <div>
            <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
              {t(language, 'category')}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedCategories.map(cat => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-yt-accent/10 text-yt-accent text-xs font-medium"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => removeCategory(cat)}
                    className="hover:bg-yt-accent/20 rounded p-0.5 transition"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                ref={categoryRef}
                value={categoryInput}
                onChange={e => setCategoryInput(e.target.value)}
                onKeyDown={handleCategoryKeyDown}
                placeholder={selectedCategories.length === 0 ? t(language, 'unspecified') : t(language, 'addChannel') + '...'}
                list="playlist-category-suggestions"
                className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
              />
              <datalist id="playlist-category-suggestions">
                {availableCategories.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            {availableCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {availableCategories.slice(0, 6).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => addCategory(cat)}
                    className="px-2 py-0.5 text-[10px] rounded-md border border-yt-border/30 text-yt-text-muted hover:text-yt-text hover:border-yt-accent/50 transition"
                  >
                    +{cat}
                  </button>
                ))}
              </div>
            )}
          </div>
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
            {t(language, 'addPlaylist')}
          </button>
        </div>
      </div>
    </div>
  );
}
