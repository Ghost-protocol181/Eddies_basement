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
    const vibe = document.querySelector('.vibeRow');
    const controls = document.querySelector('.commandControls');
    const search = document.getElementById('search');
    const filter = document.querySelector('.filterDrawer');
    if (!dock || !vibe || !controls || !search || !filter || dock.dataset.browseBar === 'ready') return;

    dock.dataset.browseBar = 'ready';
    document.body.classList.add('browse-enhanced');

    const tools = document.createElement('div');
    tools.className = 'browseTools';

    const searchButton = document.createElement('button');
    searchButton.className = 'browseSearchToggle';
    searchButton.type = 'button';
    searchButton.setAttribute('aria-controls', 'searchCommand');
    searchButton.setAttribute('aria-expanded', 'false');
    searchButton.innerHTML = '<span aria-hidden="true">⌕</span> Search';

    tools.appendChild(searchButton);
    tools.appendChild(filter);
    vibe.appendChild(tools);

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
      button.addEventListener('click', () => {
        search.value = query;
        dispatchInput(search);
        closeSearch();
        scrollToGames();
      });
      shortcuts.appendChild(button);
    });

    sheet.appendChild(head);
    sheet.appendChild(controls);
    sheet.appendChild(shortcuts);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    function hasQuery() {
      return Boolean(String(search.value || '').trim());
    }

    function openSearch() {
      overlay.hidden = false;
      document.body.classList.add('search-open');
      searchButton.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => search.focus({ preventScroll: true }));
    }

    function closeSearch() {
      overlay.hidden = true;
      document.body.classList.remove('search-open');
      searchButton.setAttribute('aria-expanded', 'false');
    }

    searchButton.addEventListener('click', openSearch);
    close.addEventListener('click', closeSearch);
    overlay.addEventListener('click', event => {
      if (event.target === overlay) closeSearch();
    });

    search.addEventListener('input', () => {
      if (hasQuery()) searchButton.classList.add('hasQuery');
      else searchButton.classList.remove('hasQuery');
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
    if (params.get('q') || hasQuery()) searchButton.classList.add('hasQuery');
  });
})();
