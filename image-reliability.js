(() => {
  'use strict';

  // Artwork reliability layer.
  // Loaded before app.js so the app receives cleaner candidates before cards render.
  // Generated fallback covers are artwork only; titles/details belong in the card UI.
  const art = { ...(window.EDDIE_ARTWORK || {}) };
  const previews = { ...(window.EDDIE_PREVIEWS || {}) };
  const urls = { ...(window.EDDIE_URLS || {}) };
  const blocked = new Set((window.EDDIE_BLOCKED_TITLES || []).map(v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g,'')));

  const keyFor = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g,'');
  const esc = value => String(value || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  const uniq = list => [...new Set(list.flat().filter(Boolean).map(String))];
  const unreliable = url => /image\.thum\.io|screenshotmachine|urlbox|paid account|not authorized/i.test(String(url || ''));
  const generatedCover = url => /^data:image\/svg\+xml/i.test(String(url || ''));
  const cleanUrls = list => uniq(list).filter(url => !unreliable(url));

  function hash(title) {
    return [...String(title || 'Eddie')].reduce((a,c)=>(a * 31 + c.charCodeAt(0)) >>> 0, 2166136261);
  }

  function kindFor(title, genre) {
    const text = `${title} ${genre}`.toLowerCase();
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

  function localCover(title, genre='Multiplayer') {
    const h = hash(title);
    const hueA = h % 360;
    const hueB = (h * 7) % 360;
    const kind = kindFor(title, genre);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="hsl(${hueA},76%,24%)"/>
          <stop offset="0.55" stop-color="#07101f"/>
          <stop offset="1" stop-color="hsl(${hueB},78%,18%)"/>
        </linearGradient>
        <radialGradient id="glow" cx="22%" cy="18%" r="72%">
          <stop offset="0" stop-color="#ff8a24" stop-opacity=".46"/>
          <stop offset=".42" stop-color="#36d9ff" stop-opacity=".12"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0v48" fill="none" stroke="#fff3d4" stroke-opacity=".07" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="1200" height="675" fill="url(#bg)"/>
      <rect width="1200" height="675" fill="url(#glow)"/>
      <rect width="1200" height="675" fill="url(#grid)"/>
      <path d="M0 522 C205 462 350 590 535 528 S872 450 1200 525 V675 H0Z" fill="#030814" opacity=".66"/>
      <circle cx="168" cy="136" r="104" fill="#36d9ff" opacity=".08"/>
      <circle cx="238" cy="196" r="34" fill="#ffb14a" opacity=".45"/>
      ${motifSvg(kind)}
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function add(title, sources, officialUrl, genre='Multiplayer') {
    if (blocked.has(keyFor(title))) return;
    const fallback = localCover(title, genre);
    const clean = uniq([cleanUrls(sources), cleanUrls(art[title] || []), cleanUrls(previews[title] || []), fallback]);
    art[title] = clean;
    previews[title] = clean[0] || fallback;
    if (officialUrl) urls[title] = officialUrl;
  }

  function steam(appId) {
    return [
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
      `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
      `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`
    ];
  }

  function scrubLocalArtworkCache() {
    try {
      const raw = localStorage.getItem('eb-working-artwork');
      if (!raw) return;
      const cached = JSON.parse(raw);
      if (!cached || typeof cached !== 'object') return;
      let changed = false;
      Object.keys(cached).forEach(title => {
        if (unreliable(cached[title]) || generatedCover(cached[title]) || blocked.has(keyFor(title))) {
          delete cached[title];
          changed = true;
        }
      });
      if (changed) localStorage.setItem('eb-working-artwork', JSON.stringify(cached));
    } catch {}
  }

  scrubLocalArtworkCache();

  // Major recognizable titles: use proper key art / store art first.
  add('Fortnite', [
    'https://cdn2.unrealengine.com/fortnite-og-social-1920x1080-1920x1080-7e6c85c8c15d.jpg',
    'https://cdn2.unrealengine.com/fortnite-og-social-1920x1080-3c4d9f5f65cb.jpg'
  ], 'https://www.fortnite.com/', 'Battle Royale');
  add('Rocket League', steam(252950), 'https://www.rocketleague.com/', 'Car Soccer');
  add('Valorant', ['https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt8e2f8586b27f9f6e/65cfa0e0c6a8495b36f6d3ba/VALORANT_Logo_V.jpg'], 'https://playvalorant.com/', 'Tactical Shooter');
  add('Marvel Rivals', steam(2767030), 'https://www.marvelrivals.com/', 'Hero Shooter');
  add('Apex Legends', steam(1172470), 'https://www.ea.com/games/apex-legends', 'Battle Royale');
  add('Overwatch 2', steam(2357570), 'https://overwatch.blizzard.com/', 'Hero Shooter');
  add('Brawlhalla', steam(291550), 'https://www.brawlhalla.com/', 'Platform Fighter');
  add('Fall Guys', steam(1097150), 'https://www.fallguys.com/', 'Party');
  add('Warframe', steam(230410), 'https://www.warframe.com/', 'Action RPG');
  add('The Finals', steam(2073850), 'https://www.reachthefinals.com/', 'Arena Shooter');
  add('Team Fortress 2', steam(440), 'https://www.teamfortress.com/', 'Class Shooter');
  add('Counter-Strike 2', steam(730), 'https://www.counter-strike.net/', 'Tactical Shooter');
  add('Destiny 2', steam(1085660), 'https://www.bungie.net/7/en/Destiny', 'Sci-Fi Shooter');
  add('Path of Exile', steam(238960), 'https://www.pathofexile.com/', 'Action RPG');
  add('Guild Wars 2', steam(1284210), 'https://www.guildwars2.com/', 'MMO');
  add('RuneScape', steam(1343400), 'https://www.runescape.com/', 'MMO');
  add('Old School RuneScape', steam(1343370), 'https://oldschool.runescape.com/', 'MMO');
  add('EVE Online', steam(8500), 'https://www.eveonline.com/', 'Space MMO');
  add('Star Wars: The Old Republic', steam(1286830), 'https://www.swtor.com/', 'MMO RPG');
  add('DC Universe Online', steam(24200), 'https://www.dcuniverseonline.com/', 'Superhero MMO');
  add('Albion Online', steam(761890), 'https://albiononline.com/', 'Sandbox MMO');
  add('Lost Ark', steam(1599340), 'https://www.playlostark.com/', 'Action MMO');
  add('War Thunder', steam(236390), 'https://warthunder.com/', 'Vehicle Combat');
  add('PUBG: Battlegrounds', steam(578080), 'https://pubg.com/', 'Battle Royale');
  add('Call of Duty: Warzone', steam(1938090), 'https://www.callofduty.com/warzone', 'Battle Royale');
  add('Halo Infinite Multiplayer', steam(1240440), 'https://www.halowaypoint.com/halo-infinite', 'Arena Shooter');
  add('Dota 2', steam(570), 'https://www.dota2.com/', 'MOBA');
  add('League of Legends', [localCover('League of Legends','MOBA')], 'https://www.leagueoflegends.com/', 'MOBA');
  add('Stumble Guys', steam(1677740), 'https://www.stumbleguys.com/', 'Party');
  add('Goose Goose Duck', steam(1568590), 'https://gaggle.fun/goose-goose-duck', 'Social Deduction');
  add('Genshin Impact', ['https://fastcdn.hoyoverse.com/content-v2/hk4e/124528/b6cd20acc5a85f04650a3085bb28af89_3283168430577658450.jpg'], 'https://genshin.hoyoverse.com/', 'Action RPG');
  add('0 A.D.', steam(2190340), 'https://play0ad.com/', 'RTS');
  add('Beyond All Reason', steam(2980300), 'https://www.beyondallreason.info/', 'RTS');
  add('Mindustry', steam(1127400), 'https://mindustrygame.github.io/', 'Strategy');
  add('Wesnoth', steam(599390), 'https://www.wesnoth.org/', 'Strategy');
  add('OpenRA', steam(2229850), 'https://www.openra.net/', 'RTS');

  // Titles without reliable public key art get local covers, not paid screenshot-service placeholders.
  const catalogRows = String(window.EDDIE_RAW || '').split('|').filter(Boolean).map(row => {
    const [title, genre] = row.split('~');
    return { title, genre };
  });

  catalogRows.forEach(({title, genre}) => {
    if (!title || blocked.has(keyFor(title))) return;
    const hasRealArt = cleanUrls([art[title] || [], previews[title] || []]).some(url => !generatedCover(url));
    const fallback = localCover(title, genre || 'Multiplayer');
    if (hasRealArt) {
      art[title] = uniq([cleanUrls(art[title] || []).filter(url => !generatedCover(url)), cleanUrls(previews[title] || []).filter(url => !generatedCover(url)), fallback]);
      previews[title] = cleanUrls(previews[title] || []).filter(url => !generatedCover(url))[0] || art[title][0] || fallback;
    } else {
      art[title] = [fallback];
      previews[title] = fallback;
    }
  });

  // Remove blocked and unreliable screenshot entries from the public image maps.
  Object.keys(art).forEach(title => {
    if (blocked.has(keyFor(title))) delete art[title];
    else art[title] = uniq([cleanUrls(art[title]).filter(url => !generatedCover(url)), localCover(title, 'Multiplayer')]);
  });
  Object.keys(previews).forEach(title => {
    if (blocked.has(keyFor(title)) || unreliable(previews[title]) || generatedCover(previews[title])) previews[title] = art[title]?.[0] || localCover(title, 'Multiplayer');
  });
  Object.keys(urls).forEach(title => { if (blocked.has(keyFor(title))) delete urls[title]; });

  window.EDDIE_ARTWORK = art;
  window.EDDIE_PREVIEWS = previews;
  window.EDDIE_URLS = urls;
  window.EDDIE_IMAGE_RELIABILITY_COUNT = Object.keys(art).length;
})();