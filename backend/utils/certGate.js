// utils/certGate.js
// Decides whether an intern's certificates are unlocked.
// LinkedIn proof statuses: 'submitted' = accepted (unlocks), 'review' = the screenshot check
// didn't find everything (stays locked until the admin accepts or the intern uploads a better
// one), 'rejected' = admin marked it not valid.
//
//   Fee      — ₹100 payment. Off for now; the admin switch turns it on, and it also turns
//              on by itself from FEE_AUTO_ON_DATE (2 Feb 2028) unless the admin changes that date.
//   LinkedIn — the intern shares their offer letter on LinkedIn, tags Hiresnix, adds the
//              internship to Experience and submits the post link + a screenshot. On by default.
//
// Settings live in the app_settings key/value table (same table as the intern-edit switches).

const { sequelize } = require('../config/db');

const KEYS = {
  feeSwitch: 'cert_fee_required',          // true/false, admin switch
  feeAutoOn: 'cert_fee_auto_on_date',      // 'YYYY-MM-DD' or '' (no automatic start)
  linkedinRequired: 'cert_linkedin_required',
};
const DEFAULTS = { feeSwitch: false, feeAutoOn: '2028-02-02', linkedinRequired: true };

let ready = null;
const ensureTables = () => {
  if (!ready) {
    ready = (async () => {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key         TEXT PRIMARY KEY,
          value       JSONB NOT NULL DEFAULT 'null'::jsonb,
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS cert_linkedin_proofs (
          "userId"       BIGINT PRIMARY KEY,
          "enrollmentId" BIGINT,
          "postUrl"      TEXT NOT NULL,
          screenshot     TEXT,
          status         TEXT NOT NULL DEFAULT 'submitted',   -- submitted | review | rejected
          note           TEXT,
          "submittedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "reviewedAt"   TIMESTAMPTZ,
          "reviewedBy"   TEXT
        )`);
      await sequelize.query(`ALTER TABLE cert_linkedin_proofs ADD COLUMN IF NOT EXISTS "ocrText" TEXT`);
      await sequelize.query(`ALTER TABLE cert_linkedin_proofs ADD COLUMN IF NOT EXISTS "ocrMatch" JSONB`);
    })().catch(err => { ready = null; throw err; });
  }
  return ready;
};

const getSettings = async () => {
  await ensureTables();
  const [rows] = await sequelize.query(`SELECT key, value FROM app_settings WHERE key IN (:keys)`, { replacements: { keys: Object.values(KEYS) } });
  const byKey = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const pick = (name) => (byKey[KEYS[name]] !== undefined && byKey[KEYS[name]] !== null ? byKey[KEYS[name]] : DEFAULTS[name]);
  const feeSwitch = pick('feeSwitch') === true;
  const feeAutoOn = typeof pick('feeAutoOn') === 'string' ? pick('feeAutoOn') : '';
  // Compare dates in India time so "2 Feb 2028" means 2 Feb in India
  const todayIST = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  const feeByDate = !!feeAutoOn && todayIST >= feeAutoOn;
  return {
    feeSwitch, feeAutoOn, feeRequired: feeSwitch || feeByDate,
    linkedinRequired: pick('linkedinRequired') === true,
  };
};

const saveSettings = async (changes) => {
  await ensureTables();
  for (const [name, value] of Object.entries(changes)) {
    if (!KEYS[name]) continue;
    await sequelize.query(
      `INSERT INTO app_settings (key, value, "updatedAt") VALUES (:key, CAST(:value AS jsonb), NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
      { replacements: { key: KEYS[name], value: JSON.stringify(value) } },
    );
  }
  return getSettings();
};

const getLinkedinProof = async (userId) => {
  await ensureTables();
  const [rows] = await sequelize.query(
    `SELECT "userId", "enrollmentId", "postUrl", status, note, "submittedAt", "reviewedAt"
       FROM cert_linkedin_proofs WHERE "userId" = :uid`,
    { replacements: { uid: userId } },
  );
  return rows[0] || null;
};

/**
 * The full unlock picture for one intern.
 * paidOrLegacy: true when the ₹100 was paid or the intern enrolled before payments existed.
 */
const unlockState = async (userId, paidOrLegacy) => {
  const s = await getSettings();
  const proof = s.linkedinRequired ? await getLinkedinProof(userId) : null;
  const linkedinDone = !!proof && proof.status === 'submitted';
  const feeOk = !s.feeRequired || !!paidOrLegacy;
  const linkedinOk = !s.linkedinRequired || linkedinDone;
  return {
    unlocked: feeOk && linkedinOk,
    feeRequired: s.feeRequired, feePaid: !!paidOrLegacy, feeOk,
    linkedinRequired: s.linkedinRequired, linkedinDone, linkedinOk,
    linkedinStatus: proof?.status || null, linkedinNote: proof && proof.status !== 'submitted' ? proof.note || '' : '',
  };
};

module.exports = { ensureTables, getSettings, saveSettings, getLinkedinProof, unlockState, DEFAULTS };