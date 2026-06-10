import { useState } from 'react';

const SEEN_STORAGE_KEY = 'yt_feed_seen';

export default function useSeenTracking() {
  const [seenUrls, setSeenUrls] = useState(() => {
    try {
      const raw = localStorage.getItem(SEEN_STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  function markSeen(postUrl) {
    if (!postUrl || seenUrls.has(postUrl)) return;
    const next = new Set(seenUrls);
    next.add(postUrl);
    setSeenUrls(next);
    try {
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...next]));
    } catch {}
  }

  return { seenUrls, markSeen };
}
