(() => {
  'use strict';

  // Keep the shelf looking like a game library, not a wall of website screenshots.
  // Real key art/store headers stay. Website screenshots/previews become Eddie covers.
  const PREVIEW_IMAGE = /image\.thum\.io|screenshotmachine|urlbox|not authorized|paid account/i;

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
      if (next.length > 16 && line) { lines.push(line); line = word; }
      else line = next;
    });
    if (line) lines.push(line);
    return lines.slice(0, 3);
  }

  function kindFor(title, subtitle) {
    const text = `${title} ${subtitle}`.toLowerCase();
    if (/chess|lichess/.test(text)) return {label:'CHESS', icon:'♟', motif:'board'};
    if (/card|cards|dominion|playingcards|deck/.test(text)) return {label:'CARDS', icon:'♣', motif:'cards'};
    if (/draw|gartic|skribbl|sketch|pictionary/.test(text)) return {label:'DRAW', icon:'✎', motif:'draw'};
    if (/word|bombparty|jklm|codenames|guess/.test(text)) return {label:'WORD', icon:'A', motif:'word'};
    if (/tank|diep|shooter|fps|krunker|narrow|shell/.test(text)) return {label:'SHOOTER', icon:'✦', motif:'target'};
    if (/snake|agar|slither|io|arcade/.test(text)) return {label:'ARCADE', icon:'●', motif:'arcade'};
    if (/board|colonist|strategy|rts|freeciv|widelands|zero-k|megaglest/.test(text)) return {label:'STRATEGY', icon:'◆', motif:'grid'};
    if (/phone|party|airconsole|spaceteam/.test(text)) return {label:'PARTY', icon:'▣', motif:'party'};
    return {label:'MULTIPLAYER', icon:'▶', motif:'arcade'};
  }

  function motifSvg(kind) {
    const icon = esc(kind.icon);
    if (kind.motif === 'board') {
      return `<g opacity=".42" transform="translate(760 96) rotate(-8)">
        ${Array.from({length:6}).map((_,r)=>Array.from({length:6}).map((_,c)=>`<rect x="${c*62}" y="${r*62}" width="62" height="62" fill="${(r+c)%2?'#fff3d4':'#07101f'}" opacity="${(r+c)%2?'.24':'.52'}"/>`).join('')).join('')}
        <text x="146" y="245" font-size="172" font-weight="900" fill="#ffb14a">${icon}</text>
      </g>`;
    }
    if (kind.motif === 'cards') {
      return `<g transform="translate(770 98) rotate(8)">
        <rect x="0" y="34" width="210" height="286" rx="28" fill="#fff3d4" opacity=".2"/>
        <rect x="92" y="0" width="210" height="286" rx="28" fill="#ffb14a" opacity=".82"/>
        <text x="150" y="190" font-size="140" font-weight="900" fill="#07101f">${icon}</text>
      </g>`;
    }
    if (kind.motif === 'draw') {
      return `<g transform="translate(790 110) rotate(-11)">
        <path d="M20 268 C90 122 210 364 312 74" fill="none" stroke="#ffb14a" stroke-width="34" stroke-linecap="round" opacity=".9"/>
        <path d="M250 40 L338 128 L166 300 L78 212 Z" fill="#fff3d4" opacity=".36"/>
        <text x="114" y="226" font-size="120" font-weight="900" fill="#07101f">${icon}</text>
      </g>`;
    }
    if (kind.motif === 'target') {
      return `<g transform="translate(842 128)">
        <circle cx="150" cy="150" r="150" fill="#36d9ff" opacity=".16"/>
        <circle cx="150" cy="150" r="104" fill="none" stroke="#ffb14a" stroke-width="22" opacity=".9"/>
        <circle cx="150" cy="150" r="45" fill="#fff3d4" opacity=".82"/>
        <text x="107" y="190" font-size="132" font-weight="900" fill="#07101f">${icon}</text>
      </g>`;
    }
    if (kind.motif === 'grid') {
      return `<g transform="translate(760 90)" opacity=".75">
        <path d="M38 300 L184 66 L332 300 Z" fill="#ffb14a" opacity=".22"/>
        <path d="M50 306 H370 M94 232 H326 M138 160 H282 M184 66 L38 300 M184 66 L332 300" stroke="#fff3d4" stroke-width="10" opacity=".28"/>
        <text x="146" y="270" font-size="148" font-weight="900" fill="#ffb14a">${icon}</text>
      </g>`;
    }
    if (kind.motif === 'word') {
      return `<g transform="translate(790 110) rotate(-3)">
        <rect x="0" y="0" width="350" height="238" rx="34" fill="#fff3d4" opacity=".18"/>
        <text x="60" y="160" font-size="138" font-weight="900" fill="#ffb14a">${icon}</text>
        <text x="160" y="160" font-size="90" font-weight="900" fill="#36d9ff" opacity=".78">B C</text>
      </g>`;
    }
    if (kind.motif === 'party') {
      return `<g transform="translate(820 118)">
        <circle cx="56" cy="74" r="48" fill="#ffb14a" opacity=".9"/>
        <circle cx="174" cy="46" r="36" fill="#36d9ff" opacity=".75"/>
        <circle cx="258" cy="134" r="58" fill="#9cff5a" opacity=".58"/>
        <rect x="76" y="174" width="214" height="118" rx="26" fill="#fff3d4" opacity=".2"/>
        <text x="132" y="272" font-size="142" font-weight="900" fill="#ffb14a">${icon}</text>
      </g>`;
    }
    return `<g transform="translate(790 116)">
      <circle cx="156" cy="154" r="154" fill="#36d9ff" opacity=".13"/>
      <circle cx="156" cy="154" r="104" fill="#ffb14a" opacity=".16"/>
      <text x="96" y="220" font-size="170" font-weight="900" fill="#ffb14a">${icon}</text>
    </g>`;
  }

  function localCover(title, subtitle='MULTIPLAYER') {
    const h = hash(title);
    const hueA = h % 360;
    const hueB = (h * 7) % 360;
    const lines = wrapTitle(title);
    const kind = kindFor(title, subtitle);
    const titleText = lines.map((line,i)=>`<text x="70" y="${292 + i * 72}" font-size="66" font-weight="900" letter-spacing="-2" fill="#fff3d4">${esc(line)}</text>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="hsl(${hueA},78%,28%)"/>
          <stop offset=".52" stop-color="#0b1b33"/>
          <stop offset="1" stop-color="hsl(${hueB},80%,20%)"/>
        </linearGradient>
        <radialGradient id="glow" cx="25%" cy="14%" r="72%">
          <stop offset="0" stop-color="#ffb14a" stop-opacity=".52"/>
          <stop offset=".38" stop-color="#36d9ff" stop-opacity=".16"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
        <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="2" fill="#fff3d4" opacity=".10"/>
        </pattern>
      </defs>
      <rect width="1200" height="675" fill="url(#bg)"/>
      <rect width="1200" height="675" fill="url(#glow)"/>
      <rect width="1200" height="675" fill="url(#dots)"/>
      <path d="M0 502 C218 430 360 586 548 516 S862 424 1200 510 V675 H0Z" fill="#07101f" opacity=".76"/>
      <rect x="54" y="54" width="310" height="50" rx="25" fill="#07101f" opacity=".66" stroke="#ffb14a" stroke-opacity=".58"/>
      <text x="78" y="88" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" fill="#ffb14a" letter-spacing="4">${esc(kind.label)}</text>
      ${motifSvg(kind)}
      <g font-family="Arial, Helvetica, sans-serif">${titleText}</g>
      <text x="70" y="602" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="900" letter-spacing="3" fill="#c8d8ec">EDDIE'S BASEMENT</text>
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