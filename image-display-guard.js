(() => {
  'use strict';

  // Real-art policy:
  // - Keep real key art / store art.
  // - Do not display generated SVG covers, webpage previews, paid screenshot placeholders, or generic fallback covers.
  // - Cards without real art become clean app/link cards instead of fake cover cards.
  const BAD_IMAGE = /image\.thum\.io|screenshotmachine|urlbox|not authorized|paid account|data:image\/svg|\/Cover\.png|Cover\.png\?/i;

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
    art.classList.remove('imageUnavailable', 'usingFallback');

    const img = art.querySelector('img');
    if (img) {
      img.hidden = true;
      img.removeAttribute('srcset');
      img.dataset.rejectedArtwork = 'true';
      img.onload = null;
      img.onerror = null;
    }
  }

  function markRealArt(card) {
    const art = card?.querySelector('.art');
    if (!card || !art) return;
    card.classList.remove('noRealArt', 'browserTextCard');
    art.classList.remove('noRealArt');
    delete card.dataset.artPolicy;
    const img = art.querySelector('img');
    if (img) img.hidden = false;
  }

  function shouldRejectImage(img, art) {
    if (!img) return true;
    const src = srcFor(img);
    if (!src) return true;
    if (BAD_IMAGE.test(src)) return true;
    if (img.dataset.localCover === 'true') return true;
    if (img.dataset.rejectedArtwork === 'true') return true;
    if (art?.classList.contains('imageUnavailable')) return true;
    return false;
  }

  function checkCard(card) {
    const art = card?.querySelector('.art');
    if (!art) return;
    const img = art.querySelector('img');
    if (shouldRejectImage(img, art)) markNoRealArt(card, 'missing-or-generated-art');
    else markRealArt(card);
  }

  function checkModal() {
    const modal = document.getElementById('modal');
    const modalArt = modal?.querySelector('.modalArt');
    const img = document.getElementById('modalImg');
    if (!modal || !modalArt || !modal.classList.contains('open')) return;

    if (!img || shouldRejectImage(img, modalArt)) {
      modal.classList.add('noRealArtModal');
      if (img) {
        img.hidden = true;
        img.onload = null;
        img.onerror = null;
      }
    } else {
      modal.classList.remove('noRealArtModal');
      img.hidden = false;
    }
  }

  function run() {
    document.querySelectorAll('.card').forEach(checkCard);
    checkModal();
  }

  function clearOldGeneratedCache() {
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

  clearOldGeneratedCache();

  const observer = new MutationObserver(() => requestAnimationFrame(run));
  observer.observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['src','class','hidden'] });

  window.addEventListener('load', run);
  document.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) markNoRealArt(event.target.closest('.card'), 'image-error');
  }, true);
  setInterval(run, 1200);
})();