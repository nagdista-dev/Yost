const videoCache = new Map();
const channelVideoCache = new Map();
const chIdCache = new Map();
const VIDEO_CACHE_TTL_MS = 30 * 60 * 1000;

function isLiveFromTitle(title) {
  if (!title) return false;
  return /(?:🔴|⏺|LIVE|PREMIERE)\b/i.test(title);
}

function parseRssStats(entryXml) {
  const viewsM = entryXml.match(/media:statistics\s+views="(\d+)"/i);
  const likesM = entryXml.match(/media:statistics\s+likes="(\d+)"/i);
  const commentsM = entryXml.match(/media:statistics\s+comments="(\d+)"/i);
  const durationM = entryXml.match(/media:content[^>]*\bduration="(\d+)"/i);
  return {
    views: viewsM ? viewsM[1] : null,
    likes: likesM ? likesM[1] : null,
    comments: commentsM ? commentsM[1] : null,
    duration: durationM ? durationM[1] : null,
  };
}

async function scrapeWatchPage(videoId) {
  try {
    const vRsp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!vRsp.ok) return {};
    const vHtml = await vRsp.text();
    const vcMatch = vHtml.match(/"viewCount"\s*:\s*"(\d+)"/);
    const ccMatch = vHtml.match(/"commentCount"\s*:\s*"(\d+)"/);
    const durMatch = vHtml.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
    const isLiveMatch = vHtml.match(/"isLiveContent"\s*:\s*true/) || vHtml.match(/"isLive"\s*:\s*true/);

    let likes = null;
    const lcMatch = vHtml.match(/"likeCount"\s*:\s*"(\d+)"/);
    if (lcMatch) {
      likes = lcMatch[1];
    } else {
      const ytMatch = vHtml.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]*?});/);
      if (ytMatch) {
        try {
          const ytData = JSON.parse(ytMatch[1]);
          if (ytData?.videoDetails?.likeCount) {
            likes = String(ytData.videoDetails.likeCount);
          }
        } catch {}
      }
    }
    if (!likes) {
      const metaMatch = vHtml.match(/<meta\s+itemprop="interactionCount"[^>]*content="UserLikes:\s*(\d+)"/i);
      if (metaMatch) likes = metaMatch[1];
    }

    return {
      views: vcMatch ? vcMatch[1] : null,
      likes,
      comments: ccMatch ? ccMatch[1] : null,
      length: durMatch ? durMatch[1] : null,
      isLive: isLiveMatch ? true : null,
    };
  } catch {
    return {};
  }
}

async function fetchDislikes(videoId) {
  try {
    const ddRsp = await fetch(`https://returnyoutubedislike.com/api/v1?videoId=${videoId}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (ddRsp.ok) {
      const dd = await ddRsp.json();
      return { dislikes: String(dd.dislikes || ''), likes: String(dd.likes || '') };
    }
  } catch (_) {}
  return { dislikes: '', likes: '' };
}

async function findChannelId(html) {
  const patterns = [
    /channel_id=(UC[\w-]+)/,
    /"channelId"\s*:\s*"(UC[\w-]+)"/,
    /\/channel\/(UC[\w-]+)/,
    /"externalId"\s*:\s*"(UC[\w-]+)"/,
    /"browseId"\s*:\s*"(UC[\w-]+)"/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  const ytData = html.match(/ytInitialData\s*=\s*({[\s\S]*?});\s*<\/script>/);
  if (ytData) {
    try {
      const data = JSON.parse(ytData[1]);
      const id = data?.metadata?.channelMetadataRenderer?.externalId
        || data?.header?.c4TabbedHeaderRenderer?.channelId
        || data?.microformat?.microformatDataRenderer?.externalId;
      if (id) return id;
    } catch {}
  }
  return null;
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
};

async function fetchWithRetry(url, options, retries = 1) {
  for (let i = 0; i <= retries; i++) {
    try {
      const rsp = await fetch(url, options);
      return rsp;
    } catch (err) {
      if (i < retries) {
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      throw err;
    }
  }
}

async function scrapeLatestVideo(handle) {
  const cacheKey = handle.toLowerCase();
  const cached = videoCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < VIDEO_CACHE_TTL_MS) {
    return cached.video;
  }

  try {
    const htmlRsp = await fetchWithRetry(`https://www.youtube.com/@${handle}`, {
      signal: AbortSignal.timeout(25000),
      headers: BROWSER_HEADERS,
    });

    if (!htmlRsp.ok) {
      console.warn(`[video] channel page returned ${htmlRsp.status} for @${handle}`);
      return null;
    }

    const html = await htmlRsp.text();

    const channelId = await findChannelId(html);
    if (!channelId) {
      console.warn(`[video] could not find channel ID in HTML for @${handle} (${html.length} bytes)`);
      return null;
    }

    console.log(`[video] found channel ID ${channelId} for @${handle}`);

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssRsp = await fetchWithRetry(rssUrl, {
      signal: AbortSignal.timeout(15000),
      headers: BROWSER_HEADERS,
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

    const rssStats = parseRssStats(entryXml);

    let views = rssStats.views || '';
    let likes = rssStats.likes || '';
    let comments = rssStats.comments || '';
    let dislikes = '';
    let videoLength = rssStats.duration || '';
    let isLive = isLiveFromTitle(title);

    const wp = await scrapeWatchPage(videoId);
    if (!views && wp.views) views = wp.views;
    if (!likes && wp.likes) likes = wp.likes;
    if (!comments && wp.comments) comments = wp.comments;
    if (wp.isLive) isLive = true;

    const ryd = await fetchDislikes(videoId);
    dislikes = ryd.dislikes;
    if (!likes && ryd.likes) likes = ryd.likes;

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
      isLive,
    };

    console.log(`[video] found: ${video.title} (${video.videoId}, ${views} views)`);
    videoCache.set(cacheKey, { video, fetchedAt: Date.now() });
    return video;
  } catch (e) {
    console.warn(`[video] error for @${handle}: ${e.message}`);
    return null;
  }
}

