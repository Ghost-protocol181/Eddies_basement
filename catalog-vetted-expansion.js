(() => {
  'use strict';

  // Curated expansion: safer, low-friction multiplayer picks.
  // Keep this focused. Avoid open-ended kid/social UGC platforms, adult party clones,
  // gambling-first sites, sketchy portals, and games with unclear free access.
  const rows = [
    'Drawasaurus~Drawing Party~Browser~Draw and Guess~No download~2-16~browser party drawing quick',
    'Sketchful.io~Drawing Party~Browser~Draw and Guess~No download~3-16~browser party drawing quick',
    'Drawize~Drawing Party~Browser Mobile~Draw and Guess~Account~2+~browser mobile party drawing',
    'Wavelength Online~Party Guessing~Browser Mobile~Team Guessing~No download~2+~browser mobile party quick',
    'Spyfall.app~Social Deduction~Browser Mobile~Hidden Role Guessing~No download~3-12~browser mobile party social quick',
    'CardzMania~Card Games~Browser Mobile~Classic Card Rooms~No download~2+~browser mobile cards board',
    'Backgammon Galaxy~Board Game~Browser Mobile~Backgammon PvP~Account~1v1~browser mobile board strategy',
    'Dominion Online~Card Game~Browser~Deckbuilding PvP~Account~2-6~browser cards strategy',
    'Yucata~Board Games~Browser~Turn-Based Board Games~Account~2+~browser board strategy',
    'Tabletopia~Board Games~Browser PC Mobile~Digital Board Games~Account~2+~browser board',
    'Boardspace~Board Games~Browser~Abstract Board Games~No download~2+~browser board strategy',
    'Freeciv-web~4X Strategy~Browser~Civilization-style Multiplayer~No download~2+~browser strategy lowend',
    'Little War Game~RTS~Browser~Real-Time Strategy~No download~2+~browser strategy lowend',
    'TagPro~Capture The Flag~Browser~Team CTF~No download~4v4~browser party team quick lowend',
    'Narrow One~Browser Shooter~Browser~Bow Team Battles~No download~Teams~browser shooter team quick',
    'SuperTuxKart~Kart Racing~PC Mobile~Kart Racing Online~Download~1-8~racing party lowend opensource',
    'Luanti~Sandbox~PC Mobile~Sandbox Servers~Download~2+~sandbox co-op lowend opensource',
    'Veloren~Open World RPG~PC~Co-op Adventure~Download~2+~rpg co-op opensource',
    'Freeciv~4X Strategy~PC~Civilization-style Multiplayer~Download~2+~strategy lowend opensource',
    'Warzone 2100~RTS~PC~Strategy Multiplayer~Download~2+~strategy lowend opensource',
    'Zero-K~RTS~PC~Large-Scale Strategy~Download~2+~strategy opensource',
    'MegaGlest~RTS~PC~Fantasy Strategy~Download~2+~strategy lowend opensource',
    'Widelands~Strategy~PC~Economy Strategy Multiplayer~Download~2+~strategy lowend opensource',
    'FreeOrion~4X Strategy~PC~Space Strategy Multiplayer~Download~2+~strategy opensource',
    'Red Eclipse 2~Arena Shooter~PC~Arena FPS~Download~Teams~shooter opensource',
    'AssaultCube~Tactical Shooter~PC~Lightweight FPS~Download~Teams~shooter lowend opensource',
    'Cube 2 Sauerbraten~Arena Shooter~PC~Arena FPS~Download~Teams~shooter lowend opensource',
    'Unvanquished~Team Shooter~PC~Aliens vs Humans~Download~Teams~shooter strategy opensource',
    'OpenSpades~Voxel Shooter~PC~Build-and-Shoot Teams~Download~Teams~shooter lowend opensource',
    'BZFlag~Tank Battles~PC~Tank Arena~Download~Teams~action lowend opensource',
    'Armagetron Advanced~Light Cycle~PC~Tron-style Arena~Download~2+~arcade party lowend opensource',
    'Netrek~Space Strategy~PC~Team Space Battles~Download~Teams~strategy action lowend opensource',
    'DDraceNetwork~Platformer~PC~Co-op Platforming~Download~2+~co-op platformer lowend',
    'OpenClonk~Action Sandbox~PC~Team Sandbox Action~Download~2+~action sandbox opensource',
    'OpenLieroX~Worms-like Action~PC~Arena Worm Battles~Download~2+~party action lowend opensource',
    'Stendhal~Online RPG~PC~Co-op Online RPG~Download~Massive~rpg co-op lowend opensource',
    'Ryzom~MMORPG~PC~Open World MMO~Download~Massive~mmo rpg',
    'Spaceteam~Co-op Party~Mobile~Shouting Co-op~Download~2-8~mobile party co-op quick',
    'BombSquad~Action Party~Mobile PC~Local Online Party~Download~2-8~mobile party action'
  ];

  const urls = {
    'Drawasaurus':'https://www.drawasaurus.org',
    'Sketchful.io':'https://sketchful.io',
    'Drawize':'https://www.drawize.com',
    'Wavelength Online':'https://www.wavelength.zone',
    'Spyfall.app':'https://spyfall.app',
    'CardzMania':'https://www.cardzmania.com',
    'Backgammon Galaxy':'https://backgammongalaxy.com',
    'Dominion Online':'https://dominion.games',
    'Yucata':'https://www.yucata.de',
    'Tabletopia':'https://tabletopia.com',
    'Boardspace':'https://www.boardspace.net',
    'Freeciv-web':'https://www.freecivweb.org',
    'Little War Game':'https://www.littlewargame.com',
    'TagPro':'https://tagpro.koalabeast.com',
    'Narrow One':'https://narrow.one',
    'SuperTuxKart':'https://supertuxkart.net',
    'Luanti':'https://www.luanti.org',
    'Veloren':'https://veloren.net',
    'Freeciv':'https://www.freeciv.org',
    'Warzone 2100':'https://wz2100.net',
    'Zero-K':'https://zero-k.info',
    'MegaGlest':'https://megaglest.org',
    'Widelands':'https://www.widelands.org',
    'FreeOrion':'https://www.freeorion.org',
    'Red Eclipse 2':'https://redeclipse.net',
    'AssaultCube':'https://assault.cubers.net',
    'Cube 2 Sauerbraten':'http://sauerbraten.org',
    'Unvanquished':'https://unvanquished.net',
    'OpenSpades':'https://openspades.yvt.jp',
    'BZFlag':'https://www.bzflag.org',
    'Armagetron Advanced':'https://www.armagetronad.org',
    'Netrek':'https://www.netrek.org',
    'DDraceNetwork':'https://ddnet.org',
    'OpenClonk':'https://www.openclonk.org',
    'OpenLieroX':'https://www.openlierox.net',
    'Stendhal':'https://stendhalgame.org',
    'Ryzom':'https://ryzom.com',
    'Spaceteam':'https://spaceteam.ca',
    'BombSquad':'https://www.froemling.net/apps/bombsquad'
  };

  const keyFor = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const blocked = new Set((window.EDDIE_BLOCKED_TITLES || []).map(keyFor));
  const existing = new Set(String(window.EDDIE_RAW || '').split('|').filter(Boolean).map(row => keyFor(row.split('~')[0])));
  const cleanRows = rows.filter(row => {
    const key = keyFor(row.split('~')[0]);
    return key && !blocked.has(key) && !existing.has(key);
  });

  if (cleanRows.length) {
    window.EDDIE_RAW = [String(window.EDDIE_RAW || '').replace(/\|+$/,''), cleanRows.join('|')].filter(Boolean).join('|');
  }

  window.EDDIE_URLS = { ...(window.EDDIE_URLS || {}), ...urls };
  window.EDDIE_CATALOG_EXPANSION_COUNT = cleanRows.length;
})();