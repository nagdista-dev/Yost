import { useState, useCallback } from 'react';

const STORAGE_KEY = 'yt_saved_videos';

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSaved(saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {}
}

export default function useSavedVideos() {
  const [saved, setSaved] = useState(loadSaved);

  const isSaved = useCallback((videoId) => {
    return saved.some(s => s.videoId === videoId);
  }, [saved]);

  const toggleSave = useCallback((video) => {
    setSaved(prev => {
      const exists = prev.findIndex(s => s.videoId === video.videoId);
      if (exists >= 0) {
        const next = prev.filter(s => s.videoId !== video.videoId);
        saveSaved(next);
        return next;
      }
      const entry = {
        videoId: video.videoId,
        title: video.title,
        thumbnail: video.thumbnail,
        channelName: video._channelName || video._channelHandle,
        channelHandle: video._channelHandle,
        published: video.published,
        views: video.views,
        length: video.length,
        savedAt: Date.now(),
      };
      const next = [entry, ...prev];
      saveSaved(next);
      return next;
    });
  }, []);

  return { saved, isSaved, toggleSave };
}
