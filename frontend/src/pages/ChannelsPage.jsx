import { useState, useEffect, useRef } from 'react';
import { Search, Heart, Trash2, Edit2, X, ExternalLink, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function ChannelsPage({ channels, onRemoveChannel, onUpdateChannel, onToggleFavorite, categories }) {
  const { language } = useTheme();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategories, setEditCategories] = useState([]);
  const [editCategoryInput, setEditCategoryInput] = useState('');
  const editCategoryRef = useRef(null);

  // Close modals on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setConfirmDelete(null);
        setConfirmOpen(null);
        setEditing(null);
      }
    }
    if (confirmDelete || confirmOpen || editing) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [confirmDelete, confirmOpen, editing]);

  function matches(ch, query) {
    const q = query.toLowerCase();
    return (
      ch.handle.toLowerCase().includes(q) ||
      (ch.categories || []).some(c => c.toLowerCase().includes(q))
    );
  }

  const filteredChannels = channels.filter(ch => {
    const matchesSearch = matches(ch, search);
    const matchesCategory = !categoryFilter || (ch.categories || []).includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  function startEdit(ch) {
    setEditing(ch);
    setEditName(ch.name || '');
    setEditCategories([...(ch.categories || ['Unspecified'])]);
    setEditCategoryInput('');
  }

  function addEditCategory(cat) {
    const trimmed = cat.trim();
    if (!trimmed || editCategories.includes(trimmed)) return;
    if (trimmed === t(language, 'unspecified') || trimmed === 'Unspecified') return;
    setEditCategories(prev => [...prev, trimmed]);
    setEditCategoryInput('');
    editCategoryRef.current?.focus();
  }

  function removeEditCategory(cat) {
    setEditCategories(prev => prev.filter(c => c !== cat));
  }

  function handleEditCategoryKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editCategoryInput.trim()) {
        addEditCategory(editCategoryInput);
      }
    }
    if (e.key === 'Backspace' && !editCategoryInput && editCategories.length > 0) {
      removeEditCategory(editCategories[editCategories.length - 1]);
    }
  }

  function handleSaveEdit() {
    if (!editing) return;
    const cats = editCategories.length > 0 ? editCategories : ['Unspecified'];
    onUpdateChannel(editing, { ...editing, name: editName.trim(), categories: cats });
    setEditing(null);
  }

  async function populateEditName() {
    if (!editing) return;
    try {
      const { data } = await api.get('/api/resolve-channel', { params: { channelHandle: editing.handle } });
      if (data.name) setEditName(data.name);
    } catch {}
  }

  function handleConfirmDelete(ch) {
    onRemoveChannel(ch);
    setConfirmDelete(null);
    toast.success(t(language, 'channelRemoved', ch.handle));
  }

  function avatarLetter(ch) {
    return ch.handle.replace('@', '').charAt(0).toUpperCase();
  }

  const editAvailable = categories.filter(c => c !== 'Unspecified' && !editCategories.includes(c));

  return (
    <div className="space-y-6">
      <div className="bg-yt-bg-card rounded-xl p-4 md:p-6 border border-yt-border">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search size={16} className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-yt-text-muted`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t(language, 'searchChannels')}
              className={`w-full bg-yt-input text-yt-text rounded-lg py-2 md:py-2.5 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted ${language === 'ar' ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
            />
          </div>

          {categories.length > 0 && (
            <select
              value={categoryFilter || ''}
              onChange={e => setCategoryFilter(e.target.value || null)}
              className="w-full md:w-auto appearance-none px-3 py-2 pr-8 text-sm rounded-lg border border-yt-border/40 bg-yt-bg-tertiary/50 text-yt-text-secondary outline-none focus:ring-2 focus:ring-yt-accent cursor-pointer font-medium"
            >
              <option value="">{t(language, 'allCategories')}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'Unspecified' ? t(language, 'unspecified') : cat}
                </option>
              ))}
            </select>
          )}
        </div>

        {channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-yt-text-muted">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-3 opacity-40">
              <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
              <circle cx="24" cy="26" r="5" stroke="currentColor" strokeWidth="2"/>
              <path d="M28 24L22 30M22 24L28 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="text-lg" style={{ fontSize: 'var(--font-size-lg)' }}>{t(language, 'noChannels')}</p>
          </div>
        ) : filteredChannels.length === 0 ? (
          <p className="text-yt-text-muted text-sm py-8 text-center">{t(language, 'noSearchResults')}</p>
        ) : (
          (() => {
            const sorted = [...filteredChannels].sort((a, b) =>
              a.handle.replace('@', '').toLowerCase().localeCompare(b.handle.replace('@', '').toLowerCase())
            );
            const grouped = {};
            sorted.forEach(ch => {
              const letter = ch.handle.replace('@', '').charAt(0).toUpperCase();
              if (!grouped[letter]) grouped[letter] = [];
              grouped[letter].push(ch);
            });
            return Object.entries(grouped).map(([letter, chs]) => (
              <div key={letter} className="mb-6 last:mb-0">
                <h3 className="text-lg font-bold text-yt-accent mb-2 px-1 sticky top-0 bg-yt-bg-card z-10 py-2 border-b border-yt-border/60">
                  {letter}
                </h3>
                <div className="space-y-1">
                  {chs.map(ch => (
                    <div key={ch.handle}>
                      <div className="flex items-center gap-3 px-3 py-3 md:py-3 rounded-lg hover:bg-yt-bg-tertiary/50 transition group">
                        <button
                          onClick={() => onToggleFavorite(ch)}
                          className={`p-1.5 rounded-lg transition flex-shrink-0 ${
                            ch.favorite ? 'text-red-500' : 'text-yt-text-muted'
                          }`}
                          title={t(language, 'favorite')}
                        >
                          <Heart size={16} fill={ch.favorite ? 'currentColor' : 'none'} />
                        </button>

                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-yt-accent/20 flex items-center justify-center text-yt-accent text-xs md:text-sm flex-shrink-0 font-bold">
                          {avatarLetter(ch)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-yt-text text-sm md:text-base truncate">
                              {ch.handle}
                            </span>
                            <button
                              onClick={() => setConfirmOpen(ch)}
                              className="text-yt-text-muted hover:text-yt-accent p-1.5 rounded-lg flex-shrink-0 transition-colors"
                              title={t(language, 'openChannel')}
                            >
                              <ExternalLink size={14} />
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            {(ch.categories || []).filter(c => c !== 'Unspecified').map(cat => (
                              <span key={cat} className="text-yt-text-muted text-[10px] bg-yt-bg-tertiary/50 px-1.5 py-0.5 rounded">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => startEdit(ch)}
                          className="text-yt-text-muted hover:text-yt-accent p-1.5 rounded-lg transition-colors flex-shrink-0"
                          title={t(language, 'edit')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(ch)}
                          className="text-yt-text-muted hover:text-yt-accent p-1.5 rounded-lg transition-colors flex-shrink-0"
                          title={t(language, 'remove')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()
        )}
      </div>

      {confirmDelete && (
        <div className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div
            className="bg-yt-bg-card rounded-xl p-6 border border-yt-border w-full max-w-sm mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-yt-text text-lg font-bold mb-2">{t(language, 'confirmDelete')}</h2>
            <p className="text-yt-text-secondary text-sm mb-6">
              {t(language, 'removeChannelConfirm', confirmDelete.handle)}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-yt-text-secondary hover:bg-yt-bg-tertiary transition"
              >
                {t(language, 'cancel')}
              </button>
              <button
                onClick={() => handleConfirmDelete(confirmDelete)}
                className="bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                {t(language, 'remove')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setConfirmOpen(null)}>
          <div
            className="bg-yt-bg-card rounded-xl p-6 border border-yt-border w-full max-w-sm mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-yt-text text-lg font-bold mb-2">{t(language, 'openChannel')}</h2>
            <p className="text-yt-text-secondary text-sm mb-6">
              {t(language, 'openChannelConfirm', confirmOpen.handle)}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmOpen(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-yt-text-secondary hover:bg-yt-bg-tertiary transition"
              >
                {t(language, 'cancel')}
              </button>
              <button
                onClick={() => {
                  window.open(`https://www.youtube.com/${confirmOpen.handle}/videos`, '_blank', 'noopener,noreferrer');
                  setConfirmOpen(null);
                }}
                className="bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                {t(language, 'openChannel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div
            className="bg-yt-bg-card rounded-xl p-6 border border-yt-border w-full max-w-sm mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-yt-text text-lg font-bold">{t(language, 'edit')} {editing.handle}</h2>
              <button
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg text-yt-text-muted hover:text-yt-text hover:bg-yt-bg-tertiary transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
                  {t(language, 'channelName')}
                </label>
                <div className="relative">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                    placeholder={t(language, 'channelName')}
                    className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 pe-10 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={populateEditName}
                    className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-yt-text-muted hover:text-yt-accent transition"
                    title={t(language, 'populateName')}
                  >
                    <RotateCw size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
                  {t(language, 'category')}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editCategories.map(cat => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-yt-accent/10 text-yt-accent text-xs font-medium"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => removeEditCategory(cat)}
                        className="hover:bg-yt-accent/20 rounded p-0.5 transition"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  ref={editCategoryRef}
                  value={editCategoryInput}
                  onChange={e => setEditCategoryInput(e.target.value)}
                  onKeyDown={handleEditCategoryKeyDown}
                  placeholder={t(language, 'addChannel') + '...'}
                  list="edit-category-suggestions"
                  className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
                />
                <datalist id="edit-category-suggestions">
                  {editAvailable.map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {editAvailable.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editAvailable.slice(0, 6).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => addEditCategory(cat)}
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
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-yt-text-secondary hover:bg-yt-bg-tertiary transition"
              >
                {t(language, 'cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                {t(language, 'save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
