(() => {
  'use strict';

  // Artwork policy:
  // Keep real key art and allow the safe visual fallback so the catalog does not look broken.
  // Only reject known screenshot-service failure placeholders or empty/broken sources.
  // Important: do not remove app.js image event handlers. The core app needs them to try
  // the next candidate when one artwork URL fails.
  const BAD_IMAGE = /screenshotmachine|urlbox|not authorized|paid account/i;

  function srcFor(img) {
    return img ? String(img.currentSrc || img.getAttribute('src') || img.src || '') : '';
  }

  function textFor(card) {
    return [
      card?.querySelector('.posterTitle h3')?.textContent,
      card?.querySelector('.posterTitle p')?.textContent,
      card?.querySelector('.body span')?.textContent,
      [...(card?.querySelectorAll('.badge') || [])].map(b => b.textContent).join(' ')
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function isBrowserLike(card) {
    const text = textFor(card);
    return /browser|no download|phone|mobile|card|chess|word|drawing|board|party|\.io|io\b/.test(text);
  }

  function markNoRealArt(card, reason = 'no-real-art') {
    const art = card?.querySelector('.art');
    if (!card || !art) return;

    card.classList.add('noRealArt');
    art.classList.add('noRealArt');
    card.dataset.artPolicy = reason;
    if (isBrowserLike(card)) card.classList.add('browserTextCard');

    art.querySelector('.skeleton')?.remove();
    art.classList.remove('usingFallback');

    const img = art.querySelector('img');
    if (img) {
      img.hidden = true;
      img.removeAttribute('srcset');
      img.dataset.rejectedArtwork = 'true';
    }
  }

  function markRealArt(card) {
    const art = card?.querySelector('.art');
    if (!card || !art) return;
    card.classList.remove('noRealArt', 'browserTextCard');
    art.classList.remove('noRealArt', 'imageUnavailable');
    delete card.dataset.artPolicy;
    const img = art.querySelector('img');
    if (img) {
      img.hidden = false;
      delete img.dataset.rejectedArtwork;
    }
  }

  function shouldRejectImage(img, art) {
    if (!img) return true;
    const src = srcFor(img);
    if (!src) return true;
    if (BAD_IMAGE.test(src)) return true;
    if (art?.classList.contains('imageUnavailable') && !src.includes('/Cover.png')) return true;
    return false;
  }

  function checkCard(card) {
    const art = card?.querySelector('.art');
    if (!art) return;
    const img = art.querySelector('img');
    if (shouldRejectImage(img, art)) markNoRealArt(card, 'missing-or-broken-art');
    else markRealArt(card);
  }

  function checkModal() {
    const modal = document.getElementById('modal');
    const modalArt = modal?.querySelector('.modalArt');
    const img = document.getElementById('modalImg');
    if (!modal || !modalArt || !modal.classList.contains('open')) return;

    if (!img || shouldRejectImage(img, modalArt)) {
      modal.classList.add('noRealArtModal');
      if (img) img.hidden = true;
    } else {
      modal.classList.remove('noRealArtModal');
      img.hidden = false;
    }
  }

  function run() {
    document.querySelectorAll('.card').forEach(checkCard);
    checkModal();
  }

  function clearOverzealousCache() {
    try {
      const cached = JSON.parse(localStorage.getItem('eb-working-artwork') || '{}');
      if (!cached || typeof cached !== 'object') return;
      let changed = false;
      Object.keys(cached).forEach(title => {
        if (BAD_IMAGE.test(String(cached[title] || ''))) {
          delete cached[title];
          changed = true;
        }
      });
      if (changed) localStorage.setItem('eb-working-artwork', JSON.stringify(cached));
    } catch {}
  }

  clearOverzealousCache();

  const observer = new MutationObserver(() => requestAnimationFrame(run));
  observer.observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['src','class','hidden'] });

  window.addEventListener('load', run);
  document.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) setTimeout(run, 80);
  }, true);
  setInterval(run, 1200);
})();