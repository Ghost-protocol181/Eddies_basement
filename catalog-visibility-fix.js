(() => {
  'use strict';

  // Functionality guard:
  // Missing curated artwork should not shrink the catalog.
  // Use better fallbacks in this order:
  // 1) official page preview, 2) site/app icon, 3) generic safety fallback.
  const FALLBACK_VISUAL = 'https://www.dropbox.com/scl/fi/p7jsg38fzmdnqbeayd6b9/Cover.png?rlkey=e8ngjkrda569sy9fwqs0nl4sg&st=43zxzx1l&raw=1&visual=1';
  const BROKEN_ART_PATTERN = /screenshotmachine|urlbox|not authorized|paid account|data:image\/svg/i;

  function titlesFromRaw(raw) {
    return String(raw || '')
      .split('|')
      .map(row => row.split('~')[0])
      .map(title => String(title || '').trim())
      .filter(Boolean);
  }

  function isUsableOfficialUrl(url) {
    const value = String(url || '').trim();
    return /^https?:\/\//i.test(value) && !/google\.com\/search|google\.com\/url/i.test(value);
  }

  function pagePreview(url) {
    if (!isUsableOfficialUrl(url)) return '';
    return `https://image.thum.io/get/width/960/crop/540/noanimate/${url}`;
  }

  function siteIcon(url) {
    if (!isUsableOfficialUrl(url)) return '';
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=256`;
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean).map(String))];
  }

  function resetArtworkCaches() {
    try {
      // Earlier rebuilds marked too many images as failed. Clear the failure list
      // before app.js captures it so real art, previews, and icons get another chance.
      localStorage.removeItem('eb-failed-artwork');

      const cached = JSON.parse(localStorage.getItem('eb-working-artwork') || '{}');
      if (!cached || typeof cached !== 'object') return;
      let changed = false;
      Object.keys(cached).forEach(title => {
        const url = String(cached[title] || '');
        if (!url || BROKEN_ART_PATTERN.test(url)) {
          delete cached[title];
          changed = true;
        }
      });
      if (changed) localStorage.setItem('eb-working-artwork', JSON.stringify(cached));
    } catch {}
  }

  resetArtworkCaches();

  window.EDDIE_ARTWORK = window.EDDIE_ARTWORK || {};
  window.EDDIE_URLS = window.EDDIE_URLS || {};

  titlesFromRaw(window.EDDIE_RAW).forEach(title => {
    const current = window.EDDIE_ARTWORK[title];
    const existing = Array.isArray(current) ? current.filter(Boolean) : current ? [current] : [];
    if (existing.length) return;

    const official = window.EDDIE_URLS[title];
    window.EDDIE_ARTWORK[title] = unique([
      pagePreview(official),
      siteIcon(official),
      FALLBACK_VISUAL
    ]);
  });
})();