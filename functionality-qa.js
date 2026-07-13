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

  function currentTotalCount() {
    const allCount = document.getElementById('allCount')?.textContent || '';
    const total = Number(String(allCount).replace(/[^0-9]/g, ''));
    return Number.isFinite(total) && total > 0 ? total : 0;
  }

  function moreButtonIsShowingLimitedMode(more) {
    if (!more) return false;
    const label = String(more.textContent || '').trim().toLowerCase();
    return label === 'all games' || label === 'more games';
  }

  function forceAllGamesOnNormalBrowse() {
    if (hasActiveSearchState()) return;

    const more = document.getElementById('moreBtn');
    const gridCount = cards().length;
    const total = currentTotalCount();

    // Core app.js still limits the default grid by artwork quality. That is wrong:
    // missing artwork should only change presentation, never catalog visibility.
    if (more && moreButtonIsShowingLimitedMode(more) && gridCount > 0) {
      more.click();
      log('forced_all_games_for_visibility', { before: gridCount, total });
      return;
    }

    if (more && total && gridCount > 0 && gridCount < Math.min(total, MIN_REASONABLE_GRID)) {
      more.click();
      log('enabled_all_games_low_count', { before: gridCount, total });
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
    if (more && moreButtonIsShowingLimitedMode(more)) {
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

      const src = img ? String(img.currentSrc || img.getAttribute('src') || img.src || '') : '';
      const badFallback = /panel-fallback\.svg|\/Cover\.png|Cover\.png\?|data:image\/svg|image\.thum\.io|s\.wordpress\.com\/mshots|mshots\/v1|google\.com\/s2\/favicons|favicon/i.test(src);
      const hasUsableImage = img && !img.hidden && src && !badFallback;

      card.classList.toggle('qaTextCard', !hasUsableImage);
      art.classList.toggle('qaTextCard', !hasUsableImage);

      if (!hasUsableImage) {
        const title = card.querySelector('.posterTitle h3')?.textContent || 'Game';
        art.setAttribute('data-title', title);
        if (img) img.hidden = true;
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
      forceAllGamesOnNormalBrowse();
      recoverEmptyGrid();
      repairCardArtwork();
      repairRandomizer();
      repairSearchOverlay();
    });
  }

  window.addEventListener('load', () => {
    setTimeout(run, 250);
    setTimeout(run, 700);
    setTimeout(run, 1400);
    setTimeout(run, 2800);
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