(() => {
'use strict';

const FALLBACK = 'https://www.dropbox.com/scl/fi/p7jsg38fzmdnqbeayd6b9/Cover.png?rlkey=e8ngjkrda569sy9fwqs0nl4sg&st=43zxzx1l&raw=1';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const attr = value => esc(value).replace(/`/g, '&#96;');
const normalize = value => String(value || '').toLowerCase();

function parseCatalog(){
  const blocked = new Set((window.EDDIE_BLOCKED_TITLES || []).map(v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g,'')));
  const rows = String(window.EDDIE_RAW || '').split('|').filter(Boolean);
  return rows.map((row, id) => {
    const [title, genre, platforms, mode, setup, players, tags] = row.split('~');
    return {
      id,
      title: String(title || '').trim(),
      genre: String(genre || 'Game').trim(),
      platforms: String(platforms || '').split(/\s+/).filter(Boolean),
      mode: String(mode || 'Multiplayer').trim(),
      setup: String(setup || 'Check').trim(),
      players: String(players || 'Varies').trim(),
      tags: String(tags || '').split(/\s+/).filter(Boolean)
    };
  }).filter(game => game.title && !blocked.has(game.title.toLowerCase().replace(/[^a-z0-9]/g,'')));
}

function haystack(game){
  return normalize([game.title, game.genre, game.platforms.join(' '), game.mode, game.setup, game.players, game.tags.join(' ')].join(' '));
}

function imageFor(game){
  const previews = window.EDDIE_PREVIEWS || {};
  const art = window.EDDIE_ARTWORK || {};
  const options = [art[game.title], previews[game.title]].flat().filter(Boolean);
  return options[0] || FALLBACK;
}

function urlFor(game){
  const urls = window.EDDIE_URLS || {};
  return urls[game.title] || `https://www.google.com/search?q=${encodeURIComponent(game.title + ' official game')}`;
}

function card(game){
  const img = imageFor(game);
  const url = urlFor(game);
  const easy = normalize(game.setup).includes('no');
  return `<a class="card libraryCard" href="${attr(url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${attr(game.title)}">
    <div class="art">
      <div class="skeleton"></div>
      <img src="${attr(img)}" alt="${attr(game.title)} game artwork" loading="lazy" decoding="async" onload="this.previousElementSibling?.remove()" onerror="this.onerror=null;this.src='${attr(FALLBACK)}';this.closest('.art')?.classList.add('usingFallback')">
      <div class="badges"><span class="badge ${easy ? 'easy' : ''}">${esc(game.setup)}</span><span class="badge">${esc(game.platforms[0] || 'Game')}</span></div>
      <div class="posterTitle"><h3>${esc(game.title)}</h3><p>${esc(game.genre)} · ${esc(game.players)}</p></div>
    </div>
    <div class="body"><span>${esc(game.mode)}</span></div>
  </a>`;
}

function section(def, games){
  const items = games.filter(def.test).slice(0, def.limit || 12);
  if (!items.length) return '';
  return `<section class="section wrap libraryExpansion" id="${attr(def.id)}">
    <div class="sectionHead"><div><h2>${esc(def.title)}</h2><p>${esc(def.copy)}</p></div></div>
    <div class="rail">${items.map(card).join('')}</div>
  </section>`;
}

function addSearchChip(label, query){
  const chips = document.getElementById('chips');
  const search = document.getElementById('search');
  if (!chips || !search || chips.querySelector(`[data-extra-chip="${query}"]`)) return;
  const button = document.createElement('button');
  button.className = 'chip libraryChip';
  button.type = 'button';
  button.dataset.extraChip = query;
  button.textContent = label;
  button.addEventListener('click', () => {
    search.value = query;
    search.dispatchEvent(new Event('input', { bubbles: true }));
    search.focus({ preventScroll: true });
  });
  chips.appendChild(button);
}

function render(){
  const games = parseCatalog();
  if (!games.length) return;
  const used = new Set();
  const take = predicate => game => {
    if (used.has(game.title) || !predicate(game)) return false;
    used.add(game.title);
    return true;
  };
  const defs = [
    { id:'easy-online', title:'Easy Online Games', copy:'Fast, low-friction games for a group to try without homework.', test:take(g => /browser|no download|party|quick/.test(haystack(g))), limit:12 },
    { id:'phone-party', title:'Everyone Uses a Phone', copy:'Good for couches, family rooms, and group chats.', test:take(g => /mobile|phone|airconsole|gartic|stumble|spaceteam|bombparty/.test(haystack(g))), limit:12 },
    { id:'board-card', title:'Board, Card & Word Games', copy:'Table-style games when the group wants something simple.', test:take(g => /board|card|chess|word|drawing|codenames|colonist|playingcards|puzzle|skribb|gartic/.test(haystack(g))), limit:12 },
    { id:'four-plus', title:'Four or More Players', copy:'Better when more people are jumping in.', test:take(g => /4|5|6|7|8|12|16|32|40|many|massive|team|squad|party/.test(normalize(g.players + ' ' + g.mode + ' ' + g.tags.join(' ')))), limit:12 },
    { id:'two-player', title:'Two-Player Picks', copy:'Quick head-to-head or two-person starts.', test:take(g => /1v1|2\+|2-/.test(normalize(g.players + ' ' + g.mode)) || /chess|card|puzzle|strategy/.test(haystack(g))), limit:12 }
  ];
  const html = defs.map(def => section(def, games)).join('');
  const gameShelf = document.getElementById('games');
  if (gameShelf && html && !document.querySelector('.libraryExpansion')) {
    gameShelf.insertAdjacentHTML('beforebegin', html);
  }
  [
    ['Board & Card', 'board'],
    ['Phone Party', 'mobile'],
    ['2 Player', '1v1'],
    ['4+', '4'],
    ['Quick', 'no download']
  ].forEach(([label, query]) => addSearchChip(label, query));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(render, 250));
} else {
  setTimeout(render, 250);
}
})();