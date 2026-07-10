# Eddie's Basement Release Checklist

## Catalog
- [ ] Site loads with `vault-data.js` available.
- [ ] Site loads from cached catalog when the data file is blocked.
- [ ] Embedded emergency catalog appears when neither source is available.
- [ ] No duplicate titles are visible.
- [ ] Platform names are normalized.
- [ ] Player-count text is present and sensible.
- [ ] Search, platform, setup, and tag filters return expected results.

## Images
- [ ] First visible row has artwork or the branded fallback.
- [ ] Broken images change to the branded fallback without a broken-image icon.
- [ ] Images preserve a consistent 16:9 crop.
- [ ] No blank cards or distorted logos appear.

## Randomizer
- [ ] Surprise Me is visible on desktop and mobile.
- [ ] The same game is not selected twice in a row.
- [ ] Pick Again, Save, Not Tonight, Share, and Report work.
- [ ] Shared `?game=` URLs reopen the correct game.

## Mobile
- [ ] iPhone Safari: portrait and landscape.
- [ ] Android Chrome: common 360px, 390px, and 430px widths.
- [ ] Touch targets are at least 44px where practical.
- [ ] Modal behaves as a bottom sheet and can be dismissed.
- [ ] Search and filters remain usable while scrolling.

## Browsers
- [ ] Safari current.
- [ ] Chrome current.
- [ ] Firefox current.
- [ ] Edge current.
- [ ] Private browsing tested.
- [ ] Third-party images blocked: fallback still works.

## Content and links
- [ ] No developer-facing copy is visible.
- [ ] Official links for featured games open correctly.
- [ ] Free-to-play and browser claims spot-checked.
- [ ] Footer, favicon, social metadata, and install manifest work.

## Release
- [ ] No console errors during normal browsing.
- [ ] `health.json` returns `status: ok`.
- [ ] GitHub Pages deployment completed.
- [ ] Previous release can be restored from Git history.
