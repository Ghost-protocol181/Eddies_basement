(() => {
  'use strict';

  // Functionality guard:
  // Missing curated artwork should not shrink the catalog.
  // Do NOT use screenshot-preview services as fallback art; they can return paid-account
  // placeholders like "Image not authorized." Do not use tiny favicons as the main panel.
  // Use real/curated art when present; otherwise use a polished local panel graphic.
  const PANEL_FALLBACK = 'panel-fallback.svg';
  const BROKEN_ART_PATTERN = /image\.thum\.io|screenshotmachine|urlbox|not authorized|paid account|data:image\/svg|google\.com\/s2\/favicons|duckduckgo\.com\/ip3|favicon/i;

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

  function cleanArtValue(value) {
    return unique((Array.isArray(value) ? value : value ? [value] : [])
      .filter(url => !BROKEN_ART_PATTERN.test(String(url || ''))));
  }

  function resetArtworkCaches() {
    try {
      // Earlier rebuilds marked too many images as failed. Clear the failure list
      // before app.js captures it so real curated art gets another chance.
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

  titlesFromRaw(window.EDDIE_RAW).forEach(title => {
    const cleaned = cleanArtValue(window.EDDIE_ARTWORK[title]);
    window.EDDIE_ARTWORK[title] = cleaned.length ? cleaned : [PANEL_FALLBACK];
  });
})();