import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(path, 'utf8');
const runScript = path => {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(read(path), sandbox, { filename: path });
  return sandbox.window;
};

const vault = runScript('vault-data.js');
const previews = runScript('previews.js');
const artwork = fs.existsSync('artwork-data.js') ? runScript('artwork-data.js') : {};
const raw = String(vault.EDDIE_RAW || '');
if (!raw) throw new Error('vault-data.js did not define window.EDDIE_RAW');

const rows = raw.split('|').filter(Boolean).map((row, index) => {
  const [title, genre, platforms, mode, setup, players, tags] = row.split('~');
  return { index, title, genre, platforms, mode, setup, players, tags };
});

const errors = [];
const warnings = [];
const seen = new Map();
const validPlatforms = new Set(['PC','Windows','Mac','Linux','PlayStation','Xbox','Switch','Mobile','Android','iOS','Browser','Console','VR']);

if (rows.length < 20) errors.push(`Catalog has only ${rows.length} rows`);
for (const row of rows) {
  const key = String(row.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!row.title?.trim()) errors.push(`Row ${row.index + 1} has no title`);
  if (!row.genre?.trim()) warnings.push(`${row.title}: missing genre`);
  if (!row.platforms?.trim()) errors.push(`${row.title}: missing platforms`);
  if (!row.players?.trim()) warnings.push(`${row.title}: missing player count`);
  if (key) {
    if (seen.has(key)) errors.push(`Duplicate title: ${row.title} / ${seen.get(key)}`);
    else seen.set(key, row.title);
  }
  for (const platform of String(row.platforms || '').split(/\s+/).filter(Boolean)) {
    if (!validPlatforms.has(platform)) warnings.push(`${row.title}: nonstandard platform '${platform}'`);
  }
  if (String(row.platforms).includes('Browser') && !/no download|account|browser/i.test(String(row.setup))) {
    warnings.push(`${row.title}: browser game has questionable setup '${row.setup}'`);
  }
  if (!/(\d|many|massive|varies|players?|solo|team)/i.test(String(row.players || ''))) {
    warnings.push(`${row.title}: questionable player count '${row.players}'`);
  }
}

const urlObjects = [previews.EDDIE_PREVIEWS || {}, previews.EDDIE_URLS || {}, artwork.EDDIE_ARTWORK || {}];
const urls = new Set();
for (const object of urlObjects) {
  for (const value of Object.values(object)) {
    for (const item of (Array.isArray(value) ? value : [value])) {
      if (!item) continue;
      try {
        const parsed = new URL(String(item));
        if (!['http:', 'https:'].includes(parsed.protocol)) errors.push(`Unsupported URL protocol: ${item}`);
        urls.add(parsed.href);
      } catch {
        errors.push(`Malformed URL: ${item}`);
      }
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  games: rows.length,
  uniqueTitles: seen.size,
  artworkAndGameUrls: urls.size,
  errors,
  warnings: [...new Set(warnings)]
};
fs.mkdirSync('audit-results', { recursive: true });
fs.writeFileSync('audit-results/catalog-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);
