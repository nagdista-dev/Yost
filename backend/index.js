const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// ─── Disk-persisted cache ─────────────────────────────────────────────────────
// Survives server restarts so posts appear instantly on next launch.
const CACHE_FILE = path.join(__dirname, 'cache.json');
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Load cache from disk on startup */
function loadCacheFromDisk() {
    try {
        if (!fs.existsSync(CACHE_FILE)) return new Map();
        const raw = fs.readFileSync(CACHE_FILE, 'utf8');
        const obj = JSON.parse(raw);
        const map = new Map();
        for (const [k, v] of Object.entries(obj)) map.set(k, v);
        console.log(`[cache] loaded ${map.size} entries from disk`);
        return map;
    } catch (e) {
        console.warn('[cache] failed to load from disk:', e.message);
        return new Map();
    }
}

/** Flush cache to disk (debounced) */
let flushTimer = null;
function scheduleCacheFlush() {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
        try {
            const obj = {};
            cache.forEach((v, k) => { obj[k] = v; });
            fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2));
        } catch (e) {
            console.warn('[cache] failed to write to disk:', e.message);
        }
    }, 500);
}

const cache = loadCacheFromDisk();

function getCached(handle) {
    const entry = cache.get(handle.toLowerCase());
    // Return cached entry even if stale – we refresh in the background
    return entry || null;
}

function setCache(handle, data) {
    cache.set(handle.toLowerCase(), { data, fetchedAt: Date.now() });
    scheduleCacheFlush();
}

// ─── Concurrency control ──────────────────────────────────────────────────────
// Max 2 Puppeteer browsers at once to prevent RAM spikes.
const MAX_CONCURRENT = 2;
let activeScrapes = 0;
const scrapeQueue = [];

function acquireSemaphore() {
    return new Promise(resolve => {
        function tryAcquire() {
            if (activeScrapes < MAX_CONCURRENT) {
                activeScrapes++;
                resolve();
            } else {
                scrapeQueue.push(tryAcquire);
            }
        }
        tryAcquire();
    });
}

function releaseSemaphore() {
    activeScrapes--;
    if (scrapeQueue.length > 0) scrapeQueue.shift()();
}

// ─── In-flight deduplication ──────────────────────────────────────────────────
// Two simultaneous requests for the same channel share one browser.
const inFlight = new Map();

