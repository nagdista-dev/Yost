const express = require('express');
const cors = require('cors');
const { loadCacheFromDisk, getCached, setCache, CACHE_TTL_MS } = require('./src/cache');
const { backgroundScrape } = require('./src/channelScraper');
const { scrapeLatestVideo, scrapeChannelVideos } = require('./src/videoScraper');
const { scrapePostComments, commentsCache } = require('./src/commentScraper');
const { getActiveScrapes, getQueueLength } = require('./src/concurrency');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const cache = loadCacheFromDisk();

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/posts', (req, res) => {
  let handle = req.query.channelHandle || req.query.handle;
  if (!handle) return res.status(400).json({ error: 'Channel handle is required' });
  if (handle.startsWith('@')) handle = handle.slice(1);

  const key = handle.toLowerCase();
  const cached = cache.get(key);

  if (cached) {
    const ageSeconds = Math.floor((Date.now() - cached.fetchedAt) / 1000);
    const isStale = Date.now() - cached.fetchedAt > CACHE_TTL_MS;
    console.log(`[cache] @${handle} ${isStale ? 'stale' : 'fresh'} (${ageSeconds}s old)`);

    if (isStale) backgroundScrape(handle, cache, setCache, commentsCache);

    return res.json({ ...cached.data, fromCache: true, fetchedAt: cached.fetchedAt });
  }

  console.log(`[cache miss] @${handle} \u2013 scraping in background`);
  backgroundScrape(handle, cache, setCache, commentsCache);

  res.json({ posts: [], channelAvatar: '', channelName: handle, fromCache: false, fetchedAt: Date.now() });
});

app.get('/api/cache', (_req, res) => {
  const entries = [];
  cache.forEach((v, k) => {
    entries.push({
      handle: k,
      fetchedAt: v.fetchedAt,
      ageSeconds: Math.floor((Date.now() - v.fetchedAt) / 1000),
      postCount: v.data.posts?.length || 0,
    });
  });
  res.json({ ttlMs: CACHE_TTL_MS, entries, activeScrapes: getActiveScrapes(), queued: getQueueLength() });
});

app.get('/api/resolve-channel', async (req, res) => {
  let handle = req.query.channelHandle || req.query.handle;
  if (!handle) return res.status(400).json({ error: 'Channel handle is required' });
  if (handle.startsWith('@')) handle = handle.slice(1);

  try {
    const htmlRsp = await fetch(`https://www.youtube.com/@${handle}`, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!htmlRsp.ok) return res.json({ name: '' });
    const html = await htmlRsp.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
    const name = titleMatch ? titleMatch[1].replace(/ - YouTube$/, '').trim() : '';
    res.json({ name });
  } catch {
    res.json({ name: '' });
  }
});

app.get('/api/resolve-playlist', async (req, res) => {
  const url = req.query.playlistUrl;
  if (!url) return res.status(400).json({ error: 'Playlist URL is required' });

  const idMatch = url.match(/[?&]list=([^&]+)/);
  if (!idMatch) return res.json({ name: '', channelName: '' });
  const playlistId = idMatch[1];

  try {
    const htmlRsp = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!htmlRsp.ok) return res.json({ name: '', channelName: '' });
    const html = await htmlRsp.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
    const name = titleMatch ? titleMatch[1].replace(/ - YouTube$/, '').trim() : '';
    const channelMatch = html.match(/"ownerName"\s*:\s*"([^"]+)"/) || html.match(/"author"[^}]*"name"\s*:\s*"([^"]+)"/);
    const channelName = channelMatch ? channelMatch[1].replace(/\\"/g, '').trim() : '';
    res.json({ name, channelName, playlistId });
  } catch {
    res.json({ name: '', channelName: '' });
  }
});

