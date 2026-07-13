(() => {
  'use strict';

  const replacements = new Map([
    ['Game night starts here', 'Free multiplayer games'],
    ['What are we playing?', 'Pick something to play'],
    ['Search, pick a vibe, or let Eddie choose.', 'Use search or quick filters.'],
    ['Start here when nobody wants another debate.', 'Solid picks for groups.'],
    ['Good picks for the group chat.', 'Good picks for group play.'],
    ['Tap a cover to see if it fits your group.', 'Tap a cover for platforms, setup, and links.'],
    ['Let’s pick something.', 'Pick a game'],
    ['Choose a few basics, or leave it wide open.', 'Set filters or leave them open.'],
    ['Not Tonight', 'Skip'],
    ['Skipped for tonight', 'Skipped'],
    ['Whole-Night Pick', 'Longer Pick'],
    ['Eddie Chose', 'Random Pick'],
    ['Eddie picked this because ', 'Picked because '],
    ['Eddie picked this as a solid fit for the choices you made.', 'Picked from your selected filters.']
  ]);

  function cleanText(value) {
    let next = value;
    replacements.forEach((to, from) => {
      next = next.split(from).join(to);
    });
    return next;
  }

  function cleanNode(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const tag = node.parentElement?.tagName?.toLowerCase();
        return tag === 'script' || tag === 'style' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(node => {
      const next = cleanText(node.nodeValue || '');
      if (next !== node.nodeValue) node.nodeValue = next;
    });

    root.querySelectorAll?.('[placeholder], [aria-label], [title]').forEach(el => {
      ['placeholder', 'aria-label', 'title'].forEach(attr => {
        if (!el.hasAttribute(attr)) return;
        const current = el.getAttribute(attr);
        const next = cleanText(current || '');
        if (next !== current) el.setAttribute(attr, next);
      });
    });
  }

  cleanNode();
  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const next = cleanText(node.nodeValue || '');
          if (next !== node.nodeValue) node.nodeValue = next;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          cleanNode(node);
        }
      });
      if (mutation.type === 'characterData') {
        const next = cleanText(mutation.target.nodeValue || '');
        if (next !== mutation.target.nodeValue) mutation.target.nodeValue = next;
      }
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
})();
