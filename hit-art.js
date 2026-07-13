(() => {
  'use strict';

  // Curated hit-game artwork. Loaded before app.js so major titles do not fall back to generic covers.
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

  // Headliners / current hits
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
  add('Halo Infinite', steam('1240440'), 'https://www.halowaypoint.com/halo-infinite');
  add('War Thunder', steam('236390'), 'https://warthunder.com/');
  add('Dota 2', steam('570'), 'https://www.dota2.com/');
  add('Team Fortress 2', steam('440'), 'https://www.teamfortress.com/');
  add('The Finals', steam('2073850'), 'https://www.reachthefinals.com/');
  add('Brawlhalla', steam('291550'), 'https://www.brawlhalla.com/');
  add('Paladins', steam('444090'), 'https://www.paladins.com/');
  add('Smite', steam('386360'), 'https://www.smitegame.com/');
  add('Path of Exile', steam('238960'), 'https://www.pathofexile.com/');
  add('EVE Online', steam('8500'), 'https://www.eveonline.com/');
  add('Albion Online', steam('761890'), 'https://albiononline.com/');
  add('World of Tanks', steam('1407200'), 'https://worldoftanks.com/');
  add('World of Warships', steam('552990'), 'https://worldofwarships.com/');
  add('Yu-Gi-Oh! Master Duel', steam('1449850'), 'https://www.konami.com/yugioh/masterduel/');
  add('Omega Strikers', steam('1869590'), 'https://www.odysseyinteractive.gg/omegastrikers');
  add('Trackmania', steam('2225070'), 'https://www.ubisoft.com/game/trackmania/trackmania');
  add('Goose Goose Duck', steam('1568590'), 'https://gaggle.fun/goose-goose-duck');
  add('Unturned', steam('304930'), 'https://smartlydressedgames.com/');

  // Browser / recognizable web games that have reliable brand-style images in our generated system should not be promoted as screenshots.
  // Keep their official URLs clean for the Visit Game button.
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
    const failed = JSON.parse(localStorage.getItem('eb-failed-artwork') || '[]');
    const keep = failed.filter(url => !/steamstatic|steamcdn-a|store_item_assets|cdn2\.unrealengine\.com/i.test(String(url)));
    localStorage.setItem('eb-failed-artwork', JSON.stringify(keep));

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
