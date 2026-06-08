import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://yost-hazel.vercel.app',
  'https://yost-two.vercel.app',
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'Yost API',
    version: '1.1.0',
    status: 'ok',
    endpoints: {
      '/': 'GET — API info',
      '/api/posts?channelUrl=...': 'GET — Fetch community posts for a YouTube channel (Puppeteer scrape)',
      '/api/channel-info?channelUrl=...': 'GET — Fetch channel name & avatar via OG meta tags',
    },
    note: 'Puppeteer-based /api/posts requires a runtime with Chrome (not available on Vercel serverless — deploy on Railway or Render instead)',
  });
});

const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

function getCacheKey(channelUrl) {
  const match = channelUrl.match(/@([\w-]+)/);
  return match ? match[1] : channelUrl;
}

function getFromCache(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeChannelPosts(channelUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const randomDelay = 1000 + Math.random() * 2000;
    await delay(randomDelay);

    const postsUrl = channelUrl.endsWith('/posts') ? channelUrl : `${channelUrl}/posts`;
    await page.goto(postsUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('#contents ytd-post-renderer, #contents ytd-backstage-post-thread-renderer', {
      timeout: 15000,
    });

    await delay(3000);

    const result = await page.evaluate(() => {
      const channelNameEl = document.querySelector('#owner #channel-name a, #owner .ytd-channel-name a, ytd-backstage-post-renderer #author-name a, ytd-post-renderer #author-name a');
      const channelName = channelNameEl ? channelNameEl.textContent.trim() : '';

      const avatarEl = document.querySelector('#owner #avatar img, #owner .ytd-channel-name img, ytd-backstage-post-renderer #author-thumbnail img, ytd-post-renderer #author-thumbnail img, #avatar img');
      const channelAvatar = avatarEl ? avatarEl.src : '';

      const postElements = document.querySelectorAll('#contents ytd-post-renderer, #contents ytd-backstage-post-thread-renderer');

      const posts = [];
      const maxPosts = 20;

      for (let i = 0; i < Math.min(postElements.length, maxPosts); i++) {
        const post = postElements[i];

        const contentEl = post.querySelector('#content-text, #message');
        const text = contentEl ? contentEl.textContent.trim() : '';

        const images = [];
        const imageEls = post.querySelectorAll(
          'img#main-image, ' +
          'ytd-image-thumbnail img, ' +
          '#image img, ' +
          '.yt-core-image, ' +
          'img[data-thumb], ' +
          'ytd-image-viewer img, ' +
          '#content img[src*="yt3"], ' +
          'img[src*="yt3.googleusercontent.com"]'
        );
        const seen = new Set();
        imageEls.forEach(img => {
          const src = img.src || img.getAttribute('data-thumb') || img.getAttribute('data-src');
          if (src && src.startsWith('http') && !seen.has(src)) {
            seen.add(src);
            images.push(src);
          }
        });

        const dateEl = post.querySelector('#published-time-text a, #header-actions #published-time-text a');
        const date = dateEl ? dateEl.textContent.trim() : '';

        const likesEl = post.querySelector('#vote-count-middle, #action-buttons-bar #vote-count-middle');
        const likes = likesEl ? likesEl.textContent.trim() : '0';

        const postLinkEl = post.querySelector('#published-time-text a, #header-actions #published-time-text a');
        const postUrl = postLinkEl ? `https://www.youtube.com${postLinkEl.getAttribute('href')}` : '';

        if (text || images.length > 0) {
          posts.push({
            text,
            images,
            date,
            likes,
            postUrl,
          });
        }
      }

      return { channelName, channelAvatar, posts };
    });

    return result;
  } finally {
    await browser.close();
  }
}

app.get('/api/channel-info', async (req, res) => {
  const { channelUrl } = req.query;

  if (!channelUrl) {
    return res.status(400).json({ error: 'channelUrl query parameter is required' });
  }

  try {
    const response = await fetch(channelUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await response.text();

    let name = '';

    const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (ogMatch) name = ogMatch[1];

    if (!name) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        name = titleMatch[1].replace(/\s*-\s*YouTube$/, '').trim();
      }
    }

    const twitterMatch = html.match(/<meta\s+name="twitter:title"\s+content="([^"]+)"/i);
    if (!name && twitterMatch) name = twitterMatch[1];

    const avatarMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    const avatar = avatarMatch ? avatarMatch[1] : '';

    res.json({ name: name || '', avatar });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch channel info', detail: err.message });
  }
});

app.get('/api/posts', async (req, res) => {
  const { channelUrl } = req.query;

  if (!channelUrl) {
    return res.status(400).json({ error: 'channelUrl query parameter is required' });
  }

  if (!channelUrl.includes('youtube.com') && !channelUrl.includes('youtu.be')) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  const cacheKey = getCacheKey(channelUrl);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const data = await scrapeChannelPosts(channelUrl);

      if (data.posts.length === 0) {
        return res.json({
          channelName: data.channelName,
          channelAvatar: data.channelAvatar,
          posts: [],
          message: 'No community posts found for this channel. The channel may not have the Community tab enabled.',
        });
      }

      setCache(cacheKey, data);
      return res.json({ ...data, cached: false });
    } catch (err) {
      lastError = err;
      if (attempt < 2) {
        await delay(2000);
      }
    }
  }

  console.error(`Failed to scrape ${channelUrl}:`, lastError.message);
  res.status(500).json({
    error: 'Failed to fetch community posts',
    detail: lastError.message,
  });
});

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
