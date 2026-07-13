(() => {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function fire(el, type) {
    if (el) el.dispatchEvent(new Event(type, { bubbles: true }));
  }

  function clearAll() {
    const search = document.getElementById('search');
    const platform = document.getElementById('platform');
    const setup = document.getElementById('setup');

    if (search) {
      search.value = '';
      fire(search, 'input');
    }
    if (platform) {
      platform.value = '';
      fire(platform, 'change');
    }
    if (setup) {
      setup.value = '';
      fire(setup, 'change');
    }

    document.getElementById('clearBtn')?.click();
    history.replaceState(null, '', `${location.pathname}#top`);
    document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function addRecoveryButton() {
    const status = document.getElementById('catalogStatus');
    const grid = document.getElementById('gamesGrid');
    if (!status || !grid) return;
    if (grid.querySelector('.card')) return;
    if (status.querySelector('[data-clear-all]')) return;

    const loading = /getting the games ready/i.test(status.textContent || '');
    if (loading) return;

    status.hidden = false;
    const card = status.querySelector('.stateCard') || status.appendChild(document.createElement('div'));
    card.className = 'stateCard';
    if (!card.querySelector('strong')) {
      card.innerHTML = '<strong>No games are showing.</strong><span>Clear the search and reload the full list.</span>';
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.clearAll = 'true';
    button.textContent = 'Show all games';
    button.className = 'clearBtn';
    button.style.marginTop = '12px';
    button.addEventListener('click', clearAll);
    card.appendChild(button);
  }

  ready(() => {
    document.addEventListener('click', event => {
      if (event.target.closest('[data-clear-all]')) clearAll();
    });

    setTimeout(addRecoveryButton, 1800);
    setTimeout(addRecoveryButton, 3600);

    const grid = document.getElementById('gamesGrid');
    if (grid) {
      new MutationObserver(() => {
        if (grid.querySelector('.card')) {
          const status = document.getElementById('catalogStatus');
          const recovery = status?.querySelector('[data-clear-all]');
          recovery?.remove();
        }
      }).observe(grid, { childList: true, subtree: true });
    }
  });
})();