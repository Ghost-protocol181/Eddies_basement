(() => {
  'use strict';

  // Better artwork reliability layer.
  // Loaded before app.js so app candidates prefer these sources first.
  const art = { ...(window.EDDIE_ARTWORK || {}) };
  const previews = { ...(window.EDDIE_PREVIEWS || {}) };
  const urls = { ...(window.EDDIE_URLS || {}) };
  const blocked = new Set((window.EDDIE_BLOCKED_TITLES || []).map(v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g,'')));
  const keyFor = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g,'');
  const uniq = list => [...new Set(list.flat().filter(Boolean).map(String))];

  function add(title, sources, officialUrl) {
    if (blocked.has(keyFor(title))) return;
    const clean = uniq([sources, art[title] || [], previews[title] || []]);
    if (clean.length) {
      art[title] = clean;
      previews[title] = clean[0];
    }
    if (officialUrl) urls[title] = officialUrl;
  }

  function steam(appId) {
    return [
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
      `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
      `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`
    ];
  }

  function shot(url) {
    return `https://image.thum.io/get/width/1200/crop/675/noanimate/${url}`;
  }

  // Major recognizable titles: make sure these use proper key art/store art before screenshots.
  add('Fortnite', [
    'https://cdn2.unrealengine.com/fortnite-og-social-1920x1080-1920x1080-7e6c85c8c15d.jpg',
    'https://cdn2.unrealengine.com/fortnite-og-social-1920x1080-3c4d9f5f65cb.jpg',
    shot('https://www.fortnite.com/')
  ], 'https://www.fortnite.com/');
  add('Rocket League', steam(252950), 'https://www.rocketleague.com/');
  add('Valorant', [
    'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt8e2f8586b27f9f6e/65cfa0e0c6a8495b36f6d3ba/VALORANT_Logo_V.jpg',
    shot('https://playvalorant.com/')
  ], 'https://playvalorant.com/');
  add('Marvel Rivals', steam(2767030), 'https://www.marvelrivals.com/');
  add('Apex Legends', steam(1172470), 'https://www.ea.com/games/apex-legends');
  add('Overwatch 2', steam(2357570), 'https://overwatch.blizzard.com/');
  add('Brawlhalla', steam(291550), 'https://www.brawlhalla.com/');
  add('Fall Guys', steam(1097150), 'https://www.fallguys.com/');
  add('Warframe', steam(230410), 'https://www.warframe.com/');
  add('The Finals', steam(2073850), 'https://www.reachthefinals.com/');
  add('Team Fortress 2', steam(440), 'https://www.teamfortress.com/');
  add('Counter-Strike 2', steam(730), 'https://www.counter-strike.net/');
  add('Destiny 2', steam(1085660), 'https://www.bungie.net/7/en/Destiny');
  add('Path of Exile', steam(238960), 'https://www.pathofexile.com/');
  add('Guild Wars 2', steam(1284210), 'https://www.guildwars2.com/');
  add('RuneScape', steam(1343400), 'https://www.runescape.com/');
  add('Old School RuneScape', steam(1343370), 'https://oldschool.runescape.com/');
  add('EVE Online', steam(8500), 'https://www.eveonline.com/');
  add('Star Wars: The Old Republic', steam(1286830), 'https://www.swtor.com/');
  add('DC Universe Online', steam(24200), 'https://www.dcuniverseonline.com/');
  add('Albion Online', steam(761890), 'https://albiononline.com/');
  add('Lost Ark', steam(1599340), 'https://www.playlostark.com/');
  add('War Thunder', steam(236390), 'https://warthunder.com/');
  add('PUBG: Battlegrounds', steam(578080), 'https://pubg.com/');
  add('Call of Duty: Warzone', steam(1938090), 'https://www.callofduty.com/warzone');
  add('Halo Infinite Multiplayer', steam(1240440), 'https://www.halowaypoint.com/halo-infinite');
  add('Dota 2', steam(570), 'https://www.dota2.com/');
  add('League of Legends', [
    shot('https://www.leagueoflegends.com/'),
    'https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt02dd76c15eeda4a9/63ea2b2eb1f08b45b26c1ee5/lol-logo-rendered-hi-res.png'
  ], 'https://www.leagueoflegends.com/');
  add('Stumble Guys', steam(1677740), 'https://www.stumbleguys.com/');
  add('Goose Goose Duck', steam(1568590), 'https://gaggle.fun/goose-goose-duck');
  add('Genshin Impact', [
    'https://fastcdn.hoyoverse.com/content-v2/hk4e/124528/b6cd20acc5a85f04650a3085bb28af89_3283168430577658450.jpg',
    shot('https://genshin.hoyoverse.com/')
  ], 'https://genshin.hoyoverse.com/');
  add('0 A.D.', steam(2190340), 'https://play0ad.com/');
  add('Beyond All Reason', steam(2980300), 'https://www.beyondallreason.info/');
  add('Mindustry', steam(1127400), 'https://mindustrygame.github.io/');
  add('Wesnoth', steam(599390), 'https://www.wesnoth.org/');
  add('OpenRA', steam(2229850), 'https://www.openra.net/');

  // Browser / board / party titles: prefer a clean official-page capture over random web images.
  [
    ['Skribbl.io','https://skribbl.io/'],
    ['Gartic Phone','https://garticphone.com/'],
    ['Gartic.io','https://gartic.io/'],
    ['Codenames Online','https://codenames.game/'],
    ['Board Game Arena','https://boardgamearena.com/'],
    ['Chess.com','https://www.chess.com/play/online'],
    ['Lichess','https://lichess.org/'],
    ['Pokemon Showdown','https://play.pokemonshowdown.com/'],
    ['TETR.IO','https://tetr.io/'],
    ['Jstris','https://jstris.jezevec10.com/'],
    ['Colonist','https://colonist.io/'],
    ['PlayingCards.io','https://playingcards.io/'],
    ['NetGames.io','https://netgames.io/'],
    ['AirConsole','https://www.airconsole.com/'],
    ['JKLM.fun BombParty','https://jklm.fun/'],
    ['JKLM.fun PopSauce','https://jklm.fun/'],
    ['Drawasaurus','https://www.drawasaurus.org/'],
    ['Sketchful.io','https://sketchful.io/'],
    ['Drawize','https://www.drawize.com/'],
    ['Wavelength Online','https://www.wavelength.zone/'],
    ['Spyfall.app','https://spyfall.app/'],
    ['CardzMania','https://www.cardzmania.com/'],
    ['Backgammon Galaxy','https://backgammongalaxy.com/'],
    ['Dominion Online','https://dominion.games/'],
    ['Yucata','https://www.yucata.de/'],
    ['Tabletopia','https://tabletopia.com/'],
    ['Boardspace','https://www.boardspace.net/'],
    ['Freeciv-web','https://www.freecivweb.org/'],
    ['Little War Game','https://www.littlewargame.com/'],
    ['TagPro','https://tagpro.koalabeast.com/'],
    ['Narrow One','https://narrow.one/']
  ].forEach(([title,url]) => add(title, [shot(url)], url));

  // Lightweight/open-source downloadable titles from the vetted expansion.
  [
    ['SuperTuxKart','https://supertuxkart.net/'],
    ['Luanti','https://www.luanti.org/'],
    ['Veloren','https://veloren.net/'],
    ['Freeciv','https://www.freeciv.org/'],
    ['Warzone 2100','https://wz2100.net/'],
    ['Zero-K','https://zero-k.info/'],
    ['MegaGlest','https://megaglest.org/'],
    ['Widelands','https://www.widelands.org/'],
    ['FreeOrion','https://www.freeorion.org/'],
    ['Red Eclipse 2','https://redeclipse.net/'],
    ['AssaultCube','https://assault.cubers.net/'],
    ['Cube 2 Sauerbraten','http://sauerbraten.org/'],
    ['Unvanquished','https://unvanquished.net/'],
    ['OpenSpades','https://openspades.yvt.jp/'],
    ['BZFlag','https://www.bzflag.org/'],
    ['Armagetron Advanced','https://www.armagetronad.org/'],
    ['Netrek','https://www.netrek.org/'],
    ['DDraceNetwork','https://ddnet.org/'],
    ['OpenClonk','https://www.openclonk.org/'],
    ['OpenLieroX','https://www.openlierox.net/'],
    ['Stendhal','https://stendhalgame.org/'],
    ['Ryzom','https://ryzom.com/'],
    ['Spaceteam','https://spaceteam.ca/'],
    ['BombSquad','https://www.froemling.net/apps/bombsquad']
  ].forEach(([title,url]) => add(title, [shot(url)], url));

  // Remove blocked entries from image maps too, so old art does not leak back in.
  Object.keys(art).forEach(title => { if (blocked.has(keyFor(title))) delete art[title]; });
  Object.keys(previews).forEach(title => { if (blocked.has(keyFor(title))) delete previews[title]; });
  Object.keys(urls).forEach(title => { if (blocked.has(keyFor(title))) delete urls[title]; });

  window.EDDIE_ARTWORK = art;
  window.EDDIE_PREVIEWS = previews;
  window.EDDIE_URLS = urls;
  window.EDDIE_IMAGE_RELIABILITY_COUNT = Object.keys(art).length;
})();
