const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { acquireSemaphore, releaseSemaphore } = require('./concurrency');

puppeteer.use(StealthPlugin());

const inFlight = new Map();

async function scrapeChannel(handle, commentsCache) {
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
      await page.screenshot({ path: path.join(__dirname, '..', 'error-screenshot.png') });
      return { posts: [], channelAvatar: '', channelName: handle };
    }

    await page.evaluate(() => window.scrollBy(0, 600));
    await new Promise(r => setTimeout(r, 2500));
    await page.evaluate(() => window.scrollBy(0, 600));
    await new Promise(r => setTimeout(r, 1500));

    const channelDetails = await page.evaluate(() => {
      let avatarImg =
        document.querySelector('yt-avatar-shape img') ||
        document.querySelector('img#img') ||
        document.querySelector('#avatar img');

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

              let postUrl = '';
              const navUrl = post.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url;
              if (navUrl) {
                postUrl = navUrl.startsWith('http') ? navUrl : `https://www.youtube.com${navUrl}`;
              }

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
      } catch (_) { }
      return { commentCountByText: countMap, commentDataByUrl: commentsMap };
    });

    for (const [url, cmts] of Object.entries(commentDataByUrl)) {
      commentsCache.set(url, { comments: cmts, fetchedAt: Date.now() });
    }

    const posts = await page.evaluate((jsonCounts) => {
      function findCommentCount(node) {
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
        if (postText && jsonCounts) {
          for (const [key, count] of Object.entries(jsonCounts)) {
            if (postText.startsWith(key) || key.startsWith(postText.substring(0, 80))) {
              return count;
            }
          }
        }
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

function scrapeChannelOnce(handle, commentsCache) {
  const key = handle.toLowerCase();
  if (inFlight.has(key)) {
    console.log(`[dedup] reusing in-flight scrape for @${handle}`);
    return inFlight.get(key);
  }
  const promise = scrapeChannel(handle, commentsCache).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

function backgroundScrape(handle, cache, setCache, commentsCache) {
  const key = handle.toLowerCase();
  if (inFlight.has(key)) {
    console.log(`[background] scrape already in flight for @${handle}`);
    return;
  }
  scrapeChannelOnce(handle, commentsCache)
    .then(data => {
      setCache(cache, key, data);
      console.log(`[background] @${handle} done (${data.posts?.length || 0} posts)`);
    })
    .catch(err => console.error(`[background] @${handle} failed:`, err.message));
}

module.exports = { scrapeChannelOnce, backgroundScrape, inFlight };
