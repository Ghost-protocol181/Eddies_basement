(() => {
  'use strict';

  const APP_VERSION = '2.1.0';
  const STORAGE = {
    favorites: 'eb-favorites',
    recent: 'eb-recent',
    hidden: 'eb-hidden',
    played: 'eb-played',
    lastRandom: 'eb-last-random',
    randomPrefs: 'eb-random-prefs',
    workingArt: 'eb-working-artwork',
    reports: 'eb-reports',
    logs: 'eb-error-log'
  };
  const BAD_ART = /image\.thum\.io|screenshotmachine|urlbox|s\.wordpress\.com\/mshots|mshots\/v1|not authorized|paid account|google\.com\/s2\/favicons|duckduckgo\.com\/ip3|favicon|panel-fallback\.svg|\/Cover\.png|data:image\/svg/i;
  const MIN_WIDTH = 300;
  const MIN_HEIGHT = 150;

  const $ = selector => document.querySelector(selector);
  const safeRead = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);
  const attr = value => esc(value).replace(/`/g, '&#96;');
  const keyFor = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const textFor = game => [
    game.title, game.genre, game.platforms.join(' '), game.mode, game.setup, game.players, game.tags.join(' ')
  ].join(' ').toLowerCase();

  const els = {
    search: $('#search'), platform: $('#platform'), setup: $('#setup'), clear: $('#clearBtn'),
    more: $('#moreBtn'), shareFilters: $('#shareFilters'), chips: $('#chips'), activeFilters: $('#activeFilters'),
    grid: $('#gamesGrid'), featured: $('#featuredRail'), quick: $('#quickRail'), friends: $('#friendsRail'),
    favorites: $('#favoritesRail'), recent: $('#recentRail'), favoritesSection: $('#favoritesSection'),
    recentSection: $('#recentSection'), count: $('#count'), total: $('#allCount'), status: $('#catalogStatus'),
    modal: $('#modal'), modalImg: $('#modalImg'), modalInner: $('#modalInner'), random: $('#randomBtn'),
    randomizer: $('#randomizer'), randomClose: $('#randomClose'), modeGrid: $('#modeGrid'),
    randomPlayers: $('#randomPlayers'), randomPlatform: $('#randomPlatform'), randomSetup: $('#randomSetup'),
    randomStyle: $('#randomStyle'), saveRandomPrefs: $('#saveRandomPrefs'), randomGo: $('#randomGo'),
    randomReset: $('#randomReset'), toast: $('#toast'), brand: $('#brandImg'), brandText: $('#brandText')
  };

  const state = {
    games: [], q: '', platform: '', setup: '', tags: new Set(), showAll: true,
    favorites: new Set(safeRead(STORAGE.favorites, [])),
    recent: safeRead(STORAGE.recent, []),
    hidden: new Set(safeRead(STORAGE.hidden, [])),
    played: new Set(safeRead(STORAGE.played, [])),
    lastRandom: safeRead(STORAGE.lastRandom, ''),
    randomMode: 'safe',
    randomPrefs: safeRead(STORAGE.randomPrefs, { players:'', platform:'', setup:'', style:'', mode:'safe' })
  };
  const failedArt = new Set();
  const workingArt = safeRead(STORAGE.workingArt, {});

  Object.keys(workingArt).forEach(title => {
    const url = String(workingArt[title] || '');
    if (!url || BAD_ART.test(url)) delete workingArt[title];
  });
  localStorage.removeItem('eb-failed-artwork');
  save(STORAGE.workingArt, workingArt);

  function log(type, detail = {}) {
    const logs = safeRead(STORAGE.logs, []);
    logs.push({ type, detail, at:new Date().toISOString(), version:APP_VERSION, path:location.pathname + location.search + location.hash });
    save(STORAGE.logs, logs.slice(-120));
    try { window.EddieTrack?.(type, detail); } catch {}
  }

  function toast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.classList.remove('show'), 1900);
  }

  function normalizePlatform(value) {
    const map = {
      playstation:'PlayStation', ps:'PlayStation', ps4:'PlayStation', ps5:'PlayStation', xbox:'Xbox',
      pc:'PC', windows:'PC', mobile:'Mobile', android:'Mobile', ios:'Mobile', browser:'Browser', web:'Browser',
      switch:'Switch', nintendo:'Switch', console:'Console', vr:'VR', mac:'Mac', macos:'Mac', linux:'Linux'
    };
    return map[String(value || '').toLowerCase()] || String(value || '').trim();
  }

  function normalizeSetup(value) {
    const setup = String(value || 'Check').trim().toLowerCase();
    if (setup.includes('no download') || setup === 'browser') return 'No download';
    if (setup.includes('account')) return 'Account';
    if (setup.includes('download')) return 'Download';
    return 'Check';
  }

  function normalizeGame(input, id) {
    const platforms = [...new Set(
      (Array.isArray(input.platforms) ? input.platforms : String(input.platforms || '').split(/\s+/))
        .filter(Boolean).map(normalizePlatform)
    )];
    const tags = (Array.isArray(input.tags) ? input.tags : String(input.tags || '').split(/\s+/))
      .filter(Boolean).map(tag => String(tag).toLowerCase());
    let setup = normalizeSetup(input.setup);
    if (platforms.includes('Browser') && setup === 'Check') setup = 'No download';
    return {
      id,
      title: String(input.title || '').trim(),
      genre: String(input.genre || 'Game').trim(),
      platforms,
      mode: String(input.mode || 'Multiplayer').trim(),
      setup,
      players: String(input.players || 'Varies').trim(),
      tags,
      browserVerified: platforms.includes('Browser') && (setup === 'No download' || setup === 'Account')
    };
  }

  function parseRaw(raw) {
    return String(raw || '').split('|').filter(Boolean).map((row, id) => {
      const [title, genre, platforms, mode, setup, players, tags] = row.split('~');
      return normalizeGame({ title, genre, platforms, mode, setup, players, tags }, id);
    });
  }

  function uniqueGames(items) {
    const seen = new Set();
    return items.filter(game => {
      const key = keyFor(game.title);
      if (!key || seen.has(key) || !game.platforms.length) return false;
      seen.add(key);
      return true;
    });
  }

  function steamMirrors(url) {
    const match = String(url || '').match(/steam(?:static)?\.com\/steam\/apps\/(\d+)\/header\.jpg|steam\/apps\/(\d+)\/header\.jpg/);
    const id = match && (match[1] || match[2]);
    return id ? [
      `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`,
      `https://steamcdn-a.akamaihd.net/steam/apps/${id}/header.jpg`
    ] : [];
  }

  function listFrom(value) {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  function artworkFor(title) {
    const art = window.EDDIE_ARTWORK || {};
    const previews = window.EDDIE_PREVIEWS || {};
    const primary = previews[title];
    return [...new Set([
      workingArt[title],
      ...listFrom(art[title]),
      primary,
      ...steamMirrors(primary),
      ...listFrom(art[title]).flatMap(steamMirrors)
    ].filter(Boolean).map(String))].filter(url => !BAD_ART.test(url));
  }

  function enrich(items) {
    const urls = window.EDDIE_URLS || {};
    return items.map((game, id) => ({
      ...game,
      id,
      artCandidates: artworkFor(game.title),
      url: urls[game.title] || `https://www.google.com/search?q=${encodeURIComponent(game.title + ' official game')}`
    }));
  }

  function loadCatalog() {
    let games = [];
    if (typeof window.EDDIE_RAW === 'string' && window.EDDIE_RAW.trim()) games = parseRaw(window.EDDIE_RAW);
    else if (Array.isArray(window.EDDIE_FALLBACK)) games = window.EDDIE_FALLBACK.map(normalizeGame);
    games = uniqueGames(games);
    if (!games.length) throw new Error('Catalog unavailable');
    return enrich(games);
  }

  const hasRealArt = game => Boolean(game?.artCandidates?.some(url => !failedArt.has(url) && !BAD_ART.test(url)));
  const availableArt = game => game.artCandidates.filter(url => !failedArt.has(url) && !BAD_ART.test(url));

  function setStatus(type) {
    if (!els.status) return;
    const messages = {
      loading:'<div class="stateCard"><div class="spinner"></div><strong>Getting the games ready…</strong></div>',
      unavailable:'<div class="stateCard"><strong>We could not load the game shelf.</strong><span>Refresh and try again.</span></div>',
      empty:'<div class="stateCard"><strong>No games match those choices.</strong><span>Try another search or clear the filters.</span></div>'
    };
    els.status.innerHTML = messages[type] || '';
    els.status.hidden = !messages[type];
  }

  function artMarkup(game, eager) {
    const urls = availableArt(game);
    if (!urls.length) return '';
    return `<div class="skeleton"></div><img src="${attr(urls[0])}" data-game-id="${game.id}" data-art-index="0" alt="${attr(game.title)} game artwork" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }

  function card(game, eager = false) {
    const noArt = !hasRealArt(game);
    const favorite = state.favorites.has(game.title);
    return `<article class="card ${noArt ? 'noRealArt qaTextCard' : ''}" tabindex="0" data-id="${game.id}" aria-label="View ${attr(game.title)}">
      <div class="art">
        ${artMarkup(game, eager)}
        <button class="favoriteBtn ${favorite ? 'active' : ''}" type="button" data-favorite="${attr(game.title)}" aria-label="${favorite ? 'Remove from' : 'Add to'} favorites">${favorite ? '★' : '☆'}</button>
        <div class="badges"><span class="badge ${game.setup === 'No download' ? 'easy' : ''}">${esc(game.setup)}</span><span class="badge">${esc(game.platforms[0] || 'Game')}</span></div>
        <div class="posterTitle"><h3>${esc(game.title)}</h3><p>${esc(game.genre)} · ${esc(game.players)}</p></div>
      </div>
      <div class="body"><span>${esc(game.mode)}</span><button class="detailsBtn" type="button">Details</button></div>
    </article>`;
  }

  function markCardNoArt(img) {
    const cardEl = img.closest('.card');
    cardEl?.classList.add('noRealArt', 'qaTextCard');
    img.closest('.art')?.querySelector('.skeleton')?.remove();
    img.remove();
    if (cardEl?.closest('#featuredRail,#quickRail,#friendsRail')) cardEl.remove();
  }

  function tryNextImage(img) {
    const game = state.games[Number(img.dataset.gameId)];
    if (!game) return markCardNoArt(img);
    const current = img.currentSrc || img.src;
    if (current) failedArt.add(current);
    const remaining = availableArt(game);
    const next = remaining.find(url => url !== current);
    if (!next) {
      log('artwork_exhausted', { title:game.title });
      markCardNoArt(img);
      return;
    }
    img.src = next;
  }

  function imageLoaded(img) {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const ratio = height ? width / height : 0;
    if (width < MIN_WIDTH || height < MIN_HEIGHT || ratio < 1.02 || ratio > 3.6) {
      tryNextImage(img);
      return;
    }
    img.closest('.art')?.querySelector('.skeleton')?.remove();
    const game = state.games[Number(img.dataset.gameId)];
    if (game) {
      workingArt[game.title] = img.currentSrc || img.src;
      save(STORAGE.workingArt, workingArt);
    }
  }

  function wireImages(root) {
    root?.querySelectorAll('.card .art img').forEach(img => {
      img.addEventListener('load', () => imageLoaded(img), { once:true });
      img.addEventListener('error', () => tryNextImage(img), { once:true });
    });
  }

  function toggleFavorite(title) {
    state.favorites.has(title) ? state.favorites.delete(title) : state.favorites.add(title);
    save(STORAGE.favorites, [...state.favorites]);
    renderAll();
    const button = $('#favoriteModal');
    if (button) button.textContent = state.favorites.has(title) ? 'Remove Favorite' : 'Save This';
    toast(state.favorites.has(title) ? 'Saved to favorites' : 'Removed from favorites');
  }

  function wireCards(root) {
    root?.querySelectorAll('[data-favorite]').forEach(button => {
      button.onclick = event => {
        event.stopPropagation();
        toggleFavorite(button.dataset.favorite);
      };
    });
    root?.querySelectorAll('.card').forEach(cardEl => {
      cardEl.onclick = event => {
        if (event.target.closest('[data-favorite]')) return;
        openGame(state.games[Number(cardEl.dataset.id)]);
      };
      cardEl.onkeydown = event => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button')) {
          event.preventDefault();
          openGame(state.games[Number(cardEl.dataset.id)]);
        }
      };
    });
    wireImages(root);
  }

  function fillRail(element, games, eager = false) {
    if (!element) return;
    element.innerHTML = games.map((game, index) => card(game, eager && index < 4)).join('');
    wireCards(element);
  }

  function fillFrom(source, predicate, used, limit) {
    const result = [];
    for (const game of source) {
      if (result.length >= limit) break;
      if (used.has(game.title) || !predicate(game)) continue;
      used.add(game.title);
      result.push(game);
    }
    return result;
  }

  function padRail(items, source, used, limit) {
    if (items.length >= limit) return items;
    return items.concat(fillFrom(source, () => true, used, limit - items.length));
  }

  function renderRails() {
    const visible = state.games.filter(game => !state.hidden.has(game.title));
    const artGames = visible.filter(hasRealArt);
    const used = new Set();

    const featured = fillFrom(artGames, () => true, used, 14);
    let quick = fillFrom(artGames, game => game.setup !== 'Download' || game.platforms.includes('Browser') || game.platforms.includes('Mobile'), used, 14);
    quick = padRail(quick, artGames, used, 14);
    let friends = fillFrom(artGames, game => /party|co-op|team|squad/.test(textFor(game)) || /4|5|6|7|8|12|16|many|massive/i.test(game.players), used, 14);
    friends = padRail(friends, artGames, used, 14);

    fillRail(els.featured, featured, true);
    fillRail(els.quick, quick);
    fillRail(els.friends, friends);

    const favorites = visible.filter(game => state.favorites.has(game.title));
    if (els.favoritesSection) els.favoritesSection.hidden = !favorites.length;
    fillRail(els.favorites, favorites);

    const recent = state.recent.map(title => visible.find(game => game.title === title)).filter(Boolean).slice(0, 12);
    if (els.recentSection) els.recentSection.hidden = !recent.length;
    fillRail(els.recent, recent);
  }

  function queryMatch(game, query) {
    if (!query) return true;
    return textFor(game).includes(query);
  }

  function filteredGames() {
    const list = state.games.filter(game =>
      !state.hidden.has(game.title) &&
      queryMatch(game, state.q) &&
      (!state.platform || game.platforms.includes(state.platform)) &&
      (!state.setup || game.setup === state.setup) &&
      [...state.tags].every(tag => textFor(game).includes(tag)) &&
      (state.showAll || hasRealArt(game) || state.q || state.platform || state.setup || state.tags.size)
    );
    return list.sort((a, b) =>
      Number(state.favorites.has(b.title)) - Number(state.favorites.has(a.title)) ||
      Number(hasRealArt(b)) - Number(hasRealArt(a)) ||
      a.title.localeCompare(b.title)
    );
  }

  function renderActiveFilters() {
    if (!els.activeFilters) return;
    const items = [];
    if (state.q) items.push(['q', `Search: ${state.q}`]);
    if (state.platform) items.push(['platform', state.platform]);
    if (state.setup) items.push(['setup', state.setup]);
    state.tags.forEach(tag => items.push([`tag:${tag}`, tag.replace(/\b\w/g, c => c.toUpperCase())]));
    els.activeFilters.innerHTML = items.map(([key, label]) => `<button class="activeFilter" type="button" data-remove="${attr(key)}">${esc(label)} ×</button>`).join('');
    els.activeFilters.querySelectorAll('[data-remove]').forEach(button => {
      button.onclick = () => {
        const key = button.dataset.remove;
        if (key === 'q') { state.q = ''; if (els.search) els.search.value = ''; }
        else if (key === 'platform') { state.platform = ''; if (els.platform) els.platform.value = ''; }
        else if (key === 'setup') { state.setup = ''; if (els.setup) els.setup.value = ''; }
        else state.tags.delete(key.slice(4));
        render();
      };
    });
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.platform) params.set('platform', state.platform);
    if (state.setup) params.set('setup', state.setup);
    if (state.tags.size) params.set('tags', [...state.tags].join(','));
    history.replaceState(null, '', `${location.pathname}${params.toString() ? '?' + params : ''}${location.hash}`);
  }

  function render() {
    els.chips?.querySelectorAll('[data-chip]').forEach(button => button.classList.toggle('active', state.tags.has(button.dataset.chip)));
    if (els.more) {
      els.more.classList.toggle('active', state.showAll);
      els.more.textContent = state.showAll ? 'Show Picks' : 'All Games';
    }
    const list = filteredGames();
    if (els.grid) els.grid.innerHTML = list.map(game => card(game)).join('');
    if (els.count) els.count.textContent = `${list.length} game${list.length === 1 ? '' : 's'}`;
    setStatus(list.length ? '' : 'empty');
    wireCards(els.grid);
    renderActiveFilters();
    updateUrl();
  }

  function renderAll() {
    renderRails();
    render();
  }

  function setupFilters() {
    const platforms = [...new Set(state.games.flatMap(game => game.platforms))].sort();
    if (els.platform) els.platform.innerHTML = '<option value="">Any platform</option>' + platforms.map(value => `<option>${esc(value)}</option>`).join('');
    if (els.randomPlatform) els.randomPlatform.innerHTML = '<option value="">Any</option>' + platforms.map(value => `<option>${esc(value)}</option>`).join('');
    const chips = ['browser','no download','party','co-op','shooter','mobile','racing','local','strategy'];
    if (els.chips) els.chips.innerHTML = chips.map(value => `<button class="chip" type="button" data-chip="${attr(value)}">${esc(value.replace(/\b\w/g, c => c.toUpperCase()))}</button>`).join('');
    els.chips?.querySelectorAll('[data-chip]').forEach(button => {
      button.onclick = () => {
        const tag = button.dataset.chip;
        state.tags.has(tag) ? state.tags.delete(tag) : state.tags.add(tag);
        render();
      };
    });
  }

  function hideModalArt() {
    const art = els.modalImg?.closest('.modalArt');
    if (els.modalImg) {
      els.modalImg.onload = null;
      els.modalImg.onerror = null;
      els.modalImg.removeAttribute('src');
      els.modalImg.hidden = true;
    }
    if (art) art.hidden = true;
    els.modal?.classList.add('noRealArtModal');
  }

  function showModalArt(game, urls, index = 0) {
    const art = els.modalImg?.closest('.modalArt');
    const url = urls[index];
    if (!els.modalImg || !art || !url) return hideModalArt();
    art.hidden = false;
    els.modal.classList.remove('noRealArtModal');
    els.modalImg.hidden = false;
    els.modalImg.alt = `${game.title} artwork`;
    els.modalImg.src = url;
    els.modalImg.onload = () => {
      const width = els.modalImg.naturalWidth;
      const height = els.modalImg.naturalHeight;
      const ratio = height ? width / height : 0;
      if (width < MIN_WIDTH || height < MIN_HEIGHT || ratio < 1.02 || ratio > 3.6) {
        failedArt.add(url);
        showModalArt(game, urls, index + 1);
        return;
      }
      workingArt[game.title] = els.modalImg.currentSrc || els.modalImg.src;
      save(STORAGE.workingArt, workingArt);
    };
    els.modalImg.onerror = () => {
      failedArt.add(url);
      showModalArt(game, urls, index + 1);
    };
  }

  function closeModal() {
    els.modal?.classList.remove('open', 'noRealArtModal');
    hideModalArt();
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname + location.search);
  }

  function saveReport(game) {
    const reason = window.prompt('What is wrong? Example: broken link, wrong platform, no longer free, or bad image.');
    if (reason === null) return;
    const reports = safeRead(STORAGE.reports, []);
    reports.push({ title:game.title, reason:String(reason).trim() || 'No details provided', url:game.url, at:new Date().toISOString(), page:location.href });
    save(STORAGE.reports, reports.slice(-150));
    toast('Thanks. Your report was saved.');
  }

  async function shareCurrent() {
    const url = location.href;
    if (navigator.share) {
      try { await navigator.share({ title:"Eddie's Basement", text:'Check out this multiplayer game', url }); return; }
      catch {}
    }
    try { await navigator.clipboard.writeText(url); toast('Link copied'); }
    catch { toast('Copy the URL to share'); }
  }

  function openGame(game, randomMeta = null) {
    if (!game || !els.modal || !els.modalInner) return;
    state.recent = [game.title, ...state.recent.filter(title => title !== game.title)].slice(0, 20);
    save(STORAGE.recent, state.recent);

    hideModalArt();
    const urls = availableArt(game);
    if (urls.length) showModalArt(game, urls);

    const favorite = state.favorites.has(game.title);
    const randomBlock = randomMeta ? `<span class="randomResultTag">✦ ${esc(randomMeta.label)}</span>` : '';
    els.modalInner.innerHTML = `${randomBlock}
      <div class="modalHead"><div><h2>${esc(game.title)}</h2><p>${esc(game.genre)} · ${esc(game.platforms.join(', '))}</p></div><button class="close" id="closeModal" type="button">Close</button></div>
      <div class="facts"><div><b>${esc(game.players)}</b><span>Players</span></div><div><b>${esc(game.setup)}</b><span>Setup</span></div><div><b>${esc(game.mode)}</b><span>Mode</span></div><div><b>${esc(game.platforms.join(', '))}</b><span>Platforms</span></div></div>
      <div class="actions"><a class="action play" href="${attr(game.url)}" target="_blank" rel="noopener noreferrer">Visit Game</a>${randomMeta ? '<button class="action pickAgain" id="pickAgain" type="button">Pick Again</button>' : ''}<button class="action" id="favoriteModal" type="button">${favorite ? 'Remove Favorite' : 'Save This'}</button><button class="action" id="playedBtn" type="button">Played It</button><button class="action" id="shareGame" type="button">Share</button><button class="action" id="reportBtn" type="button">Report a Problem</button></div>`;

    els.modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    history.replaceState(null, '', `${location.pathname}${location.search}#game=${encodeURIComponent(game.title)}`);
    $('#closeModal')?.addEventListener('click', closeModal);
    $('#favoriteModal')?.addEventListener('click', () => toggleFavorite(game.title));
    $('#playedBtn')?.addEventListener('click', () => {
      state.played.add(game.title);
      save(STORAGE.played, [...state.played]);
      toast('Marked as played');
    });
    $('#shareGame')?.addEventListener('click', shareCurrent);
    $('#reportBtn')?.addEventListener('click', () => saveReport(game));
    $('#pickAgain')?.addEventListener('click', () => pickRandom(randomMeta?.mode || state.randomMode, true));
    renderRails();
  }

  function playerMatch(game, value) {
    if (!value) return true;
    const players = game.players.toLowerCase();
    if (value === '2') return /2|two|1v1/.test(players);
    if (value === '4') return /4|5|6|7|8|many|massive/.test(players);
    if (value === 'many') return /8|12|16|many|massive|mmo/.test(players);
    return true;
  }

  function randomPool(mode) {
    const prefs = {
      players:els.randomPlayers?.value || '', platform:els.randomPlatform?.value || '',
      setup:els.randomSetup?.value || '', style:els.randomStyle?.value || ''
    };
    let pool = state.games.filter(game =>
      !state.hidden.has(game.title) && !state.played.has(game.title) && game.title !== state.lastRandom &&
      playerMatch(game, prefs.players) && (!prefs.platform || game.platforms.includes(prefs.platform))
    );
    if (prefs.setup === 'browser') pool = pool.filter(game => game.browserVerified || game.setup === 'No download');
    if (prefs.setup === 'download') pool = pool.filter(game => !game.platforms.includes('Browser'));
    if (prefs.style) pool = pool.filter(game => textFor(game).includes(prefs.style) || (prefs.style === 'competitive' && /shooter|battle|pvp|racing|sports/.test(textFor(game))));
    if (mode === 'safe') pool = pool.filter(game => game.setup === 'No download' || /party|co-op|casual|browser/.test(textFor(game)));
    if (mode === 'deep') pool = pool.filter(game => !state.favorites.has(game.title) && !state.recent.includes(game.title)).reverse();
    if (mode === 'twenty') pool = pool.filter(game => game.setup === 'No download' || /quick|party|browser|round/.test(textFor(game)));
    if (mode === 'night') pool = pool.filter(game => /mmo|rpg|strategy|survival|progression|co-op/.test(textFor(game)));
    return pool;
  }

  function pickRandom(mode = state.randomMode, keepOpen = false) {
    const pool = randomPool(mode);
    const fallback = state.games.filter(game => !state.hidden.has(game.title) && game.title !== state.lastRandom);
    const source = pool.length ? pool : fallback;
    if (!source.length) { toast('No matching games. Try resetting the randomizer.'); return; }
    const game = source[Math.floor(Math.random() * source.length)];
    state.lastRandom = game.title;
    save(STORAGE.lastRandom, state.lastRandom);
    if (els.saveRandomPrefs?.checked) {
      state.randomPrefs = {
        players:els.randomPlayers.value, platform:els.randomPlatform.value,
        setup:els.randomSetup.value, style:els.randomStyle.value, mode
      };
      save(STORAGE.randomPrefs, state.randomPrefs);
    }
    if (!keepOpen) closeRandomizer();
    const labels = { safe:'Easy Pick', chaos:'Anything Goes', deep:'Hidden Gem', twenty:'Quick Round', night:'Longer Session' };
    openGame(game, { mode, label:labels[mode] || 'Random Pick' });
  }

  function openRandomizer() {
    if (!els.randomizer) return;
    els.randomizer.hidden = false;
    document.body.style.overflow = 'hidden';
    const prefs = state.randomPrefs || {};
    state.randomMode = prefs.mode || 'safe';
    if (els.randomPlayers) els.randomPlayers.value = prefs.players || '';
    if (els.randomPlatform) els.randomPlatform.value = prefs.platform || '';
    if (els.randomSetup) els.randomSetup.value = prefs.setup || '';
    if (els.randomStyle) els.randomStyle.value = prefs.style || '';
    if (els.saveRandomPrefs) els.saveRandomPrefs.checked = Boolean(safeRead(STORAGE.randomPrefs, null));
    els.modeGrid?.querySelectorAll('[data-mode]').forEach(button => button.classList.toggle('active', button.dataset.mode === state.randomMode));
    els.randomGo?.focus();
  }

  function closeRandomizer() {
    if (els.randomizer) els.randomizer.hidden = true;
    document.body.style.overflow = '';
  }

  function resetRandomizer() {
    state.randomMode = 'safe';
    ['randomPlayers','randomPlatform','randomSetup','randomStyle'].forEach(key => { if (els[key]) els[key].value = ''; });
    if (els.saveRandomPrefs) els.saveRandomPrefs.checked = false;
    localStorage.removeItem(STORAGE.randomPrefs);
    toast('Randomizer reset');
  }

  function loadUrlState() {
    const params = new URLSearchParams(location.search);
    state.q = (params.get('q') || '').toLowerCase();
    state.platform = params.get('platform') || '';
    state.setup = params.get('setup') || '';
    state.tags = new Set((params.get('tags') || '').split(',').filter(Boolean));
    if (els.search) els.search.value = state.q;
  }

  function initEvents() {
    if (els.search) els.search.oninput = event => { state.q = event.target.value.trim().toLowerCase(); render(); };
    if (els.platform) els.platform.onchange = event => { state.platform = event.target.value; render(); };
    if (els.setup) els.setup.onchange = event => { state.setup = event.target.value; render(); };
    if (els.clear) els.clear.onclick = () => {
      state.q = ''; state.platform = ''; state.setup = ''; state.tags.clear();
      if (els.search) els.search.value = '';
      if (els.platform) els.platform.value = '';
      if (els.setup) els.setup.value = '';
      render();
    };
    if (els.more) els.more.onclick = () => { state.showAll = !state.showAll; render(); };
    if (els.shareFilters) els.shareFilters.onclick = shareCurrent;
    if (els.random) els.random.onclick = openRandomizer;
    if (els.randomClose) els.randomClose.onclick = closeRandomizer;
    if (els.randomizer) els.randomizer.onclick = event => { if (event.target === els.randomizer) closeRandomizer(); };
    els.modeGrid?.querySelectorAll('[data-mode]').forEach(button => {
      button.onclick = () => {
        state.randomMode = button.dataset.mode;
        els.modeGrid.querySelectorAll('[data-mode]').forEach(item => item.classList.toggle('active', item === button));
      };
    });
    if (els.randomGo) els.randomGo.onclick = () => pickRandom(state.randomMode);
    if (els.randomReset) els.randomReset.onclick = resetRandomizer;
    if (els.modal) els.modal.onclick = event => { if (event.target === els.modal) closeModal(); };
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (els.randomizer && !els.randomizer.hidden) closeRandomizer();
      else if (els.modal?.classList.contains('open')) closeModal();
    });
    if (els.brand) els.brand.onerror = () => {
      els.brand.style.display = 'none';
      if (els.brandText) els.brandText.style.display = 'block';
    };
  }

  function init() {
    setStatus('loading');
    try {
      state.games = loadCatalog();
      window.EDDIE_APP_VERSION = APP_VERSION;
      window.EDDIE_APP_DIAGNOSTICS = {
        version:APP_VERSION,
        games:state.games.length,
        withArtwork:state.games.filter(hasRealArt).length,
        withoutArtwork:state.games.filter(game => !hasRealArt(game)).length
      };
      if (els.total) els.total.textContent = state.games.length;
      setupFilters();
      loadUrlState();
      if (els.platform) els.platform.value = state.platform;
      if (els.setup) els.setup.value = state.setup;
      initEvents();
      renderAll();
      const hash = new URLSearchParams(location.hash.replace(/^#/, '')).get('game');
      if (hash) {
        const game = state.games.find(item => item.title.toLowerCase() === hash.toLowerCase());
        if (game) openGame(game);
      }
      log('catalog_ready', window.EDDIE_APP_DIAGNOSTICS);
    } catch (error) {
      log('catalog_unavailable', { message:String(error) });
      if (els.total) els.total.textContent = '—';
      setStatus('unavailable');
    }
  }

  init();
})();