// ─── Scrape helper ────────────────────────────────────────────────────────────
async function scrapeChannel(handle) {
    await acquireSemaphore();
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--single-process',
            ],
        });

        const page = await browser.newPage();

        // Block fonts and media to cut load time and RAM
        await page.setRequestInterception(true);
        page.on('request', req => {
            if (['font', 'media'].includes(req.resourceType())) req.abort();
            else req.continue();
        });

        await page.setViewport({ width: 1280, height: 800 });

        const url = `https://www.youtube.com/@${handle}/posts`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        try {
            await page.waitForSelector('ytd-backstage-post-renderer', { timeout: 15000 });
        } catch (_) {
            console.warn(`[scraper] No posts found for @${handle}`);
            await page.screenshot({ path: path.join(__dirname, 'error-screenshot.png') });
            return { posts: [], channelAvatar: '', channelName: handle };
        }

        // Scroll down to trigger YouTube's lazy hydration of like/comment counts
        await page.evaluate(() => window.scrollBy(0, 600));
        await new Promise(r => setTimeout(r, 2500));
        await page.evaluate(() => window.scrollBy(0, 600));
        await new Promise(r => setTimeout(r, 1500));

        const channelDetails = await page.evaluate(() => {
            let avatarImg =
                document.querySelector('yt-avatar-shape img') ||
                document.querySelector('img#img') ||
                document.querySelector('#avatar img');

            // Fallback to the first post's author thumbnail if header avatar isn't found
            if (!avatarImg || !avatarImg.src) {
                avatarImg = document.querySelector('ytd-backstage-post-renderer #author-thumbnail img');
            }

            const nameEl =
                document.querySelector('#page-header yt-dynamic-sizing-formatted-string') ||
                document.querySelector('#page-header h1') ||
                document.querySelector('ytd-channel-name yt-formatted-string');
            return {
                channelAvatar: avatarImg ? avatarImg.src : '',
                channelName: nameEl ? nameEl.innerText.trim() : '',
            };
        });

        // First, extract comment counts + actual comments from YouTube's embedded JSON data
        const { commentCountByText, commentDataByUrl } = await page.evaluate(() => {
            const countMap = {};
            const commentsMap = {};
            try {
                const data = window.ytInitialData;
                if (!data) return { commentCountByText: {}, commentDataByUrl: {} };
                const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
                for (const tab of tabs) {
                    const tabRenderer = tab.tabRenderer || tab.expandableTabRenderer;
                    if (!tabRenderer) continue;
                    const sections = tabRenderer.content?.sectionListRenderer?.contents || [];
                    for (const section of sections) {
                        const items = section.itemSectionRenderer?.contents || [];
                        for (const item of items) {
                            const thread = item.backstagePostThreadRenderer;
                            const post = thread?.post?.backstagePostRenderer;
                            if (!post) continue;

                            const text = (post.contentText?.runs || [])
                                .map(r => r.text).join('').trim().substring(0, 120);
                            const count = post.commentCount || '0';
                            if (text) countMap[text] = count;

                            // Extract post URL from navigation endpoint
                            let postUrl = '';
                            const navUrl = post.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url;
                            if (navUrl) {
                                postUrl = navUrl.startsWith('http') ? navUrl : `https://www.youtube.com${navUrl}`;
                            }

                            // Extract embedded comments from the thread
                            const commentThreads = thread?.comments || [];
                            const extracted = [];
                            for (const ct of commentThreads) {
                                const cr = ct?.commentThreadRenderer?.comment?.commentRenderer;
                                if (!cr) continue;
                                const runs = cr.contentText?.runs || [];
                                extracted.push({
                                    author: cr.authorText?.simpleText || cr.authorText?.runs?.[0]?.text || '',
                                    avatar: cr.authorThumbnail?.thumbnails?.[0]?.url || '',
                                    text: runs.map(t => t.text).join('').trim(),
                                    likes: cr.voteCount?.simpleText || cr.voteCount?.accessibility?.accessibilityData?.label || '0',
                                    time: cr.publishedTimeText?.runs?.[0]?.text || '',
                                    replies: '',
                                });
                            }
                            if (extracted.length > 0 && postUrl) {
                                commentsMap[postUrl.toLowerCase()] = extracted;
                            }
                        }
                    }
                }
            } catch (_) { /* fallback to DOM */ }
            return { commentCountByText: countMap, commentDataByUrl: commentsMap };
        });

        // Store extracted comments in the global comments cache
        for (const [url, cmts] of Object.entries(commentDataByUrl)) {
            commentsCache.set(url, { comments: cmts, fetchedAt: Date.now() });
        }

        const posts = await page.evaluate((jsonCounts) => {
            function findCommentCount(node) {
                // Try direct selectors first
                const sel = node.querySelector(
                    '#comment-count, yt-formatted-string#comment-count, ' +
                    '#reply-button-end yt-formatted-string, ' +
                    'ytd-button-renderer#reply-button yt-formatted-string, ' +
                    '#action-buttons #comment-count, ' +
                    'ytd-comment-action-buttons-renderer #comment-count, ' +
                    'a[aria-label*="comment" i], ' +
                    'ytd-button-renderer[aria-label*="comment" i]'
                );
                if (sel) {
                    const txt = (sel.innerText || '').trim();
                    if (txt && txt !== '0') return { type: 'text', value: txt };
                    const aria = sel.getAttribute('aria-label') || '';
                    if (aria && /\d/.test(aria)) return { type: 'aria', value: aria };
                }

                // Broader search in the action buttons area
                const actionBar = node.querySelector(
                    '#action-bar, #actions, ytd-comment-action-buttons-renderer, #toolbar'
                );
                if (actionBar) {
                    const strings = actionBar.querySelectorAll('yt-formatted-string, span, a, button');
                    for (const el of strings) {
                        const t = (el.innerText || '').trim().toLowerCase();
                        if (t && /\d/.test(t) && (t.includes('comment') || t.includes('تعليق') || t.includes('reply') || t === '0')) return { type: 'text', value: t };
                    }
                    const ariaEls = actionBar.querySelectorAll('[aria-label]');
                    for (const el of ariaEls) {
                        const label = el.getAttribute('aria-label').toLowerCase();
                        if (label.includes('comment') || label.includes('تعليق')) return { type: 'aria', value: label };
                    }
                }

                // Last resort: any element with comment-related id or text
                const fallback = node.querySelector('[id*="comment" i], [id*="reply" i], [aria-label*="comment" i]');
                if (fallback) {
                    const t = (fallback.innerText || '').trim();
                    if (t && /\d/.test(t)) return { type: 'text', value: t };
                    const a = fallback.getAttribute('aria-label') || '';
                    if (a) return { type: 'aria', value: a };
                }

                return null;
            }

            function extractCount(result, postText) {
                // First try to match from JSON data (most reliable)
                if (postText && jsonCounts) {
                    for (const [key, count] of Object.entries(jsonCounts)) {
                        if (postText.startsWith(key) || key.startsWith(postText.substring(0, 80))) {
                            return count;
                        }
                    }
                }
                // Fallback to DOM extraction
                if (!result) return '0';
                if (result.type === 'text') {
                    const m = result.value.match(/([\d,]+K?M?)/);
                    return m ? m[1] : result.value;
                }
                if (result.type === 'aria') {
                    const m = result.value.match(/([\d,]+K?M?)\s*comment/i);
                    return m ? m[1] : '0';
                }
                return '0';
            }

            return Array.from(document.querySelectorAll('ytd-backstage-post-renderer')).map(node => {
                const textEl = node.querySelector('#content-text');
                const imageNodes = node.querySelectorAll('#image-container img, #images img');
                const likeEl = node.querySelector('#vote-count-middle');
                const dateEl = node.querySelector('#published-time-text a');
                const postText = textEl ? textEl.innerText.trim() : '';

                const commentResult = findCommentCount(node);

                return {
                  text: postText,
                  images: Array.from(imageNodes)
                    .map(img => img.src)
                    .filter(src => src && !src.startsWith('data:')),
                  likes: likeEl ? likeEl.innerText.trim() : '0',
                  comments: extractCount(commentResult, postText),
                  date: dateEl ? dateEl.innerText : '',
                  postUrl: dateEl && dateEl.href ? dateEl.href : '',
                };
            });
        }, commentCountByText);

        return { posts, channelAvatar: channelDetails.channelAvatar, channelName: channelDetails.channelName };
    } finally {
        if (browser) await browser.close();
        releaseSemaphore();
    }
}