app.get('/api/playlist-videos', async (req, res) => {
  const playlistId = req.query.playlistId;
  if (!playlistId) return res.status(400).json({ error: 'playlistId is required' });

  try {
    const htmlRsp = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!htmlRsp.ok) return res.status(500).json({ error: 'Failed to fetch playlist' });
    const html = await htmlRsp.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
    const name = titleMatch ? titleMatch[1].replace(/ - YouTube$/, '').trim() : '';

    const channelMatch = html.match(/"ownerName"\s*:\s*"([^"]+)"/) || html.match(/"author"[^}]*"name"\s*:\s*"([^"]+)"/);
    const channelName = channelMatch ? channelMatch[1].replace(/\\"/g, '').trim() : '';

    const videos = [];
    const videoRegex = /"videoId"\s*:\s*"([\w-]+)"/g;
    const seen = new Set();
    let vm;
    while ((vm = videoRegex.exec(html)) !== null) {
      const vid = vm[1];
      if (!seen.has(vid)) {
        seen.add(vid);
      }
    }

    const titleRegex = /"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{[^}]*"text"\s*:\s*"([^"]+)"[^}]*\}\s*\]/g;
    const titles = [];
    let tm;
    while ((tm = titleRegex.exec(html)) !== null) {
      titles.push(tm[1]);
    }

    const thumbRegex = /"thumbnail"\s*:\s*\{\s*"thumbnails"\s*:\s*\[\s*\{[^}]*"url"\s*:\s*"([^"]+)"[^}]*\}\s*\]/g;
    const thumbs = [];
    let thm;
    while ((thm = thumbRegex.exec(html)) !== null) {
      thumbs.push(thm[1]);
    }

    const lengthRegex = /"lengthSeconds"\s*:\s*"?(\d+)"?/g;
    const lengths = [];
    let lm;
    while ((lm = lengthRegex.exec(html)) !== null) {
      lengths.push(lm[1]);
    }

    const vidArray = Array.from(seen);
    vidArray.forEach((vid, i) => {
      videos.push({
        videoId: vid,
        title: titles[i] || '',
        thumbnail: thumbs[i] || `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`,
        length: lengths[i] || '',
        position: i + 1,
      });
    });

    res.json({ name, channelName, playlistId, videos, totalVideos: videos.length });
  } catch (err) {
    console.error('[playlist-videos] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/latest-video', async (req, res) => {
  let handle = req.query.channelHandle || req.query.handle;
  if (!handle) return res.status(400).json({ error: 'Channel handle is required' });
  if (handle.startsWith('@')) handle = handle.slice(1);

  try {
    const video = await scrapeLatestVideo(handle);
    res.json({ video });
  } catch (err) {
    console.error(`[video] failed for @${handle}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/channel-videos', async (req, res) => {
  let handle = req.query.channelHandle || req.query.handle;
  if (!handle) return res.status(400).json({ error: 'Channel handle is required' });
  if (handle.startsWith('@')) handle = handle.slice(1);

  const key = `ch_videos_${handle.toLowerCase()}`;
  const cached = cache.get(key);

  if (cached) {
    const isStale = Date.now() - cached.fetchedAt > CACHE_TTL_MS;
    console.log(`[cache] ch_videos @${handle} ${isStale ? 'stale' : 'fresh'} (${Math.floor((Date.now() - cached.fetchedAt) / 1000)}s)`);

    if (isStale) {
      scrapeChannelVideos(handle).then(data => {
        if (data) setCache(cache, key, data);
      });
    }

    return res.json({ ...cached.data, fromCache: true });
  }

  try {
    const data = await scrapeChannelVideos(handle);
    if (data) setCache(cache, key, data);
    res.json(data || { videos: [] });
  } catch (err) {
    console.error(`[channel-videos] failed for @${handle}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/comments', async (req, res) => {
  const postUrl = req.query.postUrl;
  if (!postUrl) return res.status(400).json({ error: 'postUrl is required' });

  try {
    const comments = await scrapePostComments(postUrl);
    res.json({ comments });
  } catch (err) {
    console.error('[comments] failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Startup warmup ────────────────────────────────────────────────────────────
function warmupCache() {
  const now = Date.now();
  const stale = [];
  cache.forEach((entry, handle) => {
    if (now - entry.fetchedAt > CACHE_TTL_MS) stale.push(handle);
  });
  if (stale.length === 0) return;
  console.log(`[warmup] refreshing ${stale.length} stale channel(s) in background`);
  stale.forEach(h => backgroundScrape(h, cache, setCache, commentsCache));
}

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
  warmupCache();
});
