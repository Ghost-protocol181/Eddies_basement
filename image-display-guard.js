(() => {
  'use strict';

  // Artwork policy:
  // Keep real key art, official page previews, and site/app icons.
  // Only reject known screenshot-service failure placeholders or empty/broken sources.
  // Important: do not remove app.js image event handlers. The core app needs them to try
  // the next candidate when one artwork URL fails.
  const BAD_IMAGE = /screenshotmachine|urlbox|not authorized|paid account/i;
  const ICON_IMAGE = /google\.com\/s2\/favicons|duckduckgo\.com\/ip3|favicon/i;

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

  function isIconImage(img) {
    return ICON_IMAGE.test(srcFor(img));
  }

  function markIconArt(card) {
    const art = card?.querySelector('.art');
    const img = art?.querySelector('img');
    if (!card || !art || !img) return;
    card.classList.remove('noRealArt', 'browserTextCard', 'qaTextCard');
    card.classList.add('iconArtCard');
    art.classList.remove('noRealArt', 'imageUnavailable', 'qaTextCard');
    art.classList.add('iconArtwork');
    delete card.dataset.artPolicy;
    art.querySelector('.skeleton')?.remove();
    img.hidden = false;
    delete img.dataset.rejectedArtwork;
  }

  function markNoRealArt(card, reason = 'no-real-art') {
    const art = card?.querySelector('.art');
    if (!card || !art) return;

    card.classList.add('noRealArt');
    card.classList.remove('iconArtCard');
    art.classList.add('noRealArt');
    art.classList.remove('iconArtwork');
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
    card.classList.remove('noRealArt', 'browserTextCard', 'iconArtCard', 'qaTextCard');
    art.classList.remove('noRealArt', 'imageUnavailable', 'iconArtwork', 'qaTextCard');
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
    if (isIconImage(img)) return false;
    if (BAD_IMAGE.test(src)) return true;
    if (art?.classList.contains('imageUnavailable') && !src.includes('/Cover.png')) return true;
    return false;
  }

  function checkCard(card) {
    const art = card?.querySelector('.art');
    if (!art) return;
    const img = art.querySelector('img');
    if (img && isIconImage(img) && !shouldRejectImage(img, art)) markIconArt(card);
    else if (shouldRejectImage(img, art)) markNoRealArt(card, 'missing-or-broken-art');
    else markRealArt(card);
  }

  function checkModal() {
    const modal = document.getElementById('modal');
    const modalArt = modal?.querySelector('.modalArt');
    const img = document.getElementById('modalImg');
    if (!modal || !modalArt || !modal.classList.contains('open')) return;

    if (img && isIconImage(img)) {
      modal.classList.remove('noRealArtModal');
      modal.classList.add('iconArtModal');
      modalArt.classList.add('iconArtwork');
      img.hidden = false;
      return;
    }

    modal.classList.remove('iconArtModal');
    modalArt.classList.remove('iconArtwork');
    if (!img || shouldRejectImage(img, modalArt)) {
      modal.classList.add('noRealArtModal');
      if (img) img.hidden = true;
    } else {
      modal.classList.remove('noRealArtModal');
      img.hidden = false;
    }
  }

  function allowIconLoadedHandler() {
    const originalLoaded = window.ebImgLoaded;
    if (!originalLoaded || originalLoaded.__iconAware) return;

    const patched = function(img, id) {
      if (img && isIconImage(img)) {
        const art = img.closest('.art,.modalArt');
        art?.querySelector('.skeleton')?.remove();
        art?.classList.remove('imageUnavailable', 'noRealArt');
        art?.classList.add('iconArtwork');
        img.hidden = false;
        delete img.dataset.rejectedArtwork;
        requestAnimationFrame(run);
        return;
      }
      return originalLoaded.call(this, img, id);
    };
    patched.__iconAware = true;
    window.ebImgLoaded = patched;
  }

  function run() {
    allowIconLoadedHandler();
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