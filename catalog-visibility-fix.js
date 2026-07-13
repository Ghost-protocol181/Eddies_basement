(() => {
  'use strict';

  // Functionality guard:
  // The core app ranks and filters around whether a game has an art candidate.
  // Missing artwork should never make the catalog feel smaller, so every title
  // gets a safe visual fallback unless it already has curated artwork.
  const FALLBACK_VISUAL = 'https://www.dropbox.com/scl/fi/p7jsg38fzmdnqbeayd6b9/Cover.png?rlkey=e8ngjkrda569sy9fwqs0nl4sg&st=43zxzx1l&raw=1&visual=1';
  const BROKEN_ART_PATTERN = /image\.thum\.io|screenshotmachine|urlbox|not authorized|paid account|data:image\/svg/i;

  function titlesFromRaw(raw) {
    return String(raw || '')
      .split('|')
      .map(row => row.split('~')[0])
      .map(title => String(title || '').trim())
      .filter(Boolean);
  }

  function resetArtworkCaches() {
    try {
      // Earlier rebuilds marked too many images as failed. Clear the failure list
      // before app.js captures it so real art gets another chance to load.
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
    const current = window.EDDIE_ARTWORK[title];
    const hasCurrent = Array.isArray(current) ? current.length > 0 : Boolean(current);
    if (!hasCurrent) window.EDDIE_ARTWORK[title] = [FALLBACK_VISUAL];
  });
})();