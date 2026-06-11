import { useState, useRef, useEffect } from 'react';
import { Heart, RotateCw, X } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import api from '../api';

export default function AddChannelModal({ show, onClose, onAdd, categories }) {
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [favorite, setFavorite] = useState(false);
  const { language } = useTheme();
  const categoryRef = useRef(null);
  const resolveTimer = useRef(null);

  useEffect(() => {
    return () => { if (resolveTimer.current) clearTimeout(resolveTimer.current); };
  }, []);

  useEffect(() => {
    if (!show) return;
    setInput('');
    setName('');
    setResolving(false);
    setSelectedCategories([]);
    setCategoryInput('');
    setFavorite(false);
    if (resolveTimer.current) clearTimeout(resolveTimer.current);
  }, [show]);

  const availableCategories = categories.filter(c => c !== 'Unspecified' && !selectedCategories.includes(c));

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

  function addCategory(cat) {
    const trimmed = cat.trim();
    if (!trimmed || selectedCategories.includes(trimmed)) return;
    if (trimmed === t(language, 'unspecified') || trimmed === 'Unspecified') return;
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
      if (categoryInput.trim()) {
        addCategory(categoryInput);
      }
    }
    if (e.key === 'Backspace' && !categoryInput && selectedCategories.length > 0) {
      removeCategory(selectedCategories[selectedCategories.length - 1]);
    }
  }

  function reset() {
    setInput('');
    setName('');
    setSelectedCategories([]);
    setCategoryInput('');
    setFavorite(false);
  }

  function handleAdd() {
    const handle = normalizeHandle(input);
    if (!handle) return;

    onAdd({
      handle,
      name: name.trim(),
      categories: selectedCategories.length > 0 ? selectedCategories : ['Unspecified'],
      favorite,
    });

    reset();
  }

  async function populateName() {
    const handle = normalizeHandle(input);
    if (!handle) return;
    setResolving(true);
    try {
      const { data } = await api.get('/api/resolve-channel', { params: { channelHandle: handle } });
      if (data.name) setName(data.name);
    } catch {}
    setResolving(false);
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

                if (resolveTimer.current) clearTimeout(resolveTimer.current);
                resolveTimer.current = setTimeout(async () => {
                  const handle = normalizeHandle(val);
                  if (!handle) return;
                  setResolving(true);
                  try {
                    const { data } = await api.get('/api/resolve-channel', { params: { channelHandle: handle } });
                    if (data.name) setName(data.name);
                  } catch {}
                  setResolving(false);
                }, 600);
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
            <div className="relative">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t(language, 'channelName')}
                className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 pe-10 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
              />
              <button
                type="button"
                onClick={populateName}
                disabled={resolving}
                className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-yt-text-muted hover:text-yt-accent transition disabled:opacity-50"
                title={t(language, 'populateName')}
              >
                <RotateCw size={16} className={resolving ? 'animate-spin' : ''} />
              </button>
            </div>
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
                list="category-suggestions"
                className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
              />
              <datalist id="category-suggestions">
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
