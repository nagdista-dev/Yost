const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '..', 'cache.json');
const CACHE_TTL_MS = 30 * 60 * 1000;

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

let flushTimer = null;
function scheduleCacheFlush(cache) {
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

function getCached(cache, handle) {
  const entry = cache.get(handle.toLowerCase());
  return entry || null;
}

function setCache(cache, handle, data) {
  cache.set(handle.toLowerCase(), { data, fetchedAt: Date.now() });
  scheduleCacheFlush(cache);
}

module.exports = { loadCacheFromDisk, getCached, setCache, CACHE_TTL_MS };
