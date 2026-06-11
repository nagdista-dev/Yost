import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const STORAGE_KEY = 'yt_feed_playlists';

function loadPlaylists() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function savePlaylists(playlists) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
}

export default function usePlaylists() {
  const [playlists, setPlaylists] = useState(loadPlaylists);
  const { language } = useTheme();

  function handleAddPlaylist(playlist) {
    const existing = playlists.find(p => p.playlistId === playlist.playlistId);
    if (existing) {
      toast.error('Playlist already added');
      return false;
    }
    const updated = [...playlists, { ...playlist, categories: playlist.categories || ['Unspecified'], favorite: false }];
    setPlaylists(updated);
    savePlaylists(updated);
    toast.success(t(language, 'playlistAdded', playlist.name || playlist.playlistId));
    return true;
  }

  function handleRemovePlaylist(playlist) {
    const updated = playlists.filter(p => p !== playlist);
    setPlaylists(updated);
    savePlaylists(updated);
    toast.success(t(language, 'playlistRemoved', playlist.name || playlist.playlistId));
  }

  function handleUpdatePlaylist(oldPlaylist, updatedPlaylist) {
    const updated = playlists.map(p => p === oldPlaylist ? updatedPlaylist : p);
    setPlaylists(updated);
    savePlaylists(updated);
  }

  function handleToggleFavorite(playlist) {
    const updated = playlists.map(p =>
      p === playlist ? { ...p, favorite: !p.favorite } : p
    );
    setPlaylists(updated);
    savePlaylists(updated);
  }

  const playlistCategories = [...new Set(playlists.flatMap(p => p.categories || []).filter(Boolean))].sort();

  return {
    playlists, playlistCategories,
    handleAddPlaylist, handleRemovePlaylist,
    handleUpdatePlaylist, handleToggleFavorite,
  };
}
