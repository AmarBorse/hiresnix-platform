// utils/postOcr.js
// Reads the text in an intern's LinkedIn post screenshot (Tesseract OCR, runs on our server,
// nothing is sent anywhere) and checks, in this order:
//   1. the post's profile name (top of the post) has the intern's first name   e.g. "Raj"
//   2. the offer letter in the post has the intern's full name                 e.g. "Raj Mahajan"
//   3. the role (e.g. "Data Science") and "Hiresnix" are there
//   4. no other intern's offer letter ID (HSH-INT-YYYY-XXXX) is shown
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

// The profile name is the start of the first line of the post ("Raj Mahajan ✓ · 1st"):
// take the name-like words until a badge, connection degree or symbol.
const STOP = new Set(['1st', '2nd', '3rd', '3rd+', 'you', 'he', 'him', 'she', 'her', 'they', 'them', 'premium', 'verified', 'follow', 'following']);
const authorFromLines = (lines) => {
  const first = lines[0] || '';
  const out = [];
  for (const raw of first.split(/\s+/)) {
    const w = raw.replace(/[(),]/g, '');
    if (!w || STOP.has(w.toLowerCase()) || !/^[A-Za-z][A-Za-z.'-]*$/.test(w)) break;
    out.push(w);
    if (out.length >= 5) break;
  }
  // A long first line is post text, not a name: the screenshot doesn't start at the top of the post
  const looksLikeName = out.length >= 1 && out.length <= 4 && first.split(/\s+/).length <= 7;
  return looksLikeName ? out.join(' ') : '';
};

/**
 * @returns {{ ok, found: {author, letter, role, hiresnix, offerId}, authorName, foreignId, problem }}
 *   problem: short reason to show the intern when ok is false
 */
const checkPost = ({ text, name, role, offerId }) => {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const nameParts = words(name).filter(w => w.length >= 2);
  const firstName = nameParts[0] || '';
  const roleParts = words(role).filter(w => w.length >= 3 && !['and', 'the', 'intern', 'internship'].includes(w));

  // 1. profile name at the top of the post
  const authorName = authorFromLines(lines);
  const authorBag = new Set(words(authorName));
  const author = !!firstName && hasWord(authorBag, firstName);

  // 2. name on the offer letter (lines from "offer letter" on; else everything below the header)
  const letterAt = lines.findIndex((l, i) => i > 0 && /offer\s*letter/i.test(l));
  const letterBag = new Set(words(lines.slice(letterAt > 0 ? letterAt : 3).join(' ')));
  const letter = nameParts.length > 0 && nameParts.every(w => hasWord(letterBag, w));

  const bag = new Set(words(text));
  const found = {
    author, letter,
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

  let problem = '';
  if (foreignId) problem = `This screenshot shows someone else's offer letter (${foreignId}). Upload a screenshot of your own post.`;
  else if (!authorName) problem = 'Take the screenshot from the very top of your post, so your LinkedIn profile name is visible above the post.';
  else if (!author) problem = `Name mismatch: the post is by "${authorName}", but this account is for ${name}. Share the post from your own LinkedIn profile (your profile name must have "${firstName.charAt(0).toUpperCase() + firstName.slice(1)}").`;
  else if (!letter) problem = `Name mismatch: the offer letter in the screenshot doesn't show your name (${name}). Attach your own offer letter to the post and make sure the name is visible in the screenshot.`;
  else if (!found.role) problem = `Your role (${role}) isn't visible in the screenshot. Make sure the offer letter details show in the screenshot.`;
  else if (!found.hiresnix) problem = '"Hiresnix" isn\'t visible in the screenshot. Tag Hiresnix in the post and include the offer letter.';

  return { ok: !problem, found, authorName, foreignId, problem, missing: problem ? [problem] : [] };
};

module.exports = { readText, checkPost, words };