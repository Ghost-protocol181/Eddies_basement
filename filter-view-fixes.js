(() => {
  'use strict';

  // When a user filters/searches, generic homepage rails should not pretend
  // they are filtered results. Keep the page focused on the actual grid.
  const GENERIC_RAIL_HEADINGS = new Set([
    'Best Picks',
    'Recommended',
    'Play Right Now',
    'Best with Friends',
    'Easy Online Games',
    'Everyone Uses a Phone',
    'Board, Card & Word Games',
    'Four or More Players',
    'Two-Player Picks'
  ]);

  function hasActiveFilter() {
    const params = new URLSearchParams(location.search);
    return Boolean(
      params.get('q') ||
      params.get('platform') ||
      params.get('setup') ||
      params.get('tags') ||
      document.querySelector('#activeFilters .activeFilter')
    );
  }

  function sectionTitle(section) {
    return section?.querySelector('.sectionHead h2')?.textContent?.trim() || '';
  }

  function isGenericRail(section) {
    return section?.classList.contains('libraryExpansion') || GENERIC_RAIL_HEADINGS.has(sectionTitle(section));
  }

  function apply() {
    const filtered = hasActiveFilter();

    document.querySelectorAll('main > section.section.wrap').forEach(section => {
      if (isGenericRail(section)) {
        section.hidden = filtered;
        section.dataset.hiddenWhenFiltered = filtered ? 'true' : 'false';
      }
    });

    const games = document.getElementById('games');
    const gamesTitle = games?.querySelector('.sectionHead h2');
    const gamesSub = games?.querySelector('.sectionHead p');
    if (gamesTitle) gamesTitle.textContent = filtered ? 'Results' : 'All Games';
    if (gamesSub) gamesSub.textContent = filtered ? 'Games matching your search and filters.' : 'Tap a cover for setup, players, and links.';

    document.body.classList.toggle('is-filtered-view', filtered);
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }

  const originalReplace = history.replaceState;
  history.replaceState = function(...args) {
    const result = originalReplace.apply(this, args);
    schedule();
    return result;
  };

  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('load', schedule);
  document.addEventListener('input', schedule, true);
  document.addEventListener('change', schedule, true);
  document.addEventListener('click', event => {
    if (event.target.closest('.chip,.activeFilter,#clearBtn,#moreBtn')) schedule();
  }, true);

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class','hidden']
  });

  schedule();
})();