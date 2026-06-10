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

module.exports = { acquireSemaphore, releaseSemaphore, getActiveScrapes: () => activeScrapes, getQueueLength: () => scrapeQueue.length };
