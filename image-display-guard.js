(() => {
  'use strict';

  // Keep the shelf looking like a game library, not a wall of website screenshots.
  // Real key art/store headers stay. Website screenshots/previews become Eddie covers.
  const PREVIEW_IMAGE = /image\.thum\.io|screenshotmachine|urlbox|not authorized|paid account/i;
  const REAL_ART = /steamstatic\.com|store_item_assets|steamcdn-a\.akamaihd\.net|cdn2\.unrealengine\.com|images\.contentstack\.io|fastcdn\.hoyoverse\.com|ctfassets\.net/i;

  const esc = value => String(value || '').replace(/[&<>"']/g, s => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[s]));

  function hash(value) {
    return [...String(value || 'Game')].reduce((a,c)=>(a * 31 + c.charCodeAt(0)) >>> 0, 2166136261);
  }

  function wrapTitle(title) {
    const words = String(title || 'Game').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const next = line ? `${line} ${word}` : word;
      if (next.length > 17 && line) { lines.push(line); line = word; }
      else line = next;
    });
    if (line) lines.push(line);
    return lines.slice(0, 3);
  }

  function localCover(title, subtitle='MULTIPLAYER') {
    const h = hash(title);
    const hueA = h % 360;
    const hueB = (h * 7) % 360;
    const lines = wrapTitle(title);
    const titleText = lines.map((line,i)=>`<text x="72" y="${306 + i * 76}" font-size="68" font-weight="900" letter-spacing="-2" fill="#fff3d4">${esc(line)}</text>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="hsl(${hueA},82%,30%)"/>
          <stop offset=".55" stop-color="#0b1b33"/>
          <stop offset="1" stop-color="hsl(${hueB},78%,24%)"/>
        </linearGradient>
        <radialGradient id="glow" cx="26%" cy="18%" r="70%">
          <stop offset="0" stop-color="#ffb14a" stop-opacity=".62"/>
          <stop offset=".38" stop-color="#36d9ff" stop-opacity=".18"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#bg)"/>
      <rect width="1200" height="675" fill="url(#glow)"/>
      <path d="M0 514 C260 438 420 602 662 516 C862 444 1004 492 1200 418 L1200 675 L0 675 Z" fill="#07101f" opacity=".72"/>
      <g opacity=".22" stroke="#fff3d4" stroke-width="2">
        <path d="M72 112 H1128"/><path d="M72 574 H1128"/>
      </g>
      <text x="72" y="116" font-size="28" font-weight="900" letter-spacing="6" fill="#ffb14a">EDDIE'S BASEMENT</text>
      ${titleText}
      <text x="72" y="604" font-size="30" font-weight="900" letter-spacing="4" fill="#c8d8ec">${esc(String(subtitle || 'MULTIPLAYER').toUpperCase())}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function titleFromCard(card) {
    return card?.querySelector('.posterTitle h3')?.textContent?.trim()
      || card?.getAttribute('aria-label')?.replace(/^View\s+/i,'').trim()
      || 'Multiplayer Game';
  }

  function subtitleFromCard(card) {
    return card?.querySelector('.posterTitle p')?.textContent?.trim()
      || card?.querySelector('.body span')?.textContent?.trim()
      || 'Multiplayer';
  }

  function srcFor(img) {
    return img ? String(img.currentSrc || img.getAttribute('src') || img.src || '') : '';
  }

  function shouldReplaceImage(img, art) {
    if (!img) return true;
    const src = srcFor(img);
    if (!src) return true;
    if (img.dataset.localCover === 'true') return false;
    if (PREVIEW_IMAGE.test(src)) return true;
    if (art?.classList.contains('imageUnavailable')) return true;
    return false;
  }

  function coverCard(card) {
    const art = card?.querySelector('.art');
    if (!art) return;
    const title = titleFromCard(card);
    const subtitle = subtitleFromCard(card);
    let img = art.querySelector('img');
    if (!shouldReplaceImage(img, art)) return;
    if (!img) {
      img = document.createElement('img');
      img.alt = `${title} game artwork`;
      img.decoding = 'async';
      art.insertBefore(img, art.querySelector('.favoriteBtn') || art.firstChild);
    }
    img.src = localCover(title, subtitle);
    img.dataset.localCover = 'true';
    img.onload = null;
    img.onerror = null;
    img.removeAttribute('loading');
    art.classList.remove('imageUnavailable','usingFallback');
    art.querySelector('.skeleton')?.remove();
  }

  function coverModal() {
    const modal = document.getElementById('modal');
    if (!modal?.classList.contains('open')) return;
    const title = modal.querySelector('.modalInner h2')?.textContent?.trim() || 'Multiplayer Game';
    const subtitle = modal.querySelector('.modalInner .facts span')?.textContent?.trim() || 'Multiplayer';
    const img = document.getElementById('modalImg');
    if (!img) return;
    const src = srcFor(img);
    if (!src || PREVIEW_IMAGE.test(src) || img.closest('.modalArt')?.classList.contains('imageUnavailable')) {
      img.src = localCover(title, subtitle);
      img.dataset.localCover = 'true';
      img.onload = null;
      img.onerror = null;
    }
  }

  function run() {
    document.querySelectorAll('.card').forEach(coverCard);
    coverModal();
  }

  const observer = new MutationObserver(() => requestAnimationFrame(run));
  observer.observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['src','class'] });
  window.addEventListener('load', run);
  document.addEventListener('error', event => {
    const img = event.target;
    if (img instanceof HTMLImageElement) coverCard(img.closest('.card'));
  }, true);
  setInterval(run, 900);
})();