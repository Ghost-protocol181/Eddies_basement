(() => {
  'use strict';

  const FALLBACK = 'panel-fallback.svg';
  const MIN_CATALOG_SIZE = 20;
  const CATALOG_CACHE_KEY = 'eb-catalog-cache-v4';
  const BAD_ART = /image\.thum\.io|screenshotmachine|urlbox|s\.wordpress\.com\/mshots|mshots\/v1|not authorized|paid account|google\.com\/s2\/favicons|duckduckgo\.com\/ip3|favicon|data:image\/svg/i;

  const safeRead = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  };
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);
  const attr = value => esc(value).replace(/`/g, '&#96;');
  const track = (event, detail = {}) => {
    try { window.EddieTrack?.(event, detail); } catch {}
  };

  const state = {
    games: [],
    q: '',
    platform: '',
    setup: '',
    tags: new Set(),
    showAll: true,
    favorites: new Set(safeRead('eb-favorites', [])),
    recent: safeRead('eb-recent', []),
    hidden: new Set(safeRead('eb-hidden', [])),
    played: new Set(safeRead('eb-played', [])),
    lastRandom: safeRead('eb-last-random', ''),
    randomMode: 'safe',
    randomPrefs: safeRead('eb-random-prefs', { players:'', platform:'', setup:'', style:'', mode:'safe' }),
    catalogSource: 'none'
  };

  const failedUrls = new Set();
  const workingArt = safeRead('eb-working-artwork', {});
  Object.keys(workingArt || {}).forEach(title => {
    const value = String(workingArt[title] || '');
    if (!value || BAD_ART.test(value) || value.includes(FALLBACK)) delete workingArt[title];
  });
  localStorage.removeItem('eb-failed-artwork');
  save('eb-working-artwork', workingArt);

  const els = {
    search: $('#search'), platform: $('#platform'), setup: $('#setup'), clear: $('#clearBtn'),
    more: $('#moreBtn'), shareFilters: $('#shareFilters'), chips: $('#chips'),
    activeFilters: $('#activeFilters'), grid: $('#gamesGrid'), featured: $('#featuredRail'),
    quick: $('#quickRail'), friends: $('#friendsRail'), favorites: $('#favoritesRail'),
    recent: $('#recentRail'), favoritesSection: $('#favoritesSection'), recentSection: $('#recentSection'),
    count: $('#count'), status: $('#catalogStatus'), modal: $('#modal'), modalImg: $('#modalImg'),
    modalInner: $('#modalInner'), random: $('#randomBtn'), total: $('#allCount'), brand: $('#brandImg'),
    brandText: $('#brandText'), toast: $('#toast'), randomizer: $('#randomizer'),
    randomClose: $('#randomClose'), modeGrid: $('#modeGrid'), randomPlayers: $('#randomPlayers'),
    randomPlatform: $('#randomPlatform'), randomSetup: $('#randomSetup'), randomStyle: $('#randomStyle'),
    saveRandomPrefs: $('#saveRandomPrefs'), randomGo: $('#randomGo'), randomReset: $('#randomReset')
  };

  function log(type, detail = {}) {
    const logs = safeRead('eb-error-log', []);
    logs.push({ type, detail, at:new Date().toISOString(), path:location.pathname + location.search + location.hash });
    save('eb-error-log', logs.slice(-120));
    track(type, detail);
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
      playstation:'PlayStation', ps:'PlayStation', ps4:'PlayStation', ps5:'PlayStation',
      xbox:'Xbox', pc:'PC', windows:'PC', mobile:'Mobile', android:'Mobile', ios:'Mobile',
      browser:'Browser', web:'Browser', switch:'Switch', nintendo:'Switch', console:'Console',
      vr:'VR', mac:'Mac', macos:'Mac', linux:'Linux'
    };
    return map[String(value || '').toLowerCase()] || String(value || '').trim();
  }

  function normalizeGenre(value) {
    const raw = String(value || 'Game').trim();
    const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const map = {
      fps:'Shooter', 'first person shooter':'Shooter', 'third person shooter':'Shooter',
      'battle royale':'Battle Royale', 'role playing':'RPG', 'role playing game':'RPG',
      'massively multiplayer online':'MMO', 'real time strategy':'Strategy',
      'turn based strategy':'Strategy', 'sports game':'Sports', 'party game':'Party',
      'card game':'Cards', 'social deduction':'Social Deduction', 'survival game':'Survival',
      'racing game':'Racing', 'puzzle game':'Puzzle'
    };
    return map[key] || raw.replace(/\b\w/g, char => char.toUpperCase());
  }

  function normalizeSetup(value) {
    const setup = String(value || 'Check').trim().toLowerCase();
    if (setup.includes('no download') || setup === 'browser') return 'No download';
    if (setup.includes('account')) return 'Account';
    if (setup.includes('download')) return 'Download';
    return 'Check';
  }

  function normalizeGame(game, id) {
    const title = String(game.title || '').trim();
    const platforms = [...new Set(
      (Array.isArray(game.platforms) ? game.platforms : String(game.platforms || '').split(/\s+/))
        .filter(Boolean)
        .map(normalizePlatform)
    )];
    const tags = (Array.isArray(game.tags) ? game.tags : String(game.tags || '').split(/\s+/))
      .map(tag => String(tag).toLowerCase())
      .filter(Boolean);
    let setup = normalizeSetup(game.setup);
    if (platforms.includes('Browser') && setup === 'Check') setup = 'No download';
    return {
      id,
      title,
      genre: normalizeGenre(game.genre),
      platforms,
      mode: String(game.mode || 'Multiplayer').trim(),
      setup,
      players: String(game.players || 'Varies').trim(),
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

  function dedupe(items) {
    const seen = new Set();
    return items.filter(game => {
      const key = game.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function validateCatalog(items, source) {
    const clean = dedupe(items).filter(game => game.title && game.platforms.length);
    if (clean.length < MIN_CATALOG_SIZE) throw new Error(`${source} catalog contained only ${clean.length} valid games`);
    return clean;
  }

  const listFrom = value => Array.isArray(value) ? value : value ? [value] : [];
  const uniqueUrls = values => [...new Set(
    values.flat().filter(Boolean).map(String).filter(url => !BAD_ART.test(url))
  )];

  function steamMirrors(url) {
    const match = String(url || '').match(/steam(?:static)?\.com\/steam\/apps\/(\d+)\/header\.jpg|steam\/apps\/(\d+)\/header\.jpg/);
    const id = match && (match[1] || match[2]);
    return id ? [
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`,
      `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
      `https://steamcdn-a.akamaihd.net/steam/apps/${id}/header.jpg`
    ] : [];
  }

  function candidatesFor(game) {
    const previews = window.EDDIE_PREVIEWS || {};
    const artwork = window.EDDIE_ARTWORK || {};
    const primary = previews[game.title];
    const real = uniqueUrls([
      workingArt[game.title],
      listFrom(artwork[game.title]),
      primary,
      steamMirrors(primary)
    ]).filter(url => !failedUrls.has(url));
    return real.length ? [...real, FALLBACK] : [FALLBACK];
  }

  function hasRealArt(game) {
    return Boolean(game?.artCandidates?.some(url => url !== FALLBACK && !BAD_ART.test(String(url || ''))));
  }

  function enrich(items) {
    const urls = window.EDDIE_URLS || {};
    return items.map((game, id) => {
      const artCandidates = candidatesFor(game);
      return {
        ...game,
        id,
        artCandidates,
        hasArt: hasRealArt({ artCandidates }),
        url: urls[game.title] || `https://www.google.com/search?q=${encodeURIComponent(game.title + ' official game')}`
      };
    });
  }

  async function loadCatalog() {
    if (window.EDDIE_RAW) {
      state.catalogSource = 'live';
      const live = validateCatalog(parseRaw(window.EDDIE_RAW), 'live');
      save(CATALOG_CACHE_KEY, { savedAt:new Date().toISOString(), items:live });
      return enrich(live);
    }
    const cache = safeRead(CATALOG_CACHE_KEY, null);
    if (cache?.items?.length) {
      state.catalogSource = 'cache';
      return enrich(validateCatalog(cache.items.map((game, id) => normalizeGame(game, id)), 'cache'));
    }
    throw new Error('Catalog unavailable');
  }

  function setStatus(type) {
    if (!els.status) return;
    const messages = {
      loading:'<div class="stateCard"><div class="spinner"></div><strong>Getting the games ready…</strong></div>',
      unavailable:'<div class="stateCard"><strong>We could not load the game shelf.</strong><span>Check your connection, then refresh.</span></div>',
      empty:'<div class="stateCard"><strong>No games match those choices.</strong><span>Try another search or clear your filters.</span></div>'
    };
    els.status.innerHTML = messages[type] || '';
    els.status.hidden = !messages[type];
  }

  const text = game => [
    game.title, game.genre, game.platforms.join(' '), game.mode, game.setup, game.players, game.tags.join(' ')
  ].join(' ').toLowerCase();
  const norm = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  function editDistance(a, b) {
    a = norm(a); b = norm(b);
    if (!a) return b.length;
    if (!b) return a.length;
    const rows = Array.from({ length:a.length + 1 }, (_, index) => [index]);
    for (let j = 1; j <= b.length; j++) rows[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        rows[i][j] = Math.min(
          rows[i - 1][j] + 1,
          rows[i][j - 1] + 1,
          rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return rows[a.length][b.length];
  }

  function queryMatch(game, query) {
    if (!query) return true;
    if (text(game).includes(query)) return true;
    return game.title.split(/\s+/).some(word => editDistance(word, query) <= 1) || editDistance(game.title, query) <= 2;
  }

  function filtered() {
    let list = state.games.filter(game =>
      !state.hidden.has(game.title) &&
      queryMatch(game, state.q) &&
      (!state.platform || game.platforms.includes(state.platform)) &&
      (!state.setup || game.setup.toLowerCase() === state.setup.toLowerCase()) &&
      [...state.tags].every(tag => text(game).includes(tag))
    );
    if (!state.showAll && !state.q && !state.platform && !state.setup && !state.tags.size) {
      list = list.filter(hasRealArt);
    }
    return list.sort((a, b) =>
      Number(state.favorites.has(b.title)) - Number(state.favorites.has(a.title)) ||
      Number(hasRealArt(b)) - Number(hasRealArt(a)) ||
      a.title.localeCompare(b.title)
    );
  }

  function persistArtwork() {
    save('eb-working-artwork', workingArt);
  }

  function markNoArt(img) {
    const card = img?.closest('.card');
    const art = img?.closest('.art,.modalArt');
    if (card) card.classList.add('noRealArt', 'qaTextCard');
    art?.classList.add('imageUnavailable', 'usingFallback');
    if (img === els.modalImg) els.modal?.classList.add('noRealArtModal');
    if (img) img.hidden = true;
    art?.querySelector('.skeleton')?.remove();
  }

  function markRealArt(img) {
    const card = img?.closest('.card');
    const art = img?.closest('.art,.modalArt');
    if (card) card.classList.remove('noRealArt', 'qaTextCard');
    art?.classList.remove('imageUnavailable', 'usingFallback');
    if (img === els.modalImg) els.modal?.classList.remove('noRealArtModal');
    if (img) img.hidden = false;
    art?.querySelector('.skeleton')?.remove();
  }

  function nextArtwork(img, id, reason = 'error') {
    const game = state.games[Number(id)];
    if (!game || !img) return;
    const current = img.currentSrc || img.src;
    if (current && current !== FALLBACK && !BAD_ART.test(current)) failedUrls.add(current);

    let index = Number(img.dataset.artIndex || 0) + 1;
    while (index < game.artCandidates.length && failedUrls.has(game.artCandidates[index])) index++;
    const next = game.artCandidates[index];

    if (!next || next === FALLBACK || BAD_ART.test(next)) {
      markNoArt(img);
      persistArtwork();
      log('artwork_exhausted', { title:game.title, reason });
      return;
    }

    img.dataset.artIndex = String(index);
    img.hidden = false;
    img.src = next;
    log('image_candidate_failed', { title:game.title, reason });
  }

  function artworkLoaded(img, id) {
    const game = state.games[Number(id)];
    if (!game || !img) return;
    const src = img.currentSrc || img.src;
    if (!src || src === FALLBACK || BAD_ART.test(src)) {
      markNoArt(img);
      return;
    }
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const ratio = height ? width / height : 0;
    if (width < 300 || height < 150 || ratio < 1.05 || ratio > 3.4) {
      nextArtwork(img, id, 'invalid_dimensions');
      return;
    }
    markRealArt(img);
    workingArt[game.title] = src;
    persistArtwork();
  }

  window.ebImgError = (img, id) => nextArtwork(img, id, 'load_error');
  window.ebImgLoaded = artworkLoaded;

  function toggleFavorite(title) {
    state.favorites.has(title) ? state.favorites.delete(title) : state.favorites.add(title);
    save('eb-favorites', [...state.favorites]);
    renderAll();
    const modalButton = $('#favoriteModal');
    if (modalButton) modalButton.textContent = state.favorites.has(title) ? 'Remove Favorite' : 'Save This';
    toast(state.favorites.has(title) ? 'Saved to favorites' : 'Removed from favorites');
  }

  function firstArt(game) {
    return game.artCandidates.find(url => !failedUrls.has(url)) || FALLBACK;
  }

  function card(game, eager = false) {
    const first = firstArt(game);
    const favorite = state.favorites.has(game.title);
    const noArt = !hasRealArt(game);
    return `<article class="card ${noArt ? 'noRealArt qaTextCard' : ''}" tabindex="0" data-id="${game.id}" aria-label="View ${attr(game.title)}">
      <div class="art">
        <div class="skeleton"></div>
        <img src="${attr(first)}" data-art-index="${Math.max(0, game.artCandidates.indexOf(first))}" alt="${attr(game.title)} game artwork" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onload="ebImgLoaded(this,${game.id})" onerror="ebImgError(this,${game.id})">
        <button class="favoriteBtn ${favorite ? 'active' : ''}" type="button" data-favorite="${attr(game.title)}" aria-label="${favorite ? 'Remove from' : 'Add to'} favorites">${favorite ? '★' : '☆'}</button>
        <div class="badges"><span class="badge ${game.setup.toLowerCase().includes('no') ? 'easy' : ''}">${esc(game.setup)}</span><span class="badge">${esc(game.platforms[0] || 'Game')}</span></div>
        <div class="posterTitle"><h3>${esc(game.title)}</h3><p>${esc(game.genre)} · ${esc(game.players)}</p></div>
      </div>
      <div class="body"><span>${esc(game.mode)}</span><button class="detailsBtn" type="button">Details</button></div>
    </article>`;
  }

  function wire(container) {
    container?.querySelectorAll('[data-favorite]').forEach(button => {
      button.onclick = event => {
        event.stopPropagation();
        toggleFavorite(button.dataset.favorite);
      };
    });
    container?.querySelectorAll('.card').forEach(item => {
      item.onclick = event => {
        if (event.target.closest('[data-favorite]')) return;
        openGame(state.games[Number(item.dataset.id)]);
      };
      item.onkeydown = event => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button')) {
          event.preventDefault();
          openGame(state.games[Number(item.dataset.id)]);
        }
      };
    });
  }

  function fillRail(element, items, eager = false) {
    if (!element) return;
    element.innerHTML = items.map((game, index) => card(game, eager && index < 4)).join('');
    wire(element);
  }

  function renderRails() {
    const visible = state.games.filter(game => !state.hidden.has(game.title));
    const withArt = visible.filter(hasRealArt);
    const used = new Set();
    const take = (source, predicate, limit = 12) => source
      .filter(game => predicate(game) && !used.has(game.title))
      .slice(0, limit)
      .map(game => { used.add(game.title); return game; });

    fillRail(els.featured, take(withArt, () => true, 14), true);
    fillRail(els.quick, take(visible, game => text(game).includes('browser') || game.setup === 'No download', 14));
    fillRail(els.friends, take(visible, game => /party|co-op/.test(text(game)) || /4|8|12|16|many|massive/i.test(game.players), 14));

    const favorites = visible.filter(game => state.favorites.has(game.title));
    if (els.favoritesSection) els.favoritesSection.hidden = !favorites.length;
    fillRail(els.favorites, favorites);

    const recent = state.recent.map(title => visible.find(game => game.title === title)).filter(Boolean).slice(0, 12);
    if (els.recentSection) els.recentSection.hidden = !recent.length;
    fillRail(els.recent, recent);
  }

  function renderActiveFilters() {
    if (!els.activeFilters) return;
    const items = [];
    if (state.q) items.push(['q', `Search: ${state.q}`]);
    if (state.platform) items.push(['platform', state.platform]);
    if (state.setup) items.push(['setup', state.setup]);
    state.tags.forEach(tag => items.push([`tag:${tag}`, tag.replace(/\b\w/g, char => char.toUpperCase())]));
    els.activeFilters.innerHTML = items.map(([key, label]) => `<button class="activeFilter" data-remove="${attr(key)}" type="button">${esc(label)} ×</button>`).join('');
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
    const list = filtered();
    if (els.grid) els.grid.innerHTML = list.map(game => card(game)).join('');
    if (els.count) els.count.textContent = `${list.length} game${list.length === 1 ? '' : 's'}`;
    setStatus(list.length ? '' : 'empty');
    wire(els.grid);
    renderActiveFilters();
    updateUrl();
    track('results_rendered', { count:list.length });
  }

  function renderAll() {
    renderRails();
    render();
  }

  function setupFilters() {
    const platforms = [...new Set(state.games.flatMap(game => game.platforms))].sort();
    if (els.platform) els.platform.innerHTML = '<option value="">Any platform</option>' + platforms.map(platform => `<option>${esc(platform)}</option>`).join('');
    if (els.randomPlatform) els.randomPlatform.innerHTML = '<option value="">Any</option>' + platforms.map(platform => `<option>${esc(platform)}</option>`).join('');
    const chips = ['browser','no download','party','co-op','shooter','mobile','racing','local','strategy'];
    if (els.chips) els.chips.innerHTML = chips.map(chip => `<button class="chip" type="button" data-chip="${attr(chip)}">${esc(chip.replace(/\b\w/g, char => char.toUpperCase()))}</button>`).join('');
    els.chips?.querySelectorAll('[data-chip]').forEach(button => {
      button.onclick = () => {
        const chip = button.dataset.chip;
        state.tags.has(chip) ? state.tags.delete(chip) : state.tags.add(chip);
        render();
      };
    });
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

  function saveReport(game) {
    const reason = window.prompt('What is wrong? Example: broken link, wrong platform, no longer free, or bad image.');
    if (reason === null) return;
    const reports = safeRead('eb-reports', []);
    reports.push({ title:game.title, reason:String(reason).trim() || 'No details provided', url:game.url, at:new Date().toISOString(), page:location.href });
    save('eb-reports', reports.slice(-150));
    toast('Thanks. Your report was saved.');
  }

  function closeModal() {
    els.modal?.classList.remove('open', 'noRealArtModal');
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname + location.search);
  }

  function openGame(game, randomMeta = null) {
    if (!game || !els.modal || !els.modalInner) return;
    state.recent = [game.title, ...state.recent.filter(title => title !== game.title)].slice(0, 20);
    save('eb-recent', state.recent);

    const first = firstArt(game);
    if (els.modalImg) {
      els.modalImg.hidden = false;
      els.modalImg.src = first;
      els.modalImg.dataset.artIndex = String(Math.max(0, game.artCandidates.indexOf(first)));
      els.modalImg.alt = `${game.title} artwork`;
      els.modalImg.onload = () => artworkLoaded(els.modalImg, game.id);
      els.modalImg.onerror = () => nextArtwork(els.modalImg, game.id, 'modal_error');
    }
    els.modal.classList.toggle('noRealArtModal', !hasRealArt(game));

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
      save('eb-played', [...state.played]);
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
    if (prefs.style) pool = pool.filter(game => text(game).includes(prefs.style) || (prefs.style === 'competitive' && /shooter|battle|pvp|racing|sports/.test(text(game))));
    if (mode === 'safe') pool = pool.filter(game => game.setup === 'No download' || /party|co-op|casual|browser/.test(text(game)));
    if (mode === 'deep') pool = pool.filter(game => !state.favorites.has(game.title) && !state.recent.includes(game.title)).reverse();
    if (mode === 'twenty') pool = pool.filter(game => game.setup === 'No download' || /quick|party|browser|round/.test(text(game)));
    if (mode === 'night') pool = pool.filter(game => /mmo|rpg|strategy|survival|progression|co-op/.test(text(game)));
    return pool;
  }

  function pickRandom(mode = state.randomMode, keepOpen = false) {
    const pool = randomPool(mode);
    const fallback = state.games.filter(game => !state.hidden.has(game.title) && game.title !== state.lastRandom);
    const source = pool.length ? pool : fallback;
    if (!source.length) { toast('No matching games. Try resetting the randomizer.'); return; }
    const game = source[Math.floor(Math.random() * source.length)];
    state.lastRandom = game.title;
    save('eb-last-random', state.lastRandom);
    if (els.saveRandomPrefs?.checked) {
      state.randomPrefs = {
        players:els.randomPlayers.value, platform:els.randomPlatform.value,
        setup:els.randomSetup.value, style:els.randomStyle.value, mode
      };
      save('eb-random-prefs', state.randomPrefs);
    }
    if (!keepOpen) closeRandomizer();
    const labels = { safe:'Easy Pick', chaos:'Anything Goes', deep:'Hidden Gem', twenty:'Quick Round', night:'Longer Session' };
    openGame(game, { mode, label:labels[mode] || 'Eddie Chose' });
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
    if (els.saveRandomPrefs) els.saveRandomPrefs.checked = Boolean(safeRead('eb-random-prefs', null));
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
    localStorage.removeItem('eb-random-prefs');
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

  async function initCatalog() {
    setStatus('loading');
    if (els.total) els.total.textContent = '—';
    try {
      state.games = await loadCatalog();
      if (els.total) els.total.textContent = state.games.length;
      setupFilters();
      loadUrlState();
      if (els.platform) els.platform.value = state.platform;
      if (els.setup) els.setup.value = state.setup;
      renderAll();
      track('catalog_ready', { count:state.games.length, source:state.catalogSource });
      const hash = new URLSearchParams(location.hash.replace(/^#/, '')).get('game');
      if (hash) {
        const game = state.games.find(item => item.title.toLowerCase() === hash.toLowerCase());
        if (game) openGame(game);
      }
    } catch (error) {
      log('catalog_unavailable', { message:String(error) });
      if (els.total) els.total.textContent = '—';
      setStatus('unavailable');
    }
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
      log('brand_image_failed');
    };
  }

  initEvents();
  initCatalog();
})();
