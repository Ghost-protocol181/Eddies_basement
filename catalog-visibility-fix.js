(() => {
  'use strict';

  // Artwork/functionality guard:
  // Missing art should never shrink the catalog, but broken live website screenshots
  // should never appear as game art. Priority:
  // 1) curated artwork, 2) curated preview/header art, 3) generated per-title panel,
  // 4) polished local panel fallback as the final safety net.
  const PANEL_FALLBACK = 'panel-fallback.svg';
  const BROKEN_ART_PATTERN = /image\.thum\.io|screenshotmachine|urlbox|s\.wordpress\.com\/mshots|mshots\/v1|not authorized|paid account|google\.com\/s2\/favicons|duckduckgo\.com\/ip3|favicon/i;
  const CACHE_STALE_PATTERN = /image\.thum\.io|screenshotmachine|urlbox|s\.wordpress\.com\/mshots|mshots\/v1|not authorized|paid account|google\.com\/s2\/favicons|duckduckgo\.com\/ip3|favicon|panel-fallback\.svg|\/Cover\.png|Cover\.png\?/i;

  function rowsFromRaw(raw) {
    return String(raw || '')
      .split('|')
      .filter(Boolean)
      .map(row => {
        const parts = row.split('~');
        return {
          title: String(parts[0] || '').trim(),
          type: String(parts[1] || '').trim(),
          platform: String(parts[2] || '').trim(),
          mode: String(parts[3] || '').trim(),
          setup: String(parts[4] || '').trim(),
          players: String(parts[5] || '').trim(),
          tags: String(parts[6] || '').trim()
        };
      })
      .filter(item => item.title);
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

  function escapeSvg(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function paletteFor(text) {
    let hash = 0;
    String(text || '').split('').forEach(char => { hash = ((hash << 5) - hash) + char.charCodeAt(0); hash |= 0; });
    const palettes = [
      ['#071426','#0f3155','#ff8a24','#36d9ff','#8cff38'],
      ['#0b1023','#26315f','#ffbf3d','#7cf2ff','#ff6b8a'],
      ['#09191d','#174a4c','#f5a33b','#5ef0b2','#d7ff5a'],
      ['#160d24','#3d245d','#ff8a24','#8fd6ff','#b6ff3d'],
      ['#11151f','#293a52','#ffb14a','#67e8f9','#f1f5f9'],
      ['#120f0a','#3c2614','#ff7a1a','#ffd166','#9cff57']
    ];
    return palettes[Math.abs(hash) % palettes.length];
  }

  function splitTitle(title) {
    const words = String(title || '').trim().split(/\s+/).filter(Boolean);
    if (words.length <= 2) return [title, ''];
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }

  function generatedPanel(item) {
    const [bg, panel, accent, cyan, lime] = paletteFor(`${item.title} ${item.type} ${item.tags}`);
    const [line1, line2] = splitTitle(item.title);
    const kicker = [item.setup, item.platform].filter(Boolean).join(' • ') || 'Free multiplayer pick';
    const sub = [item.type, item.players ? `${item.players} players` : ''].filter(Boolean).join(' • ');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${panel}"/></linearGradient>
        <radialGradient id="g1" cx="18%" cy="18%" r="70%"><stop stop-color="${cyan}" stop-opacity=".34"/><stop offset="1" stop-color="${cyan}" stop-opacity="0"/></radialGradient>
        <radialGradient id="g2" cx="88%" cy="10%" r="70%"><stop stop-color="${accent}" stop-opacity=".42"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
        <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".42"/></filter>
      </defs>
      <rect width="1200" height="675" fill="url(#bg)"/>
      <rect width="1200" height="675" fill="url(#g1)"/>
      <rect width="1200" height="675" fill="url(#g2)"/>
      <g opacity=".16"><path d="M0 118h1200M0 236h1200M0 354h1200M0 472h1200M0 590h1200M142 0v675M284 0v675M426 0v675M568 0v675M710 0v675M852 0v675M994 0v675" stroke="#fff" stroke-width="1"/></g>
      <g filter="url(#shadow)">
        <rect x="74" y="72" width="1052" height="531" rx="42" fill="#06101f" fill-opacity=".58" stroke="#ffffff" stroke-opacity=".16"/>
        <rect x="106" y="104" width="988" height="467" rx="30" fill="#0c1728" fill-opacity=".74" stroke="${cyan}" stroke-opacity=".32"/>
      </g>
      <g transform="translate(126 128)">
        <rect x="0" y="0" width="300" height="46" rx="23" fill="#ffffff" fill-opacity=".08" stroke="#ffffff" stroke-opacity=".18"/>
        <text x="24" y="31" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" letter-spacing="4">${escapeSvg(kicker.toUpperCase())}</text>
      </g>
      <g transform="translate(126 218)">
        <text x="0" y="0" fill="#fff7df" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="88" font-weight="900" letter-spacing="-4">${escapeSvg(line1)}</text>
        ${line2 ? `<text x="0" y="92" fill="#fff7df" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="88" font-weight="900" letter-spacing="-4">${escapeSvg(line2)}</text>` : ''}
        <rect x="0" y="126" width="220" height="10" rx="5" fill="${accent}"/>
        <rect x="240" y="126" width="120" height="10" rx="5" fill="${cyan}"/>
        <text x="0" y="184" fill="#d8e6f7" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800">${escapeSvg(sub)}</text>
      </g>
      <g transform="translate(840 202)" opacity=".94">
        <rect x="0" y="0" width="200" height="132" rx="28" fill="#071426" stroke="${cyan}" stroke-width="8"/>
        <circle cx="68" cy="66" r="28" fill="none" stroke="${lime}" stroke-width="10"/>
        <path d="M68 26v80M28 66h80" stroke="${lime}" stroke-width="10" stroke-linecap="round"/>
        <circle cx="150" cy="50" r="13" fill="${accent}"/>
        <circle cx="174" cy="78" r="13" fill="${cyan}"/>
      </g>
      <text x="126" y="548" fill="#ffffff" fill-opacity=".62" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" letter-spacing="5">EDDIE'S BASEMENT PICK</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function resetArtworkCaches() {
    try {
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

  rowsFromRaw(window.EDDIE_RAW).forEach(item => {
    const curatedArt = cleanArtValue(window.EDDIE_ARTWORK[item.title]);
    const curatedPreview = cleanArtValue(window.EDDIE_PREVIEWS[item.title]);

    window.EDDIE_ARTWORK[item.title] = unique([
      ...curatedArt,
      ...curatedPreview,
      generatedPanel(item),
      PANEL_FALLBACK
    ]);
  });
})();