async function scrapeChannelVideos(handle) {

async function scrapeChannelVideos(handle) {
  const cacheKey = handle.toLowerCase();

  const cached = channelVideoCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < VIDEO_CACHE_TTL_MS) {
    console.log(`[channel] cache fresh for @${handle}`);
    return cached.data;
  }

  let channelId = '';
  let channelName = '';
  const entries = [];

  const chCached = chIdCache.get(cacheKey);
  if (chCached && chCached.channelId) {
    channelId = chCached.channelId;
    console.log(`[channel] using cached channelId ${channelId} for @${handle}`);
  } else {
    try {
      const htmlRsp = await fetchWithRetry(`https://www.youtube.com/@${handle}`, {
        signal: AbortSignal.timeout(25000),
        headers: BROWSER_HEADERS,
      });
      if (htmlRsp.ok) {
        const html = await htmlRsp.text();
        const id = await findChannelId(html);
        if (id) {
          channelId = id;
          chIdCache.set(cacheKey, { channelId });
        }
      }
    } catch (e) {
      console.warn(`[channel] page fetch failed for @${handle}: ${e.message}`);
    }
    if (!channelId) return null;
    console.log(`[channel] found channel ID ${channelId} for @${handle}`);
  }

  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssRsp = await fetchWithRetry(rssUrl, {
      signal: AbortSignal.timeout(15000),
      headers: BROWSER_HEADERS,
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
      const rssStats = parseRssStats(ex);
      entries.push({
        videoId,
        title: titleM ? titleM[1].trim() : '',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        published: pubM ? pubM[1].trim() : '',
        views: rssStats.views || '',
        likes: rssStats.likes || '',
        comments: rssStats.comments || '',
        dislikes: '',
        length: rssStats.duration || '',
        isLive: isLiveFromTitle(titleM ? titleM[1].trim() : ''),
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }
  } catch (e) {
    console.warn(`[channel] RSS parse failed for @${handle}: ${e.message}`);
  }

  console.log(`[channel] found ${entries.length} videos for @${handle}`);

  const needsScraping = entries;
  if (needsScraping.length > 0) {
    const results = await Promise.allSettled(
      needsScraping.map(e => scrapeWatchPage(e.videoId))
    );
    const dislikesResults = await Promise.allSettled(
      needsScraping.map(e => fetchDislikes(e.videoId))
    );
    needsScraping.forEach((entry, i) => {
      const wp = results[i]?.value || {};
      const dd = dislikesResults[i]?.value || {};
      if (!entry.views && wp.views) entry.views = wp.views;
      if (!entry.likes && wp.likes) entry.likes = wp.likes;
      if (!entry.likes && dd.likes) entry.likes = dd.likes;
      if (!entry.comments && wp.comments) entry.comments = wp.comments;
      if (!entry.dislikes && dd.dislikes) entry.dislikes = dd.dislikes;
      if (wp.isLive) entry.isLive = true;
    });
  }

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
