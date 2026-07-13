(() => {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function dispatchInput(input) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function scrollToGames() {
    document.getElementById('games')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ready(() => {
    const dock = document.querySelector('.commandDock');
    const controls = document.querySelector('.commandControls');
    const search = document.getElementById('search');
    const filter = document.querySelector('.filterDrawer');
    const introCopy = document.querySelector('.introCopy');
    if (!dock || !controls || !search || !filter || !introCopy || dock.dataset.browseBar === 'ready') return;

    dock.dataset.browseBar = 'ready';
    document.body.classList.add('browse-enhanced', 'hero-action-mode');

    const overlay = document.createElement('div');
    overlay.className = 'searchCommand';
    overlay.id = 'searchCommand';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Search games');
    overlay.hidden = true;

    const sheet = document.createElement('div');
    sheet.className = 'searchCommandSheet';

    const head = document.createElement('div');
    head.className = 'searchCommandHead';
    head.innerHTML = '<div><b>Find a game</b><span>Search titles, genres, platforms, or setup.</span></div>';

    const close = document.createElement('button');
    close.className = 'searchCommandClose';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close search');
    close.textContent = '×';
    head.appendChild(close);

    const shortcuts = document.createElement('div');
    shortcuts.className = 'searchShortcuts';
    [
      ['Fortnite', 'fortnite'],
      ['Warzone', 'warzone'],
      ['No Download', 'no download'],
      ['Party', 'party'],
      ['2 Player', '1v1'],
      ['Browser', 'browser']
    ].forEach(([label, query]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => applyQuery(query));
      shortcuts.appendChild(button);
    });

    sheet.appendChild(head);
    sheet.appendChild(controls);
    sheet.appendChild(shortcuts);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    function openSearch() {
      overlay.hidden = false;
      document.body.classList.add('search-open');
      requestAnimationFrame(() => search.focus({ preventScroll: true }));
    }

    function closeSearch() {
      overlay.hidden = true;
      document.body.classList.remove('search-open');
    }

    function applyQuery(query) {
      search.value = query;
      dispatchInput(search);
      closeSearch();
      scrollToGames();
    }

    const actions = document.createElement('div');
    actions.className = 'heroActions';

    const primary = document.createElement('button');
    primary.type = 'button';
    primary.className = 'heroAction heroActionPrimary';
    primary.innerHTML = '<b>Find games</b><span>Search the library</span>';
    primary.addEventListener('click', openSearch);
    actions.appendChild(primary);

    [
      ['No download', 'browser starts', 'no download'],
      ['Party', 'group games', 'party'],
      ['2 players', 'head-to-head', '1v1'],
      ['Co-op', 'play together', 'co-op']
    ].forEach(([label, sub, query]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'heroAction';
      button.innerHTML = `<b>${label}</b><span>${sub}</span>`;
      button.addEventListener('click', () => applyQuery(query));
      actions.appendChild(button);
    });

    introCopy.appendChild(actions);

    close.addEventListener('click', closeSearch);
    overlay.addEventListener('click', event => {
      if (event.target === overlay) closeSearch();
    });

    search.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        closeSearch();
        scrollToGames();
      }
      if (event.key === 'Escape') closeSearch();
    });

    document.addEventListener('keydown', event => {
      const typing = /input|textarea|select/i.test(document.activeElement?.tagName || '');
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        openSearch();
      }
      if (event.key === 'Escape' && !overlay.hidden) closeSearch();
    });

    const params = new URLSearchParams(location.search);
    if (params.get('q')) search.value = params.get('q');
  });
})();