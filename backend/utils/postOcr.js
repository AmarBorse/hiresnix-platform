// utils/postOcr.js
// Reads the text in an intern's LinkedIn post screenshot (Tesseract OCR, runs on our server,
// nothing is sent anywhere) and checks that it shows THEIR offer letter:
//   • their name            (e.g. "Raj Mahajan")
//   • their internship role (e.g. "Data Science")
//   • "Hiresnix"
//   • and no other intern's offer letter ID (HSH-INT-YYYY-XXXX)
// Small OCR slips are allowed (one wrong letter in a longer word).

const path = require('path');
const os = require('os');

let workerPromise = null;
let queue = Promise.resolve();

const getWorker = () => {
  if (!workerPromise) {
    const { createWorker } = require('tesseract.js');
    const langDir = path.join(path.dirname(require.resolve('@tesseract.js-data/eng/package.json')), '4.0.0_best_int');
    workerPromise = createWorker('eng', 1, { langPath: langDir, gzip: true, cachePath: os.tmpdir() })
      .catch(err => { workerPromise = null; throw err; });
  }
  return workerPromise;
};

/** OCR a data: URL image. One job at a time; gives up after 45 seconds. */
const readText = (dataUrl) => {
  const job = queue.then(async () => {
    const base64 = String(dataUrl).split(',')[1] || '';
    const worker = await getWorker();
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Reading the screenshot took too long')), 45000));
    const { data } = await Promise.race([worker.recognize(Buffer.from(base64, 'base64')), timeout]);
    return String(data?.text || '');
  });
  queue = job.catch(() => {}); // keep the queue going after a failure
  return job;
};

// ── matching ──────────────────────────────────────────────────────
const words = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);

const editDistance = (a, b) => {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
};

const hasWord = (bag, target) => bag.has(target) || (target.length >= 5 && [...bag].some(w => editDistance(w, target) <= 1));

// Offer IDs are HSH-INT-YYYY-XXXX with XXXX in hex; OCR often turns 0 into O, 1 into I, etc.
const fixHex = (s) => s.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/S/g, '5').replace(/Z/g, '2').replace(/G/g, '6').replace(/T/g, '7');
const offerIds = (text) => (String(text).toUpperCase().match(/HS[HN]\s*-\s*INT\s*-\s*\d{4}\s*-\s*[A-Z0-9]{4}/g) || [])
  .map(x => x.replace(/\s+/g, '').replace(/^HSN/, 'HSH'))
  .map(x => x.slice(0, 13) + fixHex(x.slice(13)));
const idDistance = (a, b) => editDistance(a.slice(-4), b.slice(-4)) + (a.slice(8, 12) === b.slice(8, 12) ? 0 : 2);

/**
 * @returns {{ ok: boolean, found: {name:boolean, role:boolean, hiresnix:boolean, offerId:boolean|null}, foreignId: string|null, missing: string[] }}
 */
const checkPost = ({ text, name, role, offerId }) => {
  const bag = new Set(words(text));
  const nameParts = words(name).filter(w => w.length >= 2);
  const roleParts = words(role).filter(w => w.length >= 3 && !['and', 'the', 'intern', 'internship'].includes(w));

  const found = {
    name: nameParts.length > 0 && nameParts.every(w => hasWord(bag, w)),
    role: roleParts.length === 0 || roleParts.every(w => hasWord(bag, w)),
    hiresnix: hasWord(bag, 'hiresnix'),
    offerId: null,
  };

  let foreignId = null;
  const ids = offerIds(text);
  if (offerId && ids.length) {
    const mine = String(offerId).toUpperCase().replace(/^HSN/, 'HSH');
    found.offerId = ids.some(x => idDistance(x, mine) <= 1);
    if (!found.offerId) foreignId = ids.find(x => idDistance(x, mine) >= 2) || null;
  }

  const missing = [];
  if (!found.name) missing.push(`your name (${name})`);
  if (!found.role) missing.push(`your role (${role})`);
  if (!found.hiresnix) missing.push('“Hiresnix”');
  return { ok: found.name && found.role && found.hiresnix && !foreignId, found, foreignId, missing };
};

module.exports = { readText, checkPost, words };
