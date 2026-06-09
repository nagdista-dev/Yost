import { useState, useEffect } from 'react';
import { Search, Heart, Trash2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function ChannelsPage({ channels, onRemoveChannel, onUpdateChannel, onToggleFavorite, selectedCategory, onSelectCategory, categories }) {
  const { language } = useTheme();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Close modals on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setConfirmDelete(null);
        setEditing(null);
      }
    }
    if (confirmDelete || editing) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [confirmDelete, editing]);

  // Category filter UI
  const handleCategoryClick = (cat) => {
    onSelectCategory(cat === 'All' ? null : cat);
  };

  function matches(ch, query) {
    const q = query.toLowerCase();
    return (
      ch.handle.toLowerCase().includes(q) ||
      (ch.category && ch.category.toLowerCase().includes(q))
    );
  }

    const filteredChannels = channels.filter(ch => {    const matchesSearch = matches(ch, search);    const matchesCategory = !selectedCategory || ch.category === selectedCategory;    return matchesSearch && matchesCategory;  });

  function startEdit(ch) {
    setEditing(ch);
    setEditName(ch.name || '');
    setEditCategory(ch.category || 'Unspecified');
  }

  function handleSaveEdit() {
    if (!editing) return;
    onUpdateChannel(editing, { ...editing, name: editName.trim(), category: editCategory.trim() || 'Unspecified' });
    setEditing(null);
  }

  function handleConfirmDelete(ch) {
    onRemoveChannel(ch);
    setConfirmDelete(null);
    toast.success(t(language, 'channelRemoved', ch.handle));
  }

  function avatarLetter(ch) {
    return ch.handle.replace('@', '').charAt(0).toUpperCase();
  }

  return (
    <div className="space-y-6">
      <div className="bg-yt-bg-card rounded-xl p-4 md:p-6 border border-yt-border">
        <div className="relative mb-4 md:mb-5">
          <Search size={16} className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-yt-text-muted`} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t(language, 'searchChannels')}
            className={`w-full bg-yt-input text-yt-text rounded-lg py-2 md:py-2.5 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted ${language === 'ar' ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
          />
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
                      <div className="flex items-center gap-3 px-3 py-2.5 md:py-3 rounded-lg hover:bg-yt-bg-tertiary/50 transition group">
                        <button
                          onClick={() => onToggleFavorite(ch)}
                          className={`p-1 rounded-lg transition flex-shrink-0 ${
                            ch.favorite ? 'text-red-500' : 'text-transparent group-hover:text-yt-text-muted'
                          }`}
                          title={t(language, 'favorite')}
                        >
                          <Heart size={16} fill={ch.favorite ? 'currentColor' : 'none'} />
                        </button>

                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-yt-accent/20 flex items-center justify-center text-yt-accent text-xs md:text-sm flex-shrink-0 font-bold">
                          {avatarLetter(ch)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-yt-text text-sm md:text-base truncate">
                            {ch.handle}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {ch.category && ch.category !== 'Unspecified' && (
                              <>
                                <span className="text-yt-text-muted text-[10px]">·</span>
                                <span className="text-yt-text-muted text-xs">{ch.category}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => startEdit(ch)}
                          className="text-yt-text-muted hover:text-yt-accent p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          title={t(language, 'edit')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(ch)}
                          className="text-yt-text-muted hover:text-yt-accent p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmDelete(null)}>
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditing(null)}>
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
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                  placeholder={t(language, 'channelName')}
                  className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-yt-text-secondary text-xs font-medium mb-1.5 block">
                  {t(language, 'category')}
                </label>
                <input
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                  placeholder={t(language, 'unspecified')}
                  list="edit-category-suggestions"
                  className="w-full bg-yt-input text-yt-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yt-accent placeholder-yt-text-muted"
                />
                <datalist id="edit-category-suggestions">
                  <option value={t(language, 'unspecified')} />
                  {categories.filter(c => c !== 'Unspecified').map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
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