function scrapeChannelOnce(handle) {
    const key = handle.toLowerCase();
    if (inFlight.has(key)) {
        console.log(`[dedup] reusing in-flight scrape for @${handle}`);
        return inFlight.get(key);
    }
    const promise = scrapeChannel(handle).finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
}

// ─── Background scrape ────────────────────────────────────────────────────────
// Fire-and-forget: never blocks the response. Updates cache when done.
function backgroundScrape(handle) {
    const key = handle.toLowerCase();
    if (inFlight.has(key)) {
        console.log(`[background] scrape already in flight for @${handle}`);
        return;
    }
    scrapeChannelOnce(handle)
        .then(data => {
            setCache(key, data);
            console.log(`[background] @${handle} done (${data.posts?.length || 0} posts)`);
        })
        .catch(err => console.error(`[background] @${handle} failed:`, err.message));
}

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

        // Always refresh in background so next load is fast
        if (isStale) backgroundScrape(handle);

        return res.json({ ...cached.data, fromCache: true, fetchedAt: cached.fetchedAt });
    }

    // No cache at all – return empty immediately, scrape in background
    console.log(`[cache miss] @${handle} – scraping in background`);
    backgroundScrape(handle);

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
    res.json({ ttlMs: CACHE_TTL_MS, entries, activeScrapes, queued: scrapeQueue.length });
});

