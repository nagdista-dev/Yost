import { useEffect, useState, useMemo } from 'react';
import api from '../api';

export default function useVideos(channels) {
  const [videos, setVideos] = useState({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  const allCategories = [...new Set(channels.map(ch => ch.category).filter(Boolean))];

  useEffect(() => {
    if (channels.length === 0) {
      setLoading(false);
      setProgress({ loaded: 0, total: 0 });
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setProgress({ loaded: 0, total: channels.length });
      const results = {};

      const promises = channels.map(async (ch) => {
        const handle = typeof ch === 'string' ? ch : ch.handle;
        try {
          const { data } = await api.get('/api/latest-video', { params: { channelHandle: handle } });
          if (!cancelled && data.video) {
            results[handle] = {
              ...data.video,
              _channelName: ch.name || ch.handle.replace('@', ''),
              _channelHandle: handle,
              _channelCategory: ch.category,
            };
          }
        } catch {}
        if (!cancelled) {
          setProgress(prev => ({ ...prev, loaded: prev.loaded + 1 }));
        }
      });

      await Promise.allSettled(promises);

      if (!cancelled) {
        setVideos(results);
        setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [channels]);

  const videoList = useMemo(() => {
    const filtered = Object.values(videos).filter(v => !categoryFilter || v._channelCategory === categoryFilter);

    let sorted;
    switch (sortBy) {
      case 'views':
        sorted = [...filtered].sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0));
        break;
      case 'likes':
        sorted = [...filtered].sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));
        break;
      case 'dislikes':
        sorted = [...filtered].sort((a, b) => (parseInt(b.dislikes) || 0) - (parseInt(a.dislikes) || 0));
        break;
      case 'ratio': {
        const ratio = (v) => {
          const l = parseInt(v.likes, 10);
          const w = parseInt(v.views, 10);
          return w ? l / w : 0;
        };
        sorted = [...filtered].sort((a, b) => ratio(b) - ratio(a));
        break;
      }
      default:
        sorted = [...filtered].sort((a, b) => {
          const da = a.published ? new Date(a.published).getTime() : 0;
          const db = b.published ? new Date(b.published).getTime() : 0;
          return db - da;
        });
    }

    const byViews = [...sorted].sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0));
    const byLikes = [...sorted].sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));

    const viewsRankMap = {};
    const likesRankMap = {};
    byViews.forEach((v, i) => { viewsRankMap[v.videoId] = i + 1; });
    byLikes.forEach((v, i) => { likesRankMap[v.videoId] = i + 1; });

    return sorted.map(v => ({
      ...v,
      _viewsRank: viewsRankMap[v.videoId] || null,
      _likesRank: likesRankMap[v.videoId] || null,
    }));
  }, [videos, categoryFilter, sortBy]);

  return {
    videos, loading, progress,
    videoList, allCategories,
    categoryFilter, setCategoryFilter,
    sortBy, setSortBy,
  };
}
