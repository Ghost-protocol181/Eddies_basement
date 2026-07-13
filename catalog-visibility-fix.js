(() => {
  'use strict';

  // Functionality guard:
  // The core app ranks and filters around whether a game has an art candidate.
  // Missing artwork should never make the catalog feel smaller, so every title
  // gets a safe visual fallback unless it already has curated artwork.
  const FALLBACK_VISUAL = 'https://www.dropbox.com/scl/fi/p7jsg38fzmdnqbeayd6b9/Cover.png?rlkey=e8ngjkrda569sy9fwqs0nl4sg&st=43zxzx1l&raw=1&visual=1';

  function titlesFromRaw(raw) {
    return String(raw || '')
      .split('|')
      .map(row => row.split('~')[0])
      .map(title => String(title || '').trim())
      .filter(Boolean);
  }

  function clearBadFallbackCache() {
    try {
      const failed = JSON.parse(localStorage.getItem('eb-failed-artwork') || '[]');
      if (!Array.isArray(failed)) return;
      const clean = failed.filter(url => !String(url || '').includes('/Cover.png'));
      if (clean.length !== failed.length) localStorage.setItem('eb-failed-artwork', JSON.stringify(clean));
    } catch {}
  }

  clearBadFallbackCache();

  window.EDDIE_ARTWORK = window.EDDIE_ARTWORK || {};

  titlesFromRaw(window.EDDIE_RAW).forEach(title => {
    const current = window.EDDIE_ARTWORK[title];
    const hasCurrent = Array.isArray(current) ? current.length > 0 : Boolean(current);
    if (!hasCurrent) window.EDDIE_ARTWORK[title] = [FALLBACK_VISUAL];
  });
})();
