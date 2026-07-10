# Eddie's Basement Release Checklist

## Catalog
- [ ] Main catalog loads on a normal connection.
- [ ] Retry path works when `vault-data.js` is blocked.
- [ ] Local fallback catalog appears when the main catalog is unavailable.
- [ ] No duplicate titles appear.
- [ ] Platform names are consistent.
- [ ] Player counts are readable.
- [ ] Browser games have been manually checked.
- [ ] Free-to-play status has been checked recently.

## Artwork
- [ ] First visible row loads without broken image icons.
- [ ] Broken artwork switches to the branded fallback.
- [ ] Cards keep a consistent 16:9 ratio.
- [ ] No stretched artwork appears.
- [ ] Failed image titles are reviewed from the browser's local error log.

## Core experience
- [ ] Surprise Me is visible and works on desktop and mobile.
- [ ] Search works.
- [ ] Platform and setup filters work.
- [ ] Clear resets all filters.
- [ ] No-results state is clear.
- [ ] Data-unavailable state includes Retry.
- [ ] Game details open and close correctly.
- [ ] Report a problem saves successfully.
- [ ] Shareable `#game=` links open the correct game.

## Devices and browsers
- [ ] Current Safari on iPhone.
- [ ] Current Chrome on Android.
- [ ] Chrome desktop.
- [ ] Safari desktop.
- [ ] Firefox desktop.
- [ ] Edge desktop.
- [ ] 320 px, 375 px, 390 px, and 430 px mobile widths.
- [ ] Slow or throttled connection.
- [ ] Private browsing.
- [ ] Third-party images blocked.

## Quality
- [ ] No visible developer notes.
- [ ] No console errors.
- [ ] Keyboard navigation works.
- [ ] Focus states are visible.
- [ ] Reduced-motion preference is respected.
- [ ] External game links open safely in a new tab.
- [ ] Footer language is current and useful.
- [ ] GitHub Pages deployment completed.
- [ ] Previous release can be restored from Git history.
