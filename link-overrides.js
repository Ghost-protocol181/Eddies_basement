(() => {
  'use strict';

  const keyFor = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Games with no useful playable destination should not be shown as picks.
  // They can be added back later if service returns.
  const RETIRED_OR_DEAD = new Set([
    'xdefiant',
    'dauntless',
    'kartriderdrift'
  ]);

  const DIRECT_URLS = {
    'Fortnite':'https://www.fortnite.com/',
    'Rocket League':'https://www.rocketleague.com/',
    'Valorant':'https://playvalorant.com/',
    'Marvel Rivals':'https://www.marvelrivals.com/',
    'Apex Legends':'https://www.ea.com/games/apex-legends',
    'Overwatch 2':'https://overwatch.blizzard.com/',
    'Brawlhalla':'https://www.brawlhalla.com/',
    'Fall Guys':'https://www.fallguys.com/',
    'Warframe':'https://www.warframe.com/',
    'The Finals':'https://www.reachthefinals.com/',
    'Team Fortress 2':'https://www.teamfortress.com/',
    'Counter-Strike 2':'https://store.steampowered.com/app/730/CounterStrike_2/',
    'Destiny 2':'https://www.bungie.net/7/en/Destiny',
    'Path of Exile':'https://www.pathofexile.com/',
    'Guild Wars 2':'https://www.guildwars2.com/',
    'RuneScape':'https://www.runescape.com/',
    'Old School RuneScape':'https://oldschool.runescape.com/',
    'EVE Online':'https://www.eveonline.com/',
    'Star Wars: The Old Republic':'https://www.swtor.com/',
    'DC Universe Online':'https://www.dcuniverseonline.com/',
    'Albion Online':'https://albiononline.com/',
    'Lost Ark':'https://www.playlostark.com/',
    'World of Tanks Blitz':'https://wotblitz.com/',
    'World of Warships':'https://worldofwarships.com/',
    'War Thunder':'https://warthunder.com/',
    'Enlisted':'https://enlisted.net/',
    'PUBG: Battlegrounds':'https://pubg.com/',
    'Call of Duty: Warzone':'https://www.callofduty.com/warzone',
    'Halo Infinite Multiplayer':'https://www.halowaypoint.com/halo-infinite',
    'Splitgate 2':'https://www.splitgate.com/',
    'Paladins':'https://www.paladins.com/',
    'SMITE 2':'https://www.smite2.com/',
    'League of Legends':'https://www.leagueoflegends.com/',
    'Dota 2':'https://www.dota2.com/',
    'Pokémon UNITE':'https://unite.pokemon.com/',
    'Super Animal Royale':'https://animalroyale.com/',
    'Stumble Guys':'https://www.stumbleguys.com/',
    'Farlight 84':'https://farlight84.farlightgames.com/',
    'Naraka: Bladepoint':'https://www.narakathegame.com/',
    'Once Human':'https://www.oncehuman.game/',
    'Palia':'https://palia.com/',
    'Trove':'https://www.trionworlds.com/trove/',
    'Crab Game':'https://store.steampowered.com/app/1782210/Crab_Game/',
    'Muck':'https://store.steampowered.com/app/1625450/Muck/',
    'Unturned':'https://store.steampowered.com/app/304930/Unturned/',
    'No More Room in Hell':'https://store.steampowered.com/app/224260/No_More_Room_in_Hell/',
    'SCP: Secret Laboratory':'https://scpslgame.com/',
    'Alien Swarm: Reactive Drop':'https://store.steampowered.com/app/563560/Alien_Swarm_Reactive_Drop/',
    'Wolfenstein: Enemy Territory':'https://store.steampowered.com/app/1873030/Wolfenstein_Enemy_Territory/',
    'OpenArena':'https://openarena.ws/',
    'Xonotic':'https://xonotic.org/',
    'Teeworlds':'https://www.teeworlds.com/',
    'Soldat':'https://soldat.pl/',
    'TrackMania Starter Access':'https://www.ubisoft.com/game/trackmania/trackmania',
    'Asphalt Legends Unite':'https://www.asphaltlegends.com/',
    'Asphalt 9: Legends':'https://www.asphaltlegends.com/',
    'Disney Speedstorm':'https://disneyspeedstorm.com/',
    'eFootball':'https://www.konami.com/efootball/',
    'UFL':'https://www.joinufl.com/',
    'Yu-Gi-Oh! Master Duel':'https://www.konami.com/yugioh/masterduel/',
    'Magic: The Gathering Arena':'https://magic.wizards.com/en/mtgarena',
    'Hearthstone':'https://hearthstone.blizzard.com/',
    'Legends of Runeterra':'https://playruneterra.com/',
    'Pokémon TCG Live':'https://tcg.pokemon.com/en-us/tcgl/',

    'Chess.com':'https://www.chess.com/',
    'Lichess':'https://lichess.org/',
    'Board Game Arena':'https://boardgamearena.com/',
    'Codenames Online':'https://codenames.game/',
    'Skribbl.io':'https://skribbl.io/',
    'Gartic Phone':'https://garticphone.com/',
    'Gartic.io':'https://gartic.io/',
    'Curve Fever':'https://curvefever.pro/',
    'Little Big Snake':'https://littlebigsnake.com/',
    'Slither.io':'https://slither.io/',
    'Agar.io':'https://agar.io/',
    'Diep.io':'https://diep.io/',
    'ZombsRoyale.io':'https://zombsroyale.io/',
    'Krunker':'https://krunker.io/',
    'Shell Shockers':'https://shellshock.io/',
    'War Brokers':'https://warbrokers.io/',
    'Venge.io':'https://venge.io/',
    'Kirka.io':'https://kirka.io/',
    'Ev.io':'https://ev.io/',
    'Mini Royale':'https://miniroyale.io/',
    'BuildNow GG':'https://www.buildnow.gg/',
    '1v1.LOL':'https://1v1.lol/',
    'LOLBeans.io':'https://lolbeans.io/',
    'Smash Karts':'https://smashkarts.io/',
    'Kour.io':'https://kour.io/',
    'Repuls.io':'https://repuls.io/',
    'Bullet Force':'https://www.blayzegames.com/bullet-force',
    'Forward Assault Remix':'https://www.blayzegames.com/forward-assault',
    'Merc Zone':'https://www.crazygames.com/game/merc-zone',
    'Tanki Online':'https://tankionline.com/',
    'Hordes.io':'https://hordes.io/',
    'Stein.world':'https://stein.world/',
    'Mad World MMO':'https://www.madworldmmo.com/',
    'Pokemon Showdown':'https://play.pokemonshowdown.com/',
    'TETR.IO':'https://tetr.io/',
    'Jstris':'https://jstris.jezevec10.com/',
    'Bonk.io':'https://bonk.io/',
    'Deeeep.io':'https://deeeep.io/',
    'Mope.io':'https://mope.io/',
    'Starblast.io':'https://starblast.io/',
    'FlyOrDie.io':'https://www.flyordie.com/',
    'Territorial.io':'https://territorial.io/',
    'Colonist':'https://colonist.io/',
    'Richup.io':'https://richup.io/',
    'PlayingCards.io':'https://playingcards.io/',
    'NetGames.io':'https://netgames.io/',
    'AirConsole':'https://www.airconsole.com/',
    'JKLM.fun BombParty':'https://jklm.fun/',
    'JKLM.fun PopSauce':'https://jklm.fun/',
    'Secret Hitler Online':'https://secrethitler.io/',

    'Town of Salem 2':'https://www.townofsalem2.com/',
    'Goose Goose Duck':'https://www.goosegooseduck.com/',
    'Among Us Free Mobile':'https://www.innersloth.com/games/among-us/',
    'Brawl Stars':'https://supercell.com/en/games/brawlstars/',
    'Clash Royale':'https://supercell.com/en/games/clashroyale/',
    'Clash of Clans':'https://supercell.com/en/games/clashofclans/',
    'PUBG Mobile':'https://www.pubgmobile.com/',
    'Call of Duty Mobile':'https://www.callofduty.com/mobile',
    'Mobile Legends: Bang Bang':'https://m.mobilelegends.com/',
    'Honor of Kings':'https://www.honorofkings.com/',
    'Arena of Valor':'https://www.arenaofvalor.com/',
    'Free Fire':'https://ff.garena.com/',
    'Mech Arena':'https://mecharena.com/',
    'Critical Ops':'https://criticalopsgame.com/',
    'Pixel Gun 3D':'https://pixelgun3d.com/',
    'Shadowgun Legends':'https://www.madfingergames.com/shadowgun-legends',
    'Sky: Children of the Light':'https://www.thatskygame.com/',
    'Genshin Impact':'https://genshin.hoyoverse.com/',
    'Wuthering Waves':'https://wutheringwaves.kurogames.com/',
    'Tower of Fantasy':'https://www.toweroffantasy-global.com/',
    'Zenless Zone Zero':'https://zenless.hoyoverse.com/',
    'Honkai: Star Rail':'https://hsr.hoyoverse.com/',

    'Robocraft':'https://www.robocraftgame.com/',
    'Crossout':'https://crossout.net/',
    'MechWarrior Online':'https://mwomercs.com/',
    'Star Conflict':'https://star-conflict.com/',
    'OpenTTD':'https://www.openttd.org/',
    '0 A.D.':'https://play0ad.com/',
    'Beyond All Reason':'https://www.beyondallreason.info/',
    'Mindustry':'https://mindustrygame.github.io/',
    'Wesnoth':'https://www.wesnoth.org/',
    'Hedgewars':'https://www.hedgewars.org/',
    'OpenRA':'https://www.openra.net/',

    'Drawasaurus':'https://www.drawasaurus.org/',
    'Sketchful.io':'https://sketchful.io/',
    'Drawize':'https://www.drawize.com/',
    'Wavelength Online':'https://www.wavelength.zone/',
    'Spyfall.app':'https://spyfall.app/',
    'CardzMania':'https://www.cardzmania.com/',
    'Backgammon Galaxy':'https://backgammongalaxy.com/',
    'Dominion Online':'https://dominion.games/',
    'Yucata':'https://www.yucata.de/',
    'Tabletopia':'https://tabletopia.com/',
    'Boardspace':'https://www.boardspace.net/',
    'Freeciv-web':'https://www.freecivweb.org/',
    'Little War Game':'https://www.littlewargame.com/',
    'TagPro':'https://tagpro.koalabeast.com/',
    'Narrow One':'https://narrow.one/',
    'SuperTuxKart':'https://supertuxkart.net/',
    'Luanti':'https://www.luanti.org/',
    'Veloren':'https://veloren.net/',
    'Freeciv':'https://www.freeciv.org/',
    'Warzone 2100':'https://wz2100.net/',
    'Zero-K':'https://zero-k.info/',
    'MegaGlest':'https://megaglest.org/',
    'Widelands':'https://www.widelands.org/',
    'FreeOrion':'https://www.freeorion.org/',
    'Red Eclipse 2':'https://redeclipse.net/',
    'AssaultCube':'https://assault.cubers.net/',
    'Cube 2 Sauerbraten':'http://sauerbraten.org/',
    'Unvanquished':'https://unvanquished.net/',
    'OpenSpades':'https://openspades.yvt.jp/',
    'BZFlag':'https://www.bzflag.org/',
    'Armagetron Advanced':'https://www.armagetronad.org/',
    'Netrek':'https://www.netrek.org/',
    'DDraceNetwork':'https://ddnet.org/',
    'OpenClonk':'https://www.openclonk.org/',
    'OpenLieroX':'https://www.openlierox.net/',
    'Stendhal':'https://stendhalgame.org/',
    'Ryzom':'https://ryzom.com/',
    'Spaceteam':'https://spaceteam.ca/',
    'BombSquad':'https://www.froemling.net/apps/bombsquad'
  };

  function filterRaw(raw) {
    return String(raw || '')
      .split('|')
      .filter(Boolean)
      .filter(row => !RETIRED_OR_DEAD.has(keyFor(row.split('~')[0])))
      .join('|');
  }

  function storeSearch(row) {
    const [title, , platforms = '', , setup = '', , tags = ''] = String(row || '').split('~');
    const query = encodeURIComponent(title || 'free multiplayer game');
    const text = `${platforms} ${setup} ${tags}`.toLowerCase();

    if (/browser|no download/.test(text)) return `https://www.google.com/search?q=${query}+official+browser+game`;
    if (/mobile|android/.test(text)) return `https://play.google.com/store/search?q=${query}&c=apps`;
    if (/switch|nintendo/.test(text)) return `https://www.nintendo.com/us/search/#q=${query}`;
    if (/xbox/.test(text)) return `https://www.xbox.com/en-US/search/results?q=${query}`;
    if (/playstation|ps4|ps5/.test(text)) return `https://store.playstation.com/en-us/search/${query}`;
    if (/pc|download/.test(text)) return `https://store.steampowered.com/search/?term=${query}`;
    return `https://www.google.com/search?q=${query}+official+game`;
  }

  function rows() {
    return String(window.EDDIE_RAW || '').split('|').filter(Boolean);
  }

  const beforeCount = rows().length;
  window.EDDIE_RAW = filterRaw(window.EDDIE_RAW);
  window.EDDIE_URLS = { ...(window.EDDIE_URLS || {}), ...DIRECT_URLS };

  const generated = [];
  rows().forEach(row => {
    const title = row.split('~')[0];
    const existing = String(window.EDDIE_URLS[title] || '');
    if (!existing || /google\.com\/search/i.test(existing)) {
      window.EDDIE_URLS[title] = storeSearch(row);
      generated.push(title);
    }
  });

  window.EDDIE_LINK_AUDIT = {
    directOverrides: Object.keys(DIRECT_URLS).length,
    generatedFallbacks: generated,
    removedRetired: beforeCount - rows().length,
    checkedAt: new Date().toISOString()
  };
})();