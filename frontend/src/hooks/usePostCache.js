import { useRef } from 'react';

const POST_CACHE_KEY = 'yt_feed_posts_cache';

function loadPostCache() {
  try {
    const raw = localStorage.getItem(POST_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePostCache(cacheObj) {
  try {
    localStorage.setItem(POST_CACHE_KEY, JSON.stringify(cacheObj));
  } catch {
  }
}

function getPostCache(handleLower, postCache) {
  return postCache[handleLower] || null;
}

export default function usePostCache() {
  const postCacheRef = useRef(loadPostCache());

  function updateCache(handleKey, handle, data) {
    postCacheRef.current[handleKey] = { handle, data, fetchedAt: Date.now() };
    savePostCache(postCacheRef.current);
  }

  return { postCacheRef, getPostCache, updateCache };
}
