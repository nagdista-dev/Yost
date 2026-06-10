const videoCache = new Map();
const VIDEO_CACHE_TTL_MS = 30 * 60 * 1000;

async function scrapeLatestVideo(handle) {
  const cacheKey = handle.toLowerCase();
  const cached = videoCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < VIDEO_CACHE_TTL_MS) {
    return cached.video;
  }

  try {
    const htmlRsp = await fetch(`https://www.youtube.com/@${handle}`, {
      signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!htmlRsp.ok) {
      console.warn(`[video] channel page returned ${htmlRsp.status} for @${handle}`);
      return null;
    }

    const html = await htmlRsp.text();

    const idMatch = html.match(/channel_id=(UC[\w-]+)/);
    if (!idMatch) {
      console.warn(`[video] could not find channel ID in HTML for @${handle}`);
      return null;
    }

    const channelId = idMatch[1];

    console.log(`[video] found channel ID ${channelId} for @${handle}`);

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssRsp = await fetch(rssUrl, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!rssRsp.ok) {
      console.warn(`[video] RSS feed returned ${rssRsp.status} for @${handle}`);
      return null;
    }

    const xml = await rssRsp.text();

    const entryMatch = xml.match(/<entry[^>]*>([\s\S]*?)<\/entry>/);
    if (!entryMatch) {
      console.warn(`[video] no <entry> in RSS for @${handle}`);
      return null;
    }

    const entryXml = entryMatch[1];

    const videoIdMatch = entryXml.match(/<[^:>]*:?videoId[^>]*>([^<]+)<\/[^>]*:?videoId[^>]*>/);
    const titleMatch = entryXml.match(/<title[^>]*>([^<]+)<\/title>/);
    const publishedMatch = entryXml.match(/<published[^>]*>([^<]+)<\/published>/);

    const videoId = videoIdMatch ? videoIdMatch[1].trim() : '';
    const title = titleMatch ? titleMatch[1].trim() : '';
    const publishedDate = publishedMatch ? publishedMatch[1].trim() : '';

    if (!videoId) {
      console.warn(`[video] no videoId in RSS entry for @${handle}`);
      return null;
    }

    let views = '';
    let likes = '';
    let comments = '';
    let dislikes = '';
    try {
      const vRsp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (vRsp.ok) {
        const vHtml = await vRsp.text();
        const vcMatch = vHtml.match(/"viewCount"\s*:\s*"(\d+)"/);
        const lcMatch = vHtml.match(/"likeCount"\s*:\s*"(\d+)"/);
        const ccMatch = vHtml.match(/"commentCount"\s*:\s*"(\d+)"/);
        if (vcMatch) views = vcMatch[1];
        if (lcMatch) likes = lcMatch[1];
        if (ccMatch) comments = ccMatch[1];
      }
    } catch (_) { }

    try {
      const ddRsp = await fetch(`https://returnyoutubedislike.com/api/v1?videoId=${videoId}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (ddRsp.ok) {
        const dd = await ddRsp.json();
        dislikes = String(dd.dislikes || '');
      }
    } catch (_) { }

    const video = {
      videoId,
      title,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      views,
      likes,
      comments,
      dislikes,
      length: '',
      published: publishedDate,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };

    console.log(`[video] found: ${video.title} (${video.videoId}, ${views} views)`);
    videoCache.set(cacheKey, { video, fetchedAt: Date.now() });
    return video;
  } catch (e) {
    console.warn(`[video] error for @${handle}: ${e.message}`);
    return null;
  }
}

module.exports = { scrapeLatestVideo };
