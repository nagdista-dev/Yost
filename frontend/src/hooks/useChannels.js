import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/useTheme';
import { t } from '../i18n';

const STORAGE_KEY = 'yt_feed_channels';

function loadChannels() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed.length > 0 && typeof parsed[0] === 'string') {
      const migrated = parsed.map(handle => ({
        handle,
        category: 'Unspecified',
        favorite: false,
      }));
      saveChannels(migrated);
      return migrated;
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveChannels(channels) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
}

export default function useChannels() {
  const [channels, setChannels] = useState(loadChannels);
  const { language } = useTheme();

  const categories = [...new Set(channels.map(c => c.category).filter(Boolean))].sort();

  function handleAddChannel(channelObj) {
    const existing = channels.find(c => c.handle.toLowerCase() === channelObj.handle.toLowerCase());
    if (existing) {
      toast.error(t(language, 'channelExists'));
      return false;
    }
    const updated = [...channels, channelObj];
    setChannels(updated);
    saveChannels(updated);
    toast.success(t(language, 'channelAdded', channelObj.handle));
    return true;
  }

  function handleRemoveChannel(channel) {
    const updated = channels.filter(c => c !== channel);
    setChannels(updated);
    saveChannels(updated);
  }

  function handleUpdateChannel(oldChannel, updatedChannel) {
    const updated = channels.map(c => c === oldChannel ? updatedChannel : c);
    setChannels(updated);
    saveChannels(updated);
    toast.success(t(language, 'channelUpdated', updatedChannel.name || updatedChannel.handle));
  }

  function handleToggleFavorite(channel) {
    const updated = channels.map(c =>
      c === channel ? { ...c, favorite: !c.favorite } : c
    );
    setChannels(updated);
    saveChannels(updated);
  }

  function handleImportChannels(imported) {
    const existing = new Map(channels.map(c => [c.handle.toLowerCase(), c]));
    let added = 0;
    imported.forEach(ch => {
      const key = ch.handle.toLowerCase();
      if (!existing.has(key)) {
        existing.set(key, {
          handle: ch.handle,
          name: ch.name || '',
          category: ch.category || 'Unspecified',
          favorite: ch.favorite || false,
        });
        added++;
      }
    });
    if (added === 0) return;
    const updated = Array.from(existing.values());
    setChannels(updated);
    saveChannels(updated);
  }

  return {
    channels, setChannels, categories,
    handleAddChannel, handleRemoveChannel,
    handleUpdateChannel, handleToggleFavorite, handleImportChannels,
  };
}
