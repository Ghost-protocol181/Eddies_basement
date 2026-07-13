(() => {
  'use strict';

  // Eddie's Basement should stay focused on low-friction group games,
  // not open-ended kid/social UGC platforms, adult party clones,
  // or search placeholders that are not actual game picks.
  const BLOCKED_TITLE_KEYS = new Set([
    'roblox',
    'vrchat',
    'recroom',
    'pretendyourexyzzy',
    'jackboxstylefreefangames',
    'itchiofreemultiplayersearch',
    'steamfreemultiplayersearch'
  ]);

  const CATALOG_CACHE_KEY = 'eb-catalog-cache-v2';
  const STORAGE_LISTS = ['eb-recent', 'eb-favorites', 'eb-hidden', 'eb-played'];

  const keyFor = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const blocked = title => BLOCKED_TITLE_KEYS.has(keyFor(title));

  function filterObjects(items) {
    if (!Array.isArray(items)) return items;
    return items.filter(item => !blocked(item && item.title));
  }

  function filterRaw(raw) {
    return String(raw || '')
      .split('|')
      .filter(Boolean)
      .filter(row => !blocked(row.split('~')[0]))
      .join('|');
  }

  function scrubStoredList(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const clean = parsed.filter(title => !blocked(title));
      if (clean.length !== parsed.length) localStorage.setItem(key, JSON.stringify(clean));
    } catch {}
  }

  function scrubCatalogCache() {
    try {
      const raw = localStorage.getItem(CATALOG_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) return;
      const clean = filterObjects(parsed.items);
      if (clean.length !== parsed.items.length) {
        parsed.items = clean;
        parsed.savedAt = new Date().toISOString();
        localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(parsed));
      }
    } catch {}
  }

  if (typeof window.EDDIE_RAW === 'string') window.EDDIE_RAW = filterRaw(window.EDDIE_RAW);
  if (Array.isArray(window.EDDIE_FALLBACK)) window.EDDIE_FALLBACK = filterObjects(window.EDDIE_FALLBACK);

  scrubCatalogCache();
  STORAGE_LISTS.forEach(scrubStoredList);

  window.EDDIE_BLOCKED_TITLES = [...BLOCKED_TITLE_KEYS];
})();