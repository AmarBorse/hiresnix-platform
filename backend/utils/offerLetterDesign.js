// utils/offerLetterDesign.js
// Draws the Hiresnix internship offer letter (2 A4 pages) in the "corporate letter" style:
// white page with angled teal + amber corner bands, logo top-left, big bold title on the right,
// a thin rule, sender block + date, "To:" block, letter text with bold highlights, and a
// signature / contact area at the bottom.
//
// Used by generateOfferLetter in controllers/internshipPlatformController.js.
// Fonts: Montserrat (SIL Open Font License, assets/fonts). Falls back to Helvetica if missing.

const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const LOGO = path.join(ASSETS, 'hiresnix-logo-letter.png');

// Change these two to re-colour the whole letter
const ACCENT = '#009D93';   // teal bands, labels, icons
const ACCENT_2 = '#FFBD59'; // amber bands
const INK = '#1C2426';
const BODY = '#3A4548';
const MUTED = '#6B7780';
const RULE = '#BFC6C9';
const TINT = '#F2F8F7';

const W = 595.28;
const H = 841.89;
const L = 58;            // left margin
const R = W - 58;        // right edge of text
const TW = R - L;        // text width

const safe = (s) => String(s ?? '').replace(/₹\s?/g, 'Rs. ');

function registerFonts(doc) {
  const f = {};
  const want = { regular: 400, medium: 500, semibold: 600, bold: 700, black: 800 };
  const fallback = { regular: 'Helvetica', medium: 'Helvetica', semibold: 'Helvetica-Bold', bold: 'Helvetica-Bold', black: 'Helvetica-Bold' };
  for (const [name, weight] of Object.entries(want)) {
    try {
      doc.registerFont(`M-${name}`, path.join(ASSETS, 'fonts', `Montserrat-${weight}.woff`));
      f[name] = `M-${name}`;
    } catch {
      f[name] = fallback[name];
    }
  }
  return f;
}

// ── Page decoration ────────────────────────────────────────────────
function decorate(doc) {
  doc.save();
  doc.rect(0, 0, W, H).fill('#FFFFFF');

  // Soft silk-like sweeps in the background
  doc.fillOpacity(0.55).fillColor('#F1F4F4');
  doc.moveTo(0, 250).bezierCurveTo(180, 170, 330, 420, W, 300).lineTo(W, 380)
    .bezierCurveTo(340, 500, 190, 260, 0, 330).closePath().fill();
  doc.fillOpacity(0.45).fillColor('#EEF2F2');
  doc.moveTo(0, 560).bezierCurveTo(200, 470, 360, 700, W, 600).lineTo(W, 660)
    .bezierCurveTo(360, 760, 210, 560, 0, 620).closePath().fill();
  doc.fillOpacity(1);

  // Top corner bands
  doc.fillColor(ACCENT_2).polygon([0, 0], [172, 0], [158, 14], [0, 14]).fill();
  doc.fillColor(ACCENT).polygon([272, 0], [W, 0], [W, 28], [308, 28]).fill();
  // Bottom corner bands
  doc.fillColor(ACCENT).polygon([0, H - 32], [296, H - 32], [332, H], [0, H]).fill();
  doc.fillColor(ACCENT_2).polygon([442, H - 15], [W, H - 15], [W, H], [428, H]).fill();
  doc.restore();
}

function header(doc, f, title) {
  try { doc.image(LOGO, L, 40, { fit: [124, 58] }); } catch { /* no logo file */
    doc.font(f.black).fontSize(20).fillColor(INK).text('HIRESNIX', L, 58);
  }
  doc.font(f.black).fontSize(18).fillColor(INK)
    .text(title, L + 140, 64, { width: TW - 140, align: 'right', characterSpacing: 0.4 });
  doc.moveTo(L, 112).lineTo(R, 112).lineWidth(0.8).strokeColor(RULE).stroke();
}

