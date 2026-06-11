import { useState } from 'react';
import { ListMusic, Trash2, ExternalLink, Play, Plus } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

export default function PlaylistsPage({ playlists, onRemovePlaylist, onSelectPlaylist, onAddPlaylist }) {
  const { language } = useTheme();

  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-yt-text-muted">
        <div className="w-16 h-16 rounded-2xl bg-yt-bg-tertiary/50 flex items-center justify-center mb-4">
          <ListMusic size={28} className="text-yt-text-muted/50" />
        </div>
        <p className="text-lg" style={{ fontSize: 'var(--font-size-lg)' }}>{t(language, 'noPlaylists')}</p>
        <p className="text-sm mt-1">{t(language, 'noPlaylistsHint')}</p>
        <button
          onClick={onAddPlaylist}
          className="mt-4 inline-flex items-center gap-1.5 bg-yt-accent hover:bg-yt-accent-hover text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus size={18} />
          {t(language, 'addPlaylist')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={onAddPlaylist}
        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-yt-border/40 text-yt-text-muted hover:text-yt-accent hover:border-yt-accent/40 transition bg-yt-bg-card/30 hover:bg-yt-bg-card cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-yt-accent/10 flex items-center justify-center shrink-0">
          <Plus size={18} className="text-yt-accent" />
        </div>
        <span className="text-sm font-medium">{t(language, 'addPlaylist')}</span>
      </button>
      {playlists.map(pl => (
        <div
          key={pl.playlistId}
          className="bg-yt-bg-card rounded-xl border border-yt-border hover:shadow-md transition cursor-pointer group"
          onClick={() => onSelectPlaylist(pl)}
        >
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-yt-accent/15 flex items-center justify-center text-yt-accent shrink-0">
              <Play size={20} fill="currentColor" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-yt-text font-semibold text-sm truncate">{pl.name || pl.playlistId}</h3>
              {pl.channelName && (
                <p className="text-yt-text-muted text-xs mt-0.5 truncate">{pl.channelName}</p>
              )}
              {(pl.categories || []).filter(c => c !== 'Unspecified').length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {pl.categories.filter(c => c !== 'Unspecified').map(cat => (
                    <span key={cat} className="text-[10px] text-yt-accent bg-yt-accent/10 px-1.5 py-0.5 rounded">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
              <a
                href={`https://www.youtube.com/playlist?list=${pl.playlistId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="p-2 rounded-lg text-yt-text-muted hover:text-yt-accent hover:bg-yt-bg-tertiary transition"
                title={t(language, 'openOnYouTube')}
              >
                <ExternalLink size={16} />
              </a>
              <button
                onClick={e => { e.stopPropagation(); onRemovePlaylist(pl); }}
                className="p-2 rounded-lg text-yt-text-muted hover:text-red-500 hover:bg-yt-bg-tertiary transition"
                title={t(language, 'remove')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
