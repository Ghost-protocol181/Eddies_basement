(() => {
  'use strict';

  const MIN_REASONABLE_GRID = 24;
  const DIAG_KEY = 'eb-functionality-diagnostics';

  function safeRead(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }

  function safeWrite(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function log(type, detail = {}) {
    const rows = safeRead(DIAG_KEY, []);
    rows.push({ type, detail, at: new Date().toISOString(), url: location.href });
    safeWrite(DIAG_KEY, rows.slice(-80));
    try { window.EddieTrack?.(`qa_${type}`, detail); } catch {}
  }

  function fire(el, type) {
    if (!el) return;
    el.dispatchEvent(new Event(type, { bubbles: true }));
  }

  function cards() {
    return [...document.querySelectorAll('#gamesGrid .card')];
  }

  function visibleCards() {
    return cards().filter(card => card.offsetParent !== null);
  }

  function hasActiveSearchState() {
    const params = new URLSearchParams(location.search);
    return Boolean(params.get('q') || params.get('platform') || params.get('setup') || params.get('tags'));
  }

  function clearFilters() {
    const search = document.getElementById('search');
    const platform = document.getElementById('platform');
    const setup = document.getElementById('setup');
    if (search) { search.value = ''; fire(search, 'input'); }
    if (platform) { platform.value = ''; fire(platform, 'change'); }
    if (setup) { setup.value = ''; fire(setup, 'change'); }
    document.getElementById('clearBtn')?.click();
    history.replaceState(null, '', `${location.pathname}#top`);
  }

  function enableAllGamesWhenNeeded() {
    const gridCount = cards().length;
    const more = document.getElementById('moreBtn');
    const filtered = hasActiveSearchState();
    if (!filtered && more && !more.classList.contains('active') && gridCount > 0 && gridCount < MIN_REASONABLE_GRID) {
      more.click();
      log('enabled_all_games', { before: gridCount });
    }
  }

  function recoverEmptyGrid() {
    const grid = document.getElementById('gamesGrid');
    if (!grid) return;
    const gridCount = cards().length;
    if (gridCount > 0) return;

    const statusText = document.getElementById('catalogStatus')?.textContent || '';
    if (/getting the games ready/i.test(statusText)) return;

    if (hasActiveSearchState()) {
      clearFilters();
      log('cleared_stale_filters_for_empty_grid');
      return;
    }

    const more = document.getElementById('moreBtn');
    if (more && !more.classList.contains('active')) {
      more.click();
      log('clicked_all_games_for_empty_grid');
    }
  }

  function repairCardArtwork() {
    visibleCards().forEach(card => {
      const art = card.querySelector('.art');
      const img = art?.querySelector('img');
      if (!art) return;

      art.querySelector('.skeleton')?.remove();

      const hasUsableImage = img && !img.hidden && (img.currentSrc || img.getAttribute('src'));
      card.classList.toggle('qaTextCard', !hasUsableImage);
      art.classList.toggle('qaTextCard', !hasUsableImage);

      if (!hasUsableImage) {
        const title = card.querySelector('.posterTitle h3')?.textContent || 'Game';
        art.setAttribute('data-title', title);
      }
    });
  }

  function repairRandomizer() {
    const inline = document.querySelector('.heroActionSurprise');
    const hiddenTrigger = document.getElementById('randomBtn');
    const modal = document.getElementById('randomizer');
    if (!inline || inline.dataset.qaRandomReady === 'true') return;
    inline.dataset.qaRandomReady = 'true';
    inline.addEventListener('click', () => {
      setTimeout(() => {
        const opened = modal && modal.hidden === false;
        if (!opened && hiddenTrigger) hiddenTrigger.click();
        if (!opened && modal) {
          modal.hidden = false;
          document.body.style.overflow = 'hidden';
        }
      }, 30);
    });
  }

  function repairSearchOverlay() {
    const find = document.querySelector('.heroActionFind');
    const overlay = document.getElementById('searchCommand');
    if (!find || !overlay || find.dataset.qaFindReady === 'true') return;
    find.dataset.qaFindReady = 'true';
    find.addEventListener('click', () => {
      setTimeout(() => {
        if (overlay.hidden) {
          overlay.hidden = false;
          document.body.classList.add('search-open');
          document.getElementById('search')?.focus({ preventScroll: true });
          log('forced_search_overlay_open');
        }
      }, 30);
    });
  }

  let queued = false;
  function run() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      enableAllGamesWhenNeeded();
      recoverEmptyGrid();
      repairCardArtwork();
      repairRandomizer();
      repairSearchOverlay();
    });
  }

  window.addEventListener('load', () => {
    setTimeout(run, 400);
    setTimeout(run, 1200);
    setTimeout(run, 2600);
  });

  document.addEventListener('click', event => {
    if (event.target.closest('.heroAction,.chip,.activeFilter,#clearBtn,#moreBtn,#gamesGrid .card')) {
      setTimeout(run, 120);
    }
  }, true);

  new MutationObserver(run).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'hidden', 'src']
  });
})();