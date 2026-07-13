(() => {
  'use strict';

  // Keep the shelf looking like a game library, not a wall of website screenshots.
  // Real key art/store headers stay. Website screenshots/previews become clean motif covers.
  const PREVIEW_IMAGE = /image\.thum\.io|screenshotmachine|urlbox|not authorized|paid account/i;

  function hash(value) {
    return [...String(value || 'Game')].reduce((a,c)=>(a * 31 + c.charCodeAt(0)) >>> 0, 2166136261);
  }

  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, s => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[s]));
  }

  function kindFor(title, subtitle) {
    const text = `${title} ${subtitle}`.toLowerCase();
    if (/chess|lichess/.test(text)) return { icon:'♟', motif:'board' };
    if (/card|cards|dominion|playingcards|deck/.test(text)) return { icon:'♣', motif:'cards' };
    if (/draw|gartic|skribbl|sketch|pictionary/.test(text)) return { icon:'✎', motif:'draw' };
    if (/word|bombparty|jklm|codenames|guess/.test(text)) return { icon:'A', motif:'word' };
    if (/tank|diep|shooter|fps|krunker|narrow|shell/.test(text)) return { icon:'✦', motif:'target' };
    if (/snake|agar|slither|io|arcade/.test(text)) return { icon:'●', motif:'arcade' };
    if (/board|colonist|strategy|rts|freeciv|widelands|zero-k|megaglest/.test(text)) return { icon:'◆', motif:'grid' };
    if (/phone|party|airconsole|spaceteam/.test(text)) return { icon:'▣', motif:'party' };
    return { icon:'▶', motif:'arcade' };
  }

  function motifSvg(kind) {
    const icon = esc(kind.icon);
    if (kind.motif === 'board') {
      return `<g opacity=".48" transform="translate(660 64) rotate(-8)">
        ${Array.from({length:7}).map((_,r)=>Array.from({length:7}).map((_,c)=>`<rect x="${c*70}" y="${r*70}" width="70" height="70" fill="${(r+c)%2?'#fff3d4':'#07101f'}" opacity="${(r+c)%2?'.2':'.46'}"/>`).join('')).join('')}
        <circle cx="180" cy="180" r="70" fill="#ffb14a" opacity=".72"/>
        <text x="138" y="235" font-size="172" font-weight="900" fill="#07101f">${icon}</text>
      </g>`;
    }
    if (kind.motif === 'cards') {
      return `<g transform="translate(710 82) rotate(8)">
        <rect x="0" y="50" width="230" height="315" rx="32" fill="#fff3d4" opacity=".2"/>
        <rect x="105" y="0" width="230" height="315" rx="32" fill="#ffb14a" opacity=".86"/>
        <text x="166" y="214" font-size="156" font-weight="900" fill="#07101f">${icon}</text>
      </g>`;
    }
    if (kind.motif === 'draw') {
      return `<g transform="translate(695 96) rotate(-10)">
        <path d="M20 318 C95 110 214 402 344 72" fill="none" stroke="#ffb14a" stroke-width="38" stroke-linecap="round" opacity=".9"/>
        <path d="M280 36 L374 130 L178 326 L84 232 Z" fill="#fff3d4" opacity=".36"/>
        <circle cx="198" cy="230" r="80" fill="#36d9ff" opacity=".16"/>
      </g>`;
    }
    if (kind.motif === 'target') {
      return `<g transform="translate(760 90)">
        <circle cx="180" cy="180" r="172" fill="#36d9ff" opacity=".14"/>
        <circle cx="180" cy="180" r="116" fill="none" stroke="#ffb14a" stroke-width="24" opacity=".9"/>
        <circle cx="180" cy="180" r="48" fill="#fff3d4" opacity=".84"/>
        <path d="M180 2 V86 M180 274 V358 M2 180 H86 M274 180 H358" stroke="#fff3d4" stroke-width="12" opacity=".28"/>
      </g>`;
    }
    if (kind.motif === 'grid') {
      return `<g transform="translate(670 76)" opacity=".82">
        <path d="M58 360 L220 74 L394 360 Z" fill="#ffb14a" opacity=".2"/>
        <path d="M54 360 H426 M96 286 H382 M140 210 H338 M184 136 H294 M220 74 L58 360 M220 74 L394 360" stroke="#fff3d4" stroke-width="10" opacity=".26"/>
        <circle cx="224" cy="250" r="64" fill="#36d9ff" opacity=".2"/>
      </g>`;
    }
    if (kind.motif === 'word') {
      return `<g transform="translate(700 95) rotate(-3)">
        <rect x="0" y="0" width="390" height="260" rx="38" fill="#fff3d4" opacity=".16"/>
        <text x="70" y="174" font-size="150" font-weight="900" fill="#ffb14a">A</text>
        <text x="184" y="174" font-size="96" font-weight="900" fill="#36d9ff" opacity=".78">B C</text>
      </g>`;
    }
    if (kind.motif === 'party') {
      return `<g transform="translate(720 104)">
        <circle cx="58" cy="78" r="52" fill="#ffb14a" opacity=".92"/>
        <circle cx="188" cy="48" r="40" fill="#36d9ff" opacity=".75"/>
        <circle cx="286" cy="148" r="64" fill="#9cff5a" opacity=".58"/>
        <rect x="86" y="195" width="238" height="128" rx="30" fill="#fff3d4" opacity=".2"/>
      </g>`;
    }
    return `<g transform="translate(710 96)">
      <circle cx="176" cy="174" r="176" fill="#36d9ff" opacity=".13"/>
      <circle cx="176" cy="174" r="112" fill="#ffb14a" opacity=".16"/>
      <text x="110" y="238" font-size="188" font-weight="900" fill="#ffb14a">${icon}</text>
    </g>`;
  }

  function localCover(title, subtitle='MULTIPLAYER') {
    const h = hash(title);
    const hueA = h % 360;
    const hueB = (h * 7) % 360;
    const kind = kindFor(title, subtitle);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="hsl(${hueA},78%,28%)"/>
          <stop offset=".52" stop-color="#0b1b33"/>
          <stop offset="1" stop-color="hsl(${hueB},80%,20%)"/>
        </linearGradient>
        <radialGradient id="glow" cx="24%" cy="16%" r="72%">
          <stop offset="0" stop-color="#ffb14a" stop-opacity=".5"/>
          <stop offset=".38" stop-color="#36d9ff" stop-opacity=".16"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
        <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="2" fill="#fff3d4" opacity=".09"/>
        </pattern>
      </defs>
      <rect width="1200" height="675" fill="url(#bg)"/>
      <rect width="1200" height="675" fill="url(#glow)"/>
      <rect width="1200" height="675" fill="url(#dots)"/>
      <path d="M0 502 C218 430 360 586 548 516 S862 424 1200 510 V675 H0Z" fill="#07101f" opacity=".76"/>
      <circle cx="170" cy="130" r="104" fill="#36d9ff" opacity=".08"/>
      <circle cx="235" cy="190" r="34" fill="#ffb14a" opacity=".45"/>
      ${motifSvg(kind)}
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