// Small vector icons in the accent colour
const icons = {
  pin(doc, x, y) {
    doc.save().fillColor(ACCENT);
    doc.circle(x + 5, y + 4.5, 4.5).fill();
    doc.polygon([x + 1.2, y + 6.5], [x + 8.8, y + 6.5], [x + 5, y + 12]).fill();
    doc.fillColor('#FFFFFF').circle(x + 5, y + 4.5, 1.7).fill();
    doc.restore();
  },
  mail(doc, x, y) {
    doc.save().roundedRect(x, y + 2, 11, 8, 1.5).fill(ACCENT);
    doc.moveTo(x + 0.8, y + 2.8).lineTo(x + 5.5, y + 6.8).lineTo(x + 10.2, y + 2.8)
      .lineWidth(1).strokeColor('#FFFFFF').stroke();
    doc.restore();
  },
  globe(doc, x, y) {
    doc.save().lineWidth(1).strokeColor(ACCENT);
    doc.circle(x + 5.5, y + 6, 5).stroke();
    doc.ellipse(x + 5.5, y + 6, 2.2, 5).stroke();
    doc.moveTo(x + 0.5, y + 6).lineTo(x + 10.5, y + 6).stroke();
    doc.restore();
  },
};

function contactRow(doc, f) {
  const y = H - 66;
  const items = [
    ['pin', 'Shirpur, Maharashtra, India'],
    ['mail', 'hr@hiresnix.co.in'],
    ['globe', 'www.hiresnix.co.in'],
  ];
  const colW = TW / 3;
  items.forEach(([icon, label], i) => {
    const x = L + colW * i;
    icons[icon](doc, x, y);
    doc.font(f.medium).fontSize(8.5).fillColor(BODY).text(label, x + 16, y + 2, { width: colW - 18, lineBreak: false });
  });
}

// Text with **bold** parts, as one flowing paragraph
function rich(doc, f, text, x, y, opts = {}) {
  const size = opts.size || 10;
  const parts = safe(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean);
  parts.forEach((p, i) => {
    const bold = p.startsWith('**');
    const str = bold ? p.slice(2, -2) : p;
    const more = i < parts.length - 1;
    doc.font(bold ? f.bold : f.regular).fontSize(size).fillColor(bold ? INK : (opts.color || BODY));
    if (i === 0) doc.text(str, x, y, { width: opts.width || TW, lineGap: opts.lineGap ?? 3.2, continued: more });
    else doc.text(str, { continued: more });
  });
  return doc.y;
}

function bullets(doc, f, items, x, y, width, size = 9.5) {
  let cy = y;
  items.forEach(item => {
    doc.save().fillColor(ACCENT).circle(x + 2.5, cy + size * 0.55, 2).fill().restore();
    doc.font(f.regular).fontSize(size).fillColor(BODY).text(safe(item), x + 11, cy, { width: width - 11, lineGap: 2 });
    cy = doc.y + 3;
  });
  return cy;
}

function sectionLabel(doc, f, text, x, y, width = TW) {
  doc.font(f.bold).fontSize(9).fillColor(ACCENT).text(text.toUpperCase(), x, y, { width, characterSpacing: 0.8 });
  return doc.y + 5;
}

/**
 * @param {PDFKit.PDFDocument} doc  A4, margin 0, already piped
 * @param {object} d  letter data
 * @param {object} helpers { QRCode, drawSeal(doc, x, y), signaturePath }
 */
