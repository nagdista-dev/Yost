import { Innertube } from 'youtubei.js';

const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { channelHandle } = req.query;

  if (!channelHandle) {
    return res.status(400).json({ error: 'channelHandle query parameter is required' });
  }

  const handle = channelHandle.replace('@', '').trim();
  if (!handle) {
    return res.status(400).json({ error: 'Invalid channel handle' });
  }

  const cached = cache.get(handle);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({ ...cached.data, cached: true });
  }

  try {
    const yt = await Innertube.create();
    const channel = await yt.getChannel(handle);
    const communityPosts = await channel.getCommunityPosts();

    const channelName = channel.title || handle;
    const channelAvatar = channel.avatar?.[0]?.url || '';

    const posts = (communityPosts?.posts || []).map(post => {
      let text = '';
      if (post.content) {
        text = typeof post.content === 'object' && post.content.toString
          ? post.content.toString()
          : String(post.content);
      }

      const images = [];
      if (post.attachment?.image) {
        const thumbs = Array.isArray(post.attachment.image)
          ? post.attachment.image
          : [post.attachment.image];
        thumbs.forEach(t => {
          if (t?.url?.startsWith('http')) images.push(t.url);
        });
      }

      const date = post.published?.toString?.() || String(post.published || '');
      const likes = post.vote_count?.toString?.() || String(post.vote_count || '0');
      const postUrl = post.url
        ? `https://www.youtube.com${post.url}`
        : (post.share_url || '');

      return { text, images, date, likes, postUrl };
    }).filter(p => p.text || p.images.length > 0);

    const result = { channelName, channelAvatar, posts };
    cache.set(handle, { data: result, timestamp: Date.now() });

    return res.json({ ...result, cached: false });
  } catch (err) {
    console.error(`Failed to fetch posts for ${handle}:`, err.message);
    return res.status(500).json({
      error: 'Failed to fetch community posts',
      detail: err.message,
    });
  }
}
