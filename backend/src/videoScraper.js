const videoCache = new Map();
const channelVideoCache = new Map();
const chIdCache = new Map();
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
    let videoLength = '';
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
        const durMatch = vHtml.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
        if (vcMatch) views = vcMatch[1];
        if (lcMatch) likes = lcMatch[1];
        if (ccMatch) comments = ccMatch[1];
        if (durMatch) videoLength = durMatch[1];
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
      length: videoLength,
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

async function fetchVideoDetails(videoId) {
  try {
    const vRsp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!vRsp.ok) return {};
    const vHtml = await vRsp.text();
    const lcMatch = vHtml.match(/"likeCount"\s*:\s*"(\d+)"/);
    const ccMatch = vHtml.match(/"commentCount"\s*:\s*"(\d+)"/);
    const durMatch = vHtml.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
    let dislikes = '';
    const ddRsp = await fetch(`https://returnyoutubedislike.com/api/v1?videoId=${videoId}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (ddRsp.ok) {
      const dd = await ddRsp.json();
      dislikes = String(dd.dislikes || '');
    }
    return {
      likes: lcMatch ? lcMatch[1] : '',
      comments: ccMatch ? ccMatch[1] : '',
      length: durMatch ? durMatch[1] : '',
      dislikes,
    };
  } catch {
    return {};
  }
}

async function scrapeChannelVideos(handle) {
  const cacheKey = handle.toLowerCase();

  // -- in-memory result cache (fresh) --
  const cached = channelVideoCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < VIDEO_CACHE_TTL_MS) {
    console.log(`[channel] cache fresh for @${handle}`);
    return cached.data;
  }

  let channelId = '';
  let channelName = '';
  const entries = [];

  // -- try to get channelId from in-memory cache first (avoid HTML scrape) --
  const chCached = chIdCache.get(cacheKey);
  if (chCached && chCached.channelId) {
    channelId = chCached.channelId;
    console.log(`[channel] using cached channelId ${channelId} for @${handle}`);
  } else {
    try {
      const htmlRsp = await fetch(`https://www.youtube.com/@${handle}`, {
        signal: AbortSignal.timeout(20000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (htmlRsp.ok) {
        const html = await htmlRsp.text();
        const idMatch = html.match(/channel_id=(UC[\w-]+)/);
        if (idMatch) {
          channelId = idMatch[1];
          chIdCache.set(cacheKey, { channelId });
        }
      }
    } catch (e) {
      console.warn(`[channel] page fetch failed for @${handle}: ${e.message}`);
    }
    if (!channelId) return null;
    console.log(`[channel] found channel ID ${channelId} for @${handle}`);
  }

  // -- RSS feed --
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssRsp = await fetch(rssUrl, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!rssRsp.ok) {
      console.warn(`[channel] RSS feed returned ${rssRsp.status} for @${handle}`);
      return null;
    }

    const xml = await rssRsp.text();

    const nameMatch = xml.match(/<title[^>]*>([^<]+)<\/title>/);
    if (nameMatch) channelName = nameMatch[1].trim();

    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
    let entryMatch;
    while ((entryMatch = entryRegex.exec(xml)) !== null && entries.length < 15) {
      const ex = entryMatch[1];
      const vid = ex.match(/<[^:>]*:?videoId[^>]*>([^<]+)<\/[^>]*:?videoId[^>]*>/);
      if (!vid) continue;
      const videoId = vid[1].trim();
      const titleM = ex.match(/<title[^>]*>([^<]+)<\/title>/);
      const pubM = ex.match(/<published[^>]*>([^<]+)<\/published>/);
      const viewsM = ex.match(/media:statistics\s+views="(\d+)"/i);
      entries.push({
        videoId,
        title: titleM ? titleM[1].trim() : '',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        published: pubM ? pubM[1].trim() : '',
        views: viewsM ? viewsM[1] : '',
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }
  } catch (e) {
    console.warn(`[channel] RSS parse failed for @${handle}: ${e.message}`);
  }

  console.log(`[channel] found ${entries.length} videos for @${handle}`);

  const detailResults = await Promise.allSettled(
    entries.map(e => fetchVideoDetails(e.videoId))
  );
  entries.forEach((entry, i) => {
    const details = detailResults[i]?.value || {};
    entry.likes = details.likes || '';
    entry.dislikes = details.dislikes || '';
    entry.comments = details.comments || '';
    entry.length = details.length || '';
  });

  const result = {
    channelId,
    channelName: channelName || handle,
    channelHandle: `@${handle}`,
    videos: entries,
  };

  channelVideoCache.set(cacheKey, { data: result, fetchedAt: Date.now() });
  return result;
}

module.exports = { scrapeLatestVideo, scrapeChannelVideos };
