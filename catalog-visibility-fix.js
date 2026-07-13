(() => {
  'use strict';

  // Functionality guard:
  // Missing curated artwork should not shrink the catalog.
  // Do NOT use screenshot-preview services as fallback art; they can return paid-account
  // placeholders like "Image not authorized." Use official site/app icons instead.
  const FALLBACK_VISUAL = 'https://www.dropbox.com/scl/fi/p7jsg38fzmdnqbeayd6b9/Cover.png?rlkey=e8ngjkrda569sy9fwqs0nl4sg&st=43zxzx1l&raw=1&visual=1';
  const BROKEN_ART_PATTERN = /image\.thum\.io|screenshotmachine|urlbox|not authorized|paid account|data:image\/svg/i;

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

  function siteIcon(url) {
    if (!isUsableOfficialUrl(url)) return '';
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=256`;
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean).map(String))];
  }

  function cleanArtValue(value) {
    return unique((Array.isArray(value) ? value : value ? [value] : [])
      .filter(url => !BROKEN_ART_PATTERN.test(String(url || ''))));
  }

  function resetArtworkCaches() {
    try {
      // Earlier rebuilds marked too many images as failed. Clear the failure list
      // before app.js captures it so real art and icons get another chance.
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
    const cleaned = cleanArtValue(window.EDDIE_ARTWORK[title]);
    if (cleaned.length) {
      window.EDDIE_ARTWORK[title] = cleaned;
      return;
    }

    const official = window.EDDIE_URLS[title];
    window.EDDIE_ARTWORK[title] = unique([
      siteIcon(official),
      FALLBACK_VISUAL
    ]);
  });
})();