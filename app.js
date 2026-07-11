(() => {
  'use strict';

  const FALLBACK_COVER = 'https://www.dropbox.com/scl/fi/p7jsg38fzmdnqbeayd6b9/Cover.png?rlkey=e8ngjkrda569sy9fwqs0nl4sg&st=43zxzx1l&raw=1';
  const MAX_RETRIES = 2;
  const state = { games: [], q: '', platform: '', setup: '', tags: new Set(), showAll: false };
  const failedUrls = new Set(JSON.parse(localStorage.getItem('eb-failed-artwork') || '[]'));
  const workingArt = JSON.parse(localStorage.getItem('eb-working-artwork') || '{}');
  const $ = (s) => document.querySelector(s);
  const els = {
    search: $('#search'), platform: $('#platform'), setup: $('#setup'), clear: $('#clearBtn'), more: $('#moreBtn'),
    chips: $('#chips'), grid: $('#gamesGrid'), featured: $('#featuredRail'), quick: $('#quickRail'), count: $('#count'),
    status: $('#catalogStatus'), modal: $('#modal'), modalImg: $('#modalImg'), modalInner: $('#modalInner'),
    random: $('#randomBtn'), total: $('#allCount'), brand: $('#brandImg'), brandText: $('#brandText')
  };

  function esc(v) { return String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
  function attr(v) { return esc(v).replace(/`/g, '&#96;'); }
  function safeRead(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
  function log(type, detail = {}) {
    const logs = safeRead('eb-error-log', []);
    logs.push({ type, detail, at: new Date().toISOString(), ua: navigator.userAgent });
    try { localStorage.setItem('eb-error-log', JSON.stringify(logs.slice(-80))); } catch {}
  }
  window.addEventListener('error', e => log('window_error', { message: e.message, source: e.filename, line: e.lineno }));
  window.addEventListener('unhandledrejection', e => log('promise_rejection', { message: String(e.reason) }));

  function normalizePlatform(value) {
    const map = { playstation:'PlayStation', ps:'PlayStation', xbox:'Xbox', pc:'PC', mobile:'Mobile', android:'Mobile', ios:'Mobile', browser:'Browser', switch:'Switch', console:'Console', vr:'VR', mac:'Mac', linux:'Linux' };
    return map[String(value || '').toLowerCase()] || String(value || '').trim();
  }
  function validPlayers(value) { const v = String(value || '').trim(); return v && v.length <= 24 ? v : 'Varies'; }
  function parseRaw(raw) {
    return String(raw || '').split('|').filter(Boolean).map((row, id) => {
      const [title, genre, platforms, mode, setup, players, tags] = row.split('~');
      return { id, title:String(title||'').trim(), genre:String(genre||'Game').trim(), platforms:[...new Set(String(platforms||'').split(/\s+/).filter(Boolean).map(normalizePlatform))], mode:String(mode||'Multiplayer').trim(), setup:String(setup||'Check').trim(), players:validPlayers(players), tags:String(tags||'').toLowerCase().split(/\s+/).filter(Boolean) };
    });
  }
  function normalizeObjectGames(items) {
    return (items || []).map((g, id) => ({ id, title:String(g.title||'').trim(), genre:String(g.genre||'Game').trim(), platforms:[...new Set((g.platforms||[]).map(normalizePlatform).filter(Boolean))], mode:String(g.mode||'Multiplayer').trim(), setup:String(g.setup||'Check').trim(), players:validPlayers(g.players), tags:(g.tags||[]).map(t=>String(t).toLowerCase()) }));
  }
  function dedupe(items) {
    const seen = new Set();
    return items.filter(g => { const key=g.title.toLowerCase().replace(/[^a-z0-9]/g,''); if(!key||seen.has(key)) return false; seen.add(key); return true; });
  }
  function steamMirrors(url) {
    const match = String(url || '').match(/steam(?:static)?\.com\/steam\/apps\/(\d+)\/header\.jpg|steam\/apps\/(\d+)\/header\.jpg/);
    const id = match && (match[1] || match[2]);
    return id ? [
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`,
      `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
      `https://steamcdn-a.akamaihd.net/steam/apps/${id}/header.jpg`
    ] : [];
  }
  function uniqueUrls(values) { return [...new Set(values.flat().filter(Boolean).map(String))]; }
  function candidatesFor(game) {
    const previews = window.EDDIE_PREVIEWS || {};
    const artwork = window.EDDIE_ARTWORK || {};
    const urls = window.EDDIE_URLS || {};
    const primary = previews[game.title];
    const official = urls[game.title];
    const screenshot = official && !official.includes('google.com') ? `https://image.thum.io/get/width/960/crop/540/noanimate/${official}` : null;
    let candidates = uniqueUrls([
      workingArt[game.title],
      artwork[game.title] || [],
      primary,
      steamMirrors(primary),
      screenshot,
      FALLBACK_COVER
    ]).filter(url => url === FALLBACK_COVER || !failedUrls.has(url));
    if (!candidates.includes(FALLBACK_COVER)) candidates.push(FALLBACK_COVER);
    return candidates;
  }
  function enrich(items) {
    const urls = window.EDDIE_URLS || {};
    return dedupe(items).map((g,id) => {
      const artCandidates = candidatesFor(g);
      return { ...g, id, artCandidates, hasArt:artCandidates.some(u=>u!==FALLBACK_COVER), image:artCandidates[0] || FALLBACK_COVER, url:urls[g.title]||`https://www.google.com/search?q=${encodeURIComponent(g.title+' official game')}` };
    });
  }
  function retryScript(src, attempt) {
    return new Promise((resolve,reject)=>{ const s=document.createElement('script'); s.src=`${src}?retry=${attempt}&t=${Date.now()}`; s.onload=resolve; s.onerror=reject; document.head.appendChild(s); });
  }
  async function ensureArtworkData() {
    if (window.EDDIE_ARTWORK) return;
    try { await retryScript('artwork-data.js', 1); } catch (err) { log('artwork_data_unavailable', { message:String(err) }); }
  }
  async function loadCatalog() {
    setStatus('loading');
    await ensureArtworkData();
    for(let attempt=0;attempt<=MAX_RETRIES;attempt++){
      if(window.EDDIE_RAW) return enrich(parseRaw(window.EDDIE_RAW));
      if(attempt<MAX_RETRIES){ try{ await retryScript('vault-data.js',attempt+1); await new Promise(r=>setTimeout(r,300)); }catch(err){ log('catalog_retry_failed',{attempt:attempt+1,message:String(err)}); } }
    }
    if(Array.isArray(window.EDDIE_FALLBACK)&&window.EDDIE_FALLBACK.length){ log('catalog_fallback_used',{count:window.EDDIE_FALLBACK.length}); return enrich(normalizeObjectGames(window.EDDIE_FALLBACK)); }
    throw new Error('Catalog unavailable');
  }
  function setStatus(type){
    const messages={
      loading:'<div class="stateCard"><div class="spinner"></div><strong>Loading games…</strong></div>',
      unavailable:'<div class="stateCard"><strong>Games could not be loaded.</strong><button id="retryBtn" type="button">Try again</button></div>',
      empty:'<div class="stateCard"><strong>No matches.</strong><span>Try another search or clear your filters.</span></div>'
    };
    els.status.innerHTML=messages[type]||''; els.status.hidden=!messages[type];
    if(type==='unavailable') $('#retryBtn')?.addEventListener('click',initCatalog);
  }
  function text(g){ return [g.title,g.genre,g.platforms.join(' '),g.mode,g.setup,g.players,g.tags.join(' ')].join(' ').toLowerCase(); }
  function usable(g){ return g.hasArt && g.artCandidates.some(u=>u!==FALLBACK_COVER&&!failedUrls.has(u)); }
  function filtered(){
    let list=state.games.filter(g=>{ const hay=text(g); return (!state.q||hay.includes(state.q))&&(!state.platform||g.platforms.includes(state.platform))&&(!state.setup||g.setup.toLowerCase()===state.setup.toLowerCase())&&[...state.tags].every(t=>hay.includes(t)); });
    if(!state.showAll&&!state.q&&!state.platform&&!state.setup&&!state.tags.size) list=list.filter(usable);
    return list.sort((a,b)=>Number(usable(b))-Number(usable(a))||a.title.localeCompare(b.title));
  }
  function persistArtworkState() {
    try {
      localStorage.setItem('eb-failed-artwork', JSON.stringify([...failedUrls].slice(-300)));
      localStorage.setItem('eb-working-artwork', JSON.stringify(workingArt));
    } catch {}
  }
  function nextArtwork(img, gameId, reason='error') {
    const g = state.games[Number(gameId)]; if(!g) return;
    const current = img.src;
    if(current && current !== FALLBACK_COVER) failedUrls.add(current);
    log('image_candidate_failed',{title:g.title,url:current,reason});
    let index = Number(img.dataset.artIndex || 0) + 1;
    while(index < g.artCandidates.length && failedUrls.has(g.artCandidates[index]) && g.artCandidates[index] !== FALLBACK_COVER) index++;
    if(index >= g.artCandidates.length){ img.closest('.art')?.classList.add('imageUnavailable'); img.remove(); persistArtworkState(); return; }
    img.dataset.artIndex=String(index);
    img.src=g.artCandidates[index];
    persistArtworkState();
  }
  function artworkLoaded(img, gameId) {
    const g=state.games[Number(gameId)]; if(!g)return;
    const w=img.naturalWidth,h=img.naturalHeight,ratio=h?w/h:0;
    if(w<300||h<150||ratio<1.15||ratio>2.8){ nextArtwork(img,gameId,'invalid_dimensions'); return; }
    img.previousElementSibling?.classList.contains('skeleton') && img.previousElementSibling.remove();
    if(img.src!==FALLBACK_COVER){ workingArt[g.title]=img.src; persistArtworkState(); }
  }
  window.ebImgError=(img,id)=>nextArtwork(img,id,'load_error');
  window.ebImgLoaded=artworkLoaded;
  function card(g,eager=false){
    const first=g.artCandidates[0]||FALLBACK_COVER;
    return `<article class="card" tabindex="0" data-id="${g.id}" aria-label="View ${attr(g.title)}"><div class="art"><div class="skeleton"></div><img src="${attr(first)}" data-art-index="0" alt="${attr(g.title)}" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async" onload="ebImgLoaded(this,${g.id})" onerror="ebImgError(this,${g.id})"><div class="badges"><span class="badge ${g.setup.toLowerCase().includes('no')?'easy':''}">${esc(g.setup)}</span><span class="badge">${esc(g.platforms[0]||'Game')}</span></div><div class="posterTitle"><h3>${esc(g.title)}</h3><p>${esc(g.genre)} · ${esc(g.players)}</p></div></div><div class="body"><span>${esc(g.mode)}</span><button class="detailsBtn" type="button">Details</button></div></article>`;
  }
  function wire(container){ container.querySelectorAll('.card').forEach(c=>{ c.addEventListener('click',()=>openGame(state.games[Number(c.dataset.id)])); c.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openGame(state.games[Number(c.dataset.id)]); } }); }); }
  function preload(items){ items.slice(0,4).forEach(g=>{ const img=new Image(); img.src=g.artCandidates[0]||FALLBACK_COVER; }); }
  function renderRails(){
    const art=state.games.filter(usable), featured=art.slice(0,14), used=new Set(featured.map(g=>g.title));
    const quick=art.filter(g=>(text(g).includes('browser')||g.setup.toLowerCase().includes('no download'))&&!used.has(g.title)).slice(0,14);
    preload(featured); els.featured.innerHTML=featured.map((g,i)=>card(g,i<4)).join(''); els.quick.innerHTML=quick.map(card).join(''); wire(els.featured); wire(els.quick);
  }
  function render(){
    els.chips.querySelectorAll('[data-chip]').forEach(b=>b.classList.toggle('active',state.tags.has(b.dataset.chip)));
    els.more.classList.toggle('active',state.showAll); els.more.textContent=state.showAll?'Top picks only':'More games';
    const list=filtered(); els.grid.innerHTML=list.map(card).join(''); els.count.textContent=`${list.length} game${list.length===1?'':'s'}`; setStatus(list.length?'':'empty'); wire(els.grid);
  }
  function setupFilters(){
    const platforms=[...new Set(state.games.flatMap(g=>g.platforms))].sort(); els.platform.innerHTML='<option value="">Any platform</option>'+platforms.map(p=>`<option>${esc(p)}</option>`).join('');
    const chips=['browser','no download','party','co-op','shooter','mobile','racing','local','strategy']; els.chips.innerHTML=chips.map(c=>`<button class="chip" type="button" data-chip="${attr(c)}">${esc(c.replace(/\b\w/g,m=>m.toUpperCase()))}</button>`).join('');
    els.chips.querySelectorAll('[data-chip]').forEach(b=>b.addEventListener('click',()=>{ const c=b.dataset.chip; state.tags.has(c)?state.tags.delete(c):state.tags.add(c); render(); }));
  }
  function saveReport(g){ const reports=safeRead('eb-reports',[]); reports.push({title:g.title,at:new Date().toISOString()}); try{localStorage.setItem('eb-reports',JSON.stringify(reports.slice(-100)));}catch{} alert('Thanks. We saved your report.'); }
  function openGame(g){
    if(!g)return; const first=g.artCandidates.find(u=>!failedUrls.has(u))||FALLBACK_COVER; els.modalImg.src=first; els.modalImg.dataset.artIndex=String(Math.max(0,g.artCandidates.indexOf(first))); els.modalImg.alt=g.title; els.modalImg.onload=()=>artworkLoaded(els.modalImg,g.id); els.modalImg.onerror=()=>nextArtwork(els.modalImg,g.id,'modal_error');
    els.modalInner.innerHTML=`<div class="modalHead"><div><h2>${esc(g.title)}</h2><p>${esc(g.genre)} · ${esc(g.platforms.join(', '))}</p></div><button class="close" id="closeModal" type="button">Close</button></div><div class="facts"><div><b>${esc(g.players)}</b><span>Players</span></div><div><b>${esc(g.setup)}</b><span>Setup</span></div><div><b>${esc(g.mode)}</b><span>Mode</span></div><div><b>${esc(g.platforms.join(', '))}</b><span>Platforms</span></div></div><div class="actions"><a class="action play" href="${attr(g.url)}" target="_blank" rel="noopener">Visit Game</a><button class="action" id="reportBtn" type="button">Report a problem</button></div>`;
    els.modal.classList.add('open'); history.replaceState(null,'',`#game=${encodeURIComponent(g.title)}`); $('#closeModal').addEventListener('click',closeModal); $('#reportBtn').addEventListener('click',()=>saveReport(g));
  }
  function closeModal(){ els.modal.classList.remove('open'); history.replaceState(null,'',location.pathname+location.search); }
  function randomGame(){ const pool=filtered().filter(usable), source=pool.length?pool:state.games.filter(usable); if(source.length)openGame(source[Math.floor(Math.random()*source.length)]); }
  async function initCatalog(){
    try{ state.games=await loadCatalog(); els.total.textContent=state.games.length; setupFilters(); renderRails(); render(); const hash=new URLSearchParams(location.hash.replace(/^#/,'')).get('game'); if(hash){ const g=state.games.find(x=>x.title.toLowerCase()===hash.toLowerCase()); if(g)openGame(g); } }
    catch(err){ log('catalog_unavailable',{message:String(err)}); setStatus('unavailable'); }
  }
  function initEvents(){
    els.search.addEventListener('input',e=>{state.q=e.target.value.trim().toLowerCase();render();}); els.platform.addEventListener('change',e=>{state.platform=e.target.value;render();}); els.setup.addEventListener('change',e=>{state.setup=e.target.value;render();});
    els.clear.addEventListener('click',()=>{state.q='';state.platform='';state.setup='';state.tags.clear();els.search.value='';els.platform.value='';els.setup.value='';render();}); els.more.addEventListener('click',()=>{state.showAll=!state.showAll;render();}); els.random.addEventListener('click',randomGame);
    els.modal.addEventListener('click',e=>{if(e.target===els.modal)closeModal();}); document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();}); els.brand.addEventListener('error',()=>{els.brand.style.display='none';els.brandText.style.display='block';});
  }
  initEvents(); initCatalog();
})();