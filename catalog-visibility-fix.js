(() => {
  'use strict';

  // Artwork/functionality guard:
  // Missing art should never shrink the catalog, but generic fallback art should also
  // never override better curated/header art. Priority:
  // 1) curated artwork, 2) curated preview/header art, 3) official site screenshot,
  // 4) polished local panel fallback as the final safety net.
  const PANEL_FALLBACK = 'panel-fallback.svg';
  const BROKEN_ART_PATTERN = /image\.thum\.io|screenshotmachine|urlbox|not authorized|paid account|data:image\/svg|google\.com\/s2\/favicons|duckduckgo\.com\/ip3|favicon/i;
  const CACHE_STALE_PATTERN = /image\.thum\.io|screenshotmachine|urlbox|not authorized|paid account|data:image\/svg|google\.com\/s2\/favicons|duckduckgo\.com\/ip3|favicon|panel-fallback\.svg|\/Cover\.png|Cover\.png\?/i;
  const SEARCH_DESTINATION_PATTERN = /google\.com\/search|google\.com\/url|store\.steampowered\.com\/search|play\.google\.com\/store\/search|nintendo\.com\/us\/search|xbox\.com\/.*\/search|store\.playstation\.com\/.*\/search/i;

  function titlesFromRaw(raw) {
    return String(raw || '')
      .split('|')
      .map(row => row.split('~')[0])
      .map(title => String(title || '').trim())
      .filter(Boolean);
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean).map(String))];
  }

  function listFrom(value) {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  function cleanArtValue(value) {
    return unique(listFrom(value).filter(url => !BROKEN_ART_PATTERN.test(String(url || ''))));
  }

  function isUsableOfficialUrl(url) {
    const value = String(url || '').trim();
    return /^https?:\/\//i.test(value) && !SEARCH_DESTINATION_PATTERN.test(value);
  }

  function siteScreenshot(url) {
    if (!isUsableOfficialUrl(url)) return '';
    return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1200`;
  }

  function resetArtworkCaches() {
    try {
      // Earlier rebuilds marked too many images as failed or cached panel fallback as
      // the working image. Clear those stale decisions before app.js reads storage.
      localStorage.removeItem('eb-failed-artwork');

      const cached = JSON.parse(localStorage.getItem('eb-working-artwork') || '{}');
      if (!cached || typeof cached !== 'object') return;
      let changed = false;
      Object.keys(cached).forEach(title => {
        const url = String(cached[title] || '');
        if (!url || CACHE_STALE_PATTERN.test(url)) {
          delete cached[title];
          changed = true;
        }
      });
      if (changed) localStorage.setItem('eb-working-artwork', JSON.stringify(cached));
    } catch {}
  }

  resetArtworkCaches();

  window.EDDIE_ARTWORK = window.EDDIE_ARTWORK || {};
  window.EDDIE_PREVIEWS = window.EDDIE_PREVIEWS || {};
  window.EDDIE_URLS = window.EDDIE_URLS || {};

  titlesFromRaw(window.EDDIE_RAW).forEach(title => {
    const curatedArt = cleanArtValue(window.EDDIE_ARTWORK[title]);
    const curatedPreview = cleanArtValue(window.EDDIE_PREVIEWS[title]);
    const official = window.EDDIE_URLS[title];

    window.EDDIE_ARTWORK[title] = unique([
      ...curatedArt,
      ...curatedPreview,
      siteScreenshot(official),
      PANEL_FALLBACK
    ]);
  });
})();