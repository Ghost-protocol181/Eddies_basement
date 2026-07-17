(() => {
  'use strict';

  // Curated official/store artwork. Loaded before app.js so visible titles favor real key art.
  const art = { ...(window.EDDIE_ARTWORK || {}) };
  const previews = { ...(window.EDDIE_PREVIEWS || {}) };
  const urls = { ...(window.EDDIE_URLS || {}) };

  const steam = id => [
    `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`,
    `https://steamcdn-a.akamaihd.net/steam/apps/${id}/header.jpg`
  ];

  const clean = list => [...new Set(list.flat().filter(Boolean).map(String))];

  function add(title, sources, officialUrl) {
    const items = clean(sources);
    if (!items.length) return;
    art[title] = clean([items, art[title] || [], previews[title] || []]);
    previews[title] = items[0];
    if (officialUrl) urls[title] = officialUrl;
  }

  // Headliners / current hits.
  add('Fortnite', [
    'https://cdn2.unrealengine.com/brfnbr-41-00-c7s3-egs-launcher-blade-2560x1440-2560x1440-25bfc048e2c2.jpg'
  ], 'https://store.epicgames.com/en-US/p/fortnite');
  add('Call of Duty: Warzone', steam('1938090'), 'https://www.callofduty.com/warzone');
  add('Rocket League', steam('252950'), 'https://www.rocketleague.com/');
  add('Apex Legends', steam('1172470'), 'https://www.ea.com/games/apex-legends');
  add('Marvel Rivals', steam('2767030'), 'https://www.marvelrivals.com/');
  add('Overwatch 2', steam('2357570'), 'https://overwatch.blizzard.com/');
  add('Fall Guys', steam('1097150'), 'https://www.fallguys.com/');
  add('Warframe', steam('230410'), 'https://www.warframe.com/');
  add('Counter-Strike 2', steam('730'), 'https://www.counter-strike.net/');
  add('Destiny 2', steam('1085660'), 'https://www.bungie.net/7/en/Destiny');
  add('PUBG: Battlegrounds', steam('578080'), 'https://pubg.com/');
  add('Halo Infinite Multiplayer', steam('1240440'), 'https://www.halowaypoint.com/halo-infinite');
  add('War Thunder', steam('236390'), 'https://warthunder.com/');
  add('Dota 2', steam('570'), 'https://www.dota2.com/');
  add('Team Fortress 2', steam('440'), 'https://www.teamfortress.com/');
  add('The Finals', steam('2073850'), 'https://www.reachthefinals.com/');
  add('Brawlhalla', steam('291550'), 'https://www.brawlhalla.com/');
  add('Paladins', steam('444090'), 'https://www.paladins.com/');
  add('SMITE 2', steam('2437170'), 'https://www.smite2.com/');
  add('Path of Exile', steam('238960'), 'https://www.pathofexile.com/');
  add('EVE Online', steam('8500'), 'https://www.eveonline.com/');
  add('Albion Online', steam('761890'), 'https://albiononline.com/');
  add('World of Tanks Blitz', steam('444200'), 'https://wotblitz.com/');
  add('World of Warships', steam('552990'), 'https://worldofwarships.com/');
  add('Yu-Gi-Oh! Master Duel', steam('1449850'), 'https://www.konami.com/yugioh/masterduel/');
  add('TrackMania Starter Access', steam('2225070'), 'https://www.ubisoft.com/game/trackmania/trackmania');
  add('Goose Goose Duck', steam('1568590'), 'https://www.goosegooseduck.com/');
  add('Unturned', steam('304930'), 'https://smartlydressedgames.com/');

  // Reliable Steam artwork for open-source and long-tail games seen in the recorded QA pass.
  add('DDraceNetwork', steam('412220'), 'https://ddnet.org/');
  add('Warzone 2100', steam('1241950'), 'https://wz2100.net/');
  add('Zero-K', steam('334920'), 'https://zero-k.info/');
  add('Ryzom', steam('373720'), 'https://ryzom.com/');
  add('OpenTTD', steam('1536610'), 'https://www.openttd.org/');
  add('0 A.D.', steam('2190340'), 'https://play0ad.com/');
  add('Beyond All Reason', steam('2980300'), 'https://www.beyondallreason.info/');
  add('Mindustry', steam('1127400'), 'https://mindustrygame.github.io/');
  add('Wesnoth', steam('599390'), 'https://www.wesnoth.org/');
  add('Teeworlds', steam('380840'), 'https://www.teeworlds.com/');
  add('OpenArena', steam('7650'), 'https://openarena.ws/');

  // Official mobile / cross-platform key art.
  add('Brawl Stars', [
    'https://supercell.com/images/1a5b69311180a4a1c374e10556941f05/hero_bg_brawlstars.a385872a.jpg'
  ], 'https://supercell.com/en/games/brawlstars/');
  add('Clash Royale', [
    'https://supercell.com/images/c96611b5b4ccd331e2b4dcb797811894/hero_bg_clashroyale.612fcf42.jpg'
  ], 'https://supercell.com/en/games/clashroyale/');
  add('Clash of Clans', [
    'https://supercell.com/images/ae58a39e76410b4ae9c2bea65d4a584d/hero_bg_clashofclans_.fae7c799.jpg'
  ], 'https://supercell.com/en/games/clashofclans/');
  add('UFL', [
    'https://uflgame.com/wp-content/uploads/2026/04/FOOTM-2790_New_Post.webp'
  ], 'https://uflgame.com/');
  add('Free Fire', [
    'https://freefiremobile-a.akamaihd.net/common/web_event/official2.ff.garena.all/img/20228/65fef1213324415a00e170bef3a51e2b.jpg',
    'https://freefiremobile-a.akamaihd.net/common/web_event/official2.ff.garena.all/img/20228/0afcdff114b583e304249bb6a324a569.jpg'
  ], 'https://ff.garena.com/en');
  add('Call of Duty Mobile', [
    'https://www.callofduty.com/content/dam/atvi/callofduty/cod-touchui/mobile/home/hero/CODM_Home_Hero-BG_Desktop-LG-11.webp',
    'https://www.callofduty.com/content/dam/atvi/callofduty/cod-touchui/mobile/home/gamemodes/GameModes_Multiplayer.webp'
  ], 'https://www.callofduty.com/mobile');

  // Browser titles: direct destinations stay clean; no website screenshots are used as artwork.
  Object.assign(urls, {
    'Valorant': 'https://playvalorant.com/',
    'League of Legends': 'https://www.leagueoflegends.com/',
    'Chess.com': 'https://www.chess.com/',
    'Lichess': 'https://lichess.org/',
    'Codenames Online': 'https://codenames.game/',
    'Gartic Phone': 'https://garticphone.com/',
    'Gartic.io': 'https://gartic.io/',
    'Skribbl.io': 'https://skribbl.io/',
    'Pokemon Showdown': 'https://play.pokemonshowdown.com/',
    'PlayingCards.io': 'https://playingcards.io/',
    'Board Game Arena': 'https://boardgamearena.com/',
    'Colonist': 'https://colonist.io/',
    'Dominion Online': 'https://dominion.games/',
    'Krunker': 'https://krunker.io/',
    'Diep.io': 'https://diep.io/'
  });

  try {
    const working = JSON.parse(localStorage.getItem('eb-working-artwork') || '{}');
    Object.keys(working).forEach(title => {
      if (art[title]) delete working[title];
    });
    localStorage.setItem('eb-working-artwork', JSON.stringify(working));
  } catch {}

  window.EDDIE_ARTWORK = art;
  window.EDDIE_PREVIEWS = previews;
  window.EDDIE_URLS = urls;
})();