// ─── Latest video scraping ──────────────────────────────────────────────────
const videoCache = new Map();
const VIDEO_CACHE_TTL_MS = 30 * 60 * 1000;

async function scrapeLatestVideo(handle) {
    const cacheKey = handle.toLowerCase();
    const cached = videoCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < VIDEO_CACHE_TTL_MS) {
        return cached.video;
    }

    // No Puppeteer needed – extract channel ID from the HTML of the channel page,
    // then fetch the RSS feed. This avoids semaphore contention with post scraping.
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

        // Extract channel ID from meta tag URL (e.g. channel_id=UC-lHJZR3Gqxm24_Vd_AJ5Yw)
        const idMatch = html.match(/channel_id=(UC[\w-]+)/);
        if (!idMatch) {
            console.warn(`[video] could not find channel ID in HTML for @${handle}`);
            return null;
        }

        const channelId = idMatch[1];

        console.log(`[video] found channel ID ${channelId} for @${handle}`);

        // Fetch the RSS feed
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

        // Parse the first entry
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

        // Fetch the video page for view count, like count, and comment count (embedded in HTML source)
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
        } catch (_) {
            // non-critical – views/likes stay empty
        }

        // Fetch dislike count from returnyoutubedislike.com (non-blocking)
        try {
            const ddRsp = await fetch(`https://returnyoutubedislike.com/api/v1?videoId=${videoId}`, {
                signal: AbortSignal.timeout(5000),
            });
            if (ddRsp.ok) {
                const dd = await ddRsp.json();
                dislikes = String(dd.dislikes || '');
            }
        } catch (_) {
            // non-critical
        }

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

// ─── Comments scraping ────────────────────────────────────────────────────────
const commentsCache = new Map();
const COMMENTS_CACHE_TTL_MS = 10 * 60 * 1000;

