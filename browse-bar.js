(() => {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
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
    searchButton.setAttribute('aria-controls', 'search');
    searchButton.setAttribute('aria-expanded', 'false');
    searchButton.textContent = 'Search';

    tools.appendChild(searchButton);
    tools.appendChild(filter);
    vibe.appendChild(tools);

    function hasQuery() {
      return Boolean(String(search.value || '').trim());
    }

    function setSearchOpen(open) {
      document.body.classList.toggle('search-open', Boolean(open));
      searchButton.setAttribute('aria-expanded', String(Boolean(open)));
      if (open) requestAnimationFrame(() => search.focus({ preventScroll: true }));
    }

    searchButton.addEventListener('click', () => {
      setSearchOpen(!document.body.classList.contains('search-open'));
    });

    search.addEventListener('input', () => {
      if (hasQuery()) document.body.classList.add('search-open');
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.body.classList.contains('search-open') && !hasQuery()) {
        setSearchOpen(false);
        searchButton.focus({ preventScroll: true });
      }
    });

    const params = new URLSearchParams(location.search);
    if (params.get('q') || hasQuery()) setSearchOpen(true);
  });
})();