async function drawOfferLetter(doc, d, helpers = {}) {
  const f = registerFonts(doc);
  const first = String(d.candidateName).trim().split(/\s+/)[0] || d.candidateName;

  // ════════════════════════ PAGE 1 ════════════════════════
  decorate(doc);
  header(doc, f, 'INTERNSHIP OFFER LETTER');

  // Sender (left) and date + offer ID (right)
  let y = 130;
  doc.font(f.bold).fontSize(10.5).fillColor(INK).text('Hiresnix', L, y);
  doc.font(f.regular).fontSize(9).fillColor(BODY)
    .text(`Operated by ${d.legalEntity}`, L, y + 15, { width: 300 })
    .text('Shirpur, Maharashtra, India', L, doc.y + 1)
    .text('hr@hiresnix.co.in', L, doc.y + 1);
  const senderBottom = doc.y;
  doc.font(f.medium).fontSize(10).fillColor(INK).text(safe(d.dateStr), L, y, { width: TW, align: 'right' });
  doc.font(f.semibold).fontSize(8.5).fillColor(ACCENT).text(`Offer ID: ${safe(d.offerId)}`, L, y + 16, { width: TW, align: 'right' });

  // To
  y = senderBottom + 18;
  doc.font(f.regular).fontSize(9).fillColor(MUTED).text('To:', L, y);
  doc.font(f.bold).fontSize(11).fillColor(INK).text(safe(d.candidateName), L, doc.y + 2);

  y = doc.y + 16;
  doc.font(f.bold).fontSize(10).fillColor(INK)
    .text(`Subject: Internship Offer Letter – ${safe(d.domainName)} Intern`, L, y, { width: TW });

  y = doc.y + 12;
  doc.font(f.regular).fontSize(10).fillColor(BODY).text(`Dear ${safe(first)},`, L, y);

  y = rich(doc, f,
    `**Congratulations!** We are pleased to offer you the position of **${d.domainName} Intern** at **Hiresnix**. Your internship details are as follows:`,
    L, doc.y + 10);

  // Details grid
  y += 12;
  const rows = [
    [['Position', `${d.domainName} Intern`], ['Department', d.domainName], ['Start Date', d.startStr]],
    [['End Date', d.endStr], ['Duration', d.durationLabel], ['Mode of Internship', d.mode]],
    [['Working Hours', 'Flexible (Maximum 20 Hours per Week)'], ['Reporting Manager', 'Assigned Mentor / Project Lead'], ['Compensation', d.stipendText]],
  ];
  const cellW = TW / 3;
  const pad = 12;
  // measure row heights
  const rowH = rows.map(row => Math.max(...row.map(([, v]) =>
    doc.font(f.semibold).fontSize(9).heightOfString(safe(v), { width: cellW - pad * 2 }))) + 26);
  const gridH = rowH.reduce((a, b) => a + b, 0);
  doc.save().roundedRect(L, y, TW, gridH, 8).fill(TINT).restore();
  doc.save().rect(L, y, 3, gridH).fill(ACCENT).restore();
  let ry = y;
  rows.forEach((row, ri) => {
    row.forEach(([label, value], ci) => {
      const cx = L + cellW * ci + pad;
      doc.font(f.semibold).fontSize(7).fillColor(ACCENT).text(label.toUpperCase(), cx, ry + 9, { width: cellW - pad * 2, characterSpacing: 0.6 });
      doc.font(f.semibold).fontSize(9).fillColor(INK).text(safe(value), cx, ry + 20, { width: cellW - pad * 2, lineGap: 1 });
    });
    if (ri < rows.length - 1) {
      doc.moveTo(L + pad, ry + rowH[ri]).lineTo(R - pad, ry + rowH[ri]).lineWidth(0.5).strokeColor('#D7E5E3').stroke();
    }
    ry += rowH[ri];
  });
  y += gridH + 16;

  doc.font(f.regular).fontSize(9.5).fillColor(BODY).text(
    'Hiresnix is a technology and business services company delivering recruitment, software development, artificial intelligence (AI), digital transformation, and consulting solutions to organizations. To support innovation and workforce development, the company offers structured internship opportunities that enable candidates to contribute to live business projects while gaining practical industry experience.',
    L, y, { width: TW, lineGap: 3, align: 'justify' });

  y = doc.y + 10;
  doc.font(f.semibold).fontSize(9.5).fillColor(INK).text('During the internship, you will have the opportunity to:', L, y);
  y = doc.y + 6;
  const half = (TW - 16) / 2;
  const leftEnd = bullets(doc, f, ['Work on real-world projects', 'Gain hands-on industry experience', 'Learn through practical assignments'], L, y, half);
  const rightEnd = bullets(doc, f, ['Receive mentorship and guidance', 'Build professional and technical skills', 'Enhance problem-solving and communication abilities'], L + half + 16, y, half);
  y = Math.max(leftEnd, rightEnd) + 6;

  doc.font(f.regular).fontSize(9.5).fillColor(BODY)
    .text('Outstanding interns may be considered for future opportunities based on company requirements and performance evaluation. We look forward to supporting your professional growth and learning journey through Hiresnix.',
      L, y, { width: TW, lineGap: 3, align: 'justify' });

  doc.font(f.regular).fontSize(8.5).fillColor(MUTED)
    .text('Continued on the next page: terms, acceptance and signature.', L, H - 92, { width: TW, align: 'right' });
  contactRow(doc, f);

  // ════════════════════════ PAGE 2 ════════════════════════
  doc.addPage({ size: 'A4', margin: 0 });
  decorate(doc);
  header(doc, f, 'TERMS & ACKNOWLEDGEMENT');

  y = 132;
  y = sectionLabel(doc, f, 'On successful completion', L, y);
  doc.font(f.regular).fontSize(9.5).fillColor(BODY)
    .text('Upon successful completion of the internship and satisfactory performance evaluation, interns may be eligible to receive:', L, y, { width: TW, lineGap: 2.5 });
  y = bullets(doc, f, ['Internship Completion Certificate', 'Internship Completion Letter', 'Letter of Recommendation (subject to company evaluation)'], L, doc.y + 6, TW);

  y += 10;
  const colY = y;
  let a = sectionLabel(doc, f, 'Intern responsibilities', L, colY, half);
  a = bullets(doc, f, ['Maintain professional conduct throughout the internship', 'Complete assigned tasks within agreed timelines', 'Participate actively in assigned projects', 'Follow company communication and work guidelines'], L, a, half);
  let b = sectionLabel(doc, f, 'Internship guidelines', L + half + 16, colY, half);
  b = bullets(doc, f, ['Maintain regular communication with mentors', 'Submit assigned work within specified timelines', 'Follow ethical and professional work practices', 'Respect project confidentiality and company resources'], L + half + 16, b, half);
  y = Math.max(a, b) + 10;

  y = sectionLabel(doc, f, 'Confidentiality', L, y);
  doc.font(f.regular).fontSize(9.5).fillColor(BODY).text(
    'The intern shall maintain the confidentiality of all company information, project materials, intellectual property, and confidential business information accessed during the internship.',
    L, y, { width: TW, lineGap: 2.5, align: 'justify' });

  y = sectionLabel(doc, f, 'Acceptance', L, doc.y + 12);
  rich(doc, f, 'Please confirm your acceptance of this internship offer by replying to the official email or communication shared by Hiresnix. For verification or queries: **hr@hiresnix.co.in**', L, y, { size: 9.5, lineGap: 2.5 });

  // Signature (left), seal (middle), QR (right)
  const sy = Math.max(doc.y + 46, 560);
  doc.font(f.regular).fontSize(10).fillColor(BODY).text('Warm Regards,', L, sy);
  try { doc.image(helpers.signaturePath, L - 4, sy + 14, { fit: [125, 40] }); } catch { /* no signature file */ }
  doc.font(f.bold).fontSize(10.5).fillColor(INK).text('Mr. Jayesh Badgujar', L, sy + 58);
  doc.font(f.regular).fontSize(8.8).fillColor(BODY)
    .text('Program Director \u2013 Hiresnix', L, doc.y + 1)
    .text(`For ${d.legalEntity}`, L, doc.y + 1, { width: 230 })
    .text(`CIN: ${d.cin}`, L, doc.y + 1, { width: 230 });

  if (helpers.drawSeal) {
    try { helpers.drawSeal(doc, 352, sy + 62); } catch { /* seal is decoration */ }
  }

  if (helpers.QRCode) {
    try {
      const url = `https://www.hiresnix.co.in/verification/offer-letter/${d.offerId}`;
      const qr = await helpers.QRCode.toBuffer(url, { errorCorrectionLevel: 'H', margin: 1, width: 140, color: { dark: '#1C2426', light: '#FFFFFF' } });
      const qs = 72, qx = R - qs, qy = sy + 18;
      doc.save().roundedRect(qx - 6, qy - 6, qs + 12, qs + 34, 8).lineWidth(0.8).fillAndStroke('#FFFFFF', ACCENT).restore();
      doc.image(qr, qx, qy, { width: qs });
      doc.font(f.semibold).fontSize(7).fillColor(INK).text('Scan to verify', qx - 6, qy + qs + 5, { width: qs + 12, align: 'center' });
      doc.font(f.regular).fontSize(6).fillColor(MUTED).text(safe(d.offerId), qx - 6, qy + qs + 15, { width: qs + 12, align: 'center' });
    } catch { /* QR is optional */ }
  }

  contactRow(doc, f);
}

module.exports = { drawOfferLetter };