async function scrapePostComments(postUrl) {
    const cacheKey = postUrl.toLowerCase();
    const cached = commentsCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < COMMENTS_CACHE_TTL_MS) {
        return cached.comments;
    }

    await acquireSemaphore();
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--single-process'],
        });

        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', req => {
            if (['font', 'media'].includes(req.resourceType())) req.abort();
            else req.continue();
        });

        await page.setViewport({ width: 1280, height: 800 });

        console.log(`[comments] navigating to ${postUrl}`);
        await page.goto(postUrl, { waitUntil: 'networkidle0', timeout: 35000 });

        // Give YouTube a moment to hydrate the comment section
        await new Promise(r => setTimeout(r, 3000));

        // Try extracting from ytInitialData JSON first (most reliable)
        const jsonComments = await page.evaluate(() => {
            try {
                const data = window.ytInitialData;
                if (!data) return null;

                const results = [];

                // Walk through all possible comment locations in the response
                function walkComments(obj) {
                    if (!obj || typeof obj !== 'object') return;
                    if (obj.commentRenderer) {
                        const r = obj.commentRenderer;
                        const runs = r.contentText?.runs || [];
                        results.push({
                            author: r.authorText?.simpleText || r.authorText?.runs?.[0]?.text || '',
                            avatar: r.authorThumbnail?.thumbnails?.[0]?.url || '',
                            text: runs.map(t => t.text).join('').trim(),
                            likes: r.voteCount?.simpleText || r.voteCount?.accessibility?.accessibilityData?.label || '0',
                            time: r.publishedTimeText?.runs?.[0]?.text || '',
                            replies: '',
                        });
                        return;
                    }
                    if (Array.isArray(obj)) {
                        obj.forEach(walkComments);
                    } else {
                        for (const key of Object.keys(obj)) {
                            try { walkComments(obj[key]); } catch (_) {}
                        }
                    }
                }

                // Look in continuation contents (used for dynamically loaded comments on post pages)
                const continuationContents =
                    data.continuationContents?.commentSectionContinuation?.contents ||
                    data.continuationContents?.itemSectionContinuation?.contents ||
                    [];

                walkComments(continuationContents);

                // Also check onResponseReceivedEndpoints (used by YouTube for incremental loads)
                const endpoints = data.onResponseReceivedEndpoints || [];
                for (const ep of endpoints) {
                    const actions = ep.appendContinuationItemsAction?.continuationItems || [];
                    walkComments(actions);
                }

                return results.length > 0 ? results : null;
            } catch (_) {
                return null;
            }
        });

        if (jsonComments && jsonComments.length > 0) {
            console.log(`[comments] extracted ${jsonComments.length} from ytInitialData`);
            commentsCache.set(cacheKey, { comments: jsonComments, fetchedAt: Date.now() });
            return jsonComments;
        }

        console.log(`[comments] ytInitialData had no comments, trying DOM…`);

        // Fallback: scroll down to trigger lazy comment loading
        await page.evaluate(() => {
            const commentsEl = document.querySelector('#comments, ytd-comments');
            if (commentsEl) commentsEl.scrollIntoView({ behavior: 'instant', block: 'center' });
            window.scrollBy(0, 600);
        });
        await new Promise(r => setTimeout(r, 3000));

        // Try multiple selectors for comment threads
        let commentThreads = await page.evaluate(() => {
            const selectors = [
                'ytd-comment-thread-renderer',
                '#comments ytd-comment-thread-renderer',
                'ytd-item-section-renderer ytd-comment-thread-renderer',
                '#comment-section ytd-comment-thread-renderer',
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) return document.querySelectorAll(sel);
            }
            return [];
        });

        if (commentThreads.length === 0) {
            // Try a second scroll + wait
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await new Promise(r => setTimeout(r, 3000));

            commentThreads = await page.evaluate(() => document.querySelectorAll('ytd-comment-thread-renderer'));
        }

        if (commentThreads.length === 0) {
            console.log(`[comments] no comment threads found on page`);
            return [];
        }

        const comments = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('ytd-comment-thread-renderer')).map(thread => {
                const comment = thread.querySelector('#comment') || thread.querySelector('ytd-comment-renderer');
                if (!comment) return null;

                const avatarImg = comment.querySelector('#author-thumbnail img');
                const authorEl = comment.querySelector('#author-text span');
                const textEl = comment.querySelector('#content-text');
                const likeEl = comment.querySelector('#vote-count-middle');
                const timeEl = comment.querySelector('#published-time-text a');
                const replyEl = thread.querySelector('#reply-button-end yt-formatted-string');

                return {
                    author: authorEl ? authorEl.innerText.trim() : '',
                    avatar: avatarImg ? avatarImg.src : '',
                    text: textEl ? textEl.innerText.trim() : '',
                    likes: likeEl ? likeEl.innerText.trim() : '0',
                    time: timeEl ? timeEl.innerText.trim() : '',
                    replies: replyEl ? replyEl.innerText.trim() : '',
                };
            }).filter(Boolean);
        });

        console.log(`[comments] extracted ${comments.length} from DOM`);
        commentsCache.set(cacheKey, { comments, fetchedAt: Date.now() });
        return comments;
    } finally {
        if (browser) await browser.close();
        releaseSemaphore();
    }
}

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
// Refresh stale cached channels in the background so data is ready for users.
function warmupCache() {
    const now = Date.now();
    const stale = [];
    cache.forEach((entry, handle) => {
        if (now - entry.fetchedAt > CACHE_TTL_MS) stale.push(handle);
    });
    if (stale.length === 0) return;
    console.log(`[warmup] refreshing ${stale.length} stale channel(s) in background`);
    stale.forEach(h => backgroundScrape(h));
}

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
    warmupCache();
});
