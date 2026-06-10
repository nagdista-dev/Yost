const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { acquireSemaphore, releaseSemaphore } = require('./concurrency');

puppeteer.use(StealthPlugin());

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

    await new Promise(r => setTimeout(r, 3000));

    const jsonComments = await page.evaluate(() => {
      try {
        const data = window.ytInitialData;
        if (!data) return null;

        const results = [];

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

        const continuationContents =
          data.continuationContents?.commentSectionContinuation?.contents ||
          data.continuationContents?.itemSectionContinuation?.contents ||
          [];

        walkComments(continuationContents);

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

    console.log(`[comments] ytInitialData had no comments, trying DOM\u2026`);

    await page.evaluate(() => {
      const commentsEl = document.querySelector('#comments, ytd-comments');
      if (commentsEl) commentsEl.scrollIntoView({ behavior: 'instant', block: 'center' });
      window.scrollBy(0, 600);
    });
    await new Promise(r => setTimeout(r, 3000));

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

module.exports = { scrapePostComments, commentsCache, COMMENTS_CACHE_TTL_MS };
