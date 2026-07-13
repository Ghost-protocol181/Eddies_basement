(() => {
  'use strict';

  // Artwork/functionality guard:
  // Missing real art should never shrink the catalog, but fake/generated panels,
  // live screenshots, blocked pages, loading screens, and favicons should never be
  // treated as premium game artwork. Priority:
  // 1) curated artwork, 2) curated preview/header art, 3) invisible safety fallback
  // so the app keeps the title available while the visual layer renders it as text-first.
  const PANEL_FALLBACK = 'panel-fallback.svg';
  const BROKEN_ART_PATTERN = /image\.thum\.io|screenshotmachine|urlbox|s\.wordpress\.com\/mshots|mshots\/v1|not authorized|paid account|google\.com\/s2\/favicons|duckduckgo\.com\/ip3|favicon|data:image\/svg/i;
  const CACHE_STALE_PATTERN = /image\.thum\.io|screenshotmachine|urlbox|s\.wordpress\.com\/mshots|mshots\/v1|not authorized|paid account|google\.com\/s2\/favicons|duckduckgo\.com\/ip3|favicon|panel-fallback\.svg|\/Cover\.png|Cover\.png\?|data:image\/svg/i;

  function titlesFromRaw(raw) {
    return String(raw || '')
      .split('|')
      .filter(Boolean)
      .map(row => String(row.split('~')[0] || '').trim())
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

  function resetArtworkCaches() {
    try {
      // Earlier rebuilds cached fake/generated panels, favicons, live screenshots,
      // and failure states. Clear those so good curated art can win again.
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

  titlesFromRaw(window.EDDIE_RAW).forEach(title => {
    const curatedArt = cleanArtValue(window.EDDIE_ARTWORK[title]);
    const curatedPreview = cleanArtValue(window.EDDIE_PREVIEWS[title]);
    const realArt = unique([...curatedArt, ...curatedPreview]);

    // Keep a final local fallback so app.js does not drop the title, but the image
    // guard will hide it and render the card as a text-first no-real-art card.
    window.EDDIE_ARTWORK[title] = realArt.length ? realArt : [PANEL_FALLBACK];
  });
})();