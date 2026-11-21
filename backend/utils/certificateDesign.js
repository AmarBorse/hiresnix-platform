// utils/certificateDesign.js
// Draws the Hiresnix internship completion certificate (A4 landscape) in a simple, modern
// grey-beige style: soft silk background, logo top-left, rosette badge top-right,
// a bold "CERTIFICATE / OF COMPLETION" block beside the intern's name in script,
// the internship details centred below, two signatures and a QR code.
//
// Used by downloadCertificate in controllers/internshipPlatformController.js.
// Fonts (SIL Open Font License, assets/fonts): Montserrat, Great Vibes.
// Each falls back to a built-in PDF font if missing.

const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const LOGO = path.join(ASSETS, 'hiresnix-logo-letter.png');

const BG_A = '#D9D2CD';
const BG_B = '#EAE5E1';
const INK = '#353331';
const BODY = '#4A4744';
const MUTED = '#7A746F';
const BADGE = '#716962';
const RULE = '#4A4744';

const W = 841.89;
const H = 595.28;

function fonts(doc) {
  const reg = (name, file, fallback) => {
    try { doc.registerFont(name, path.join(ASSETS, 'fonts', file)); return name; } catch { return fallback; }
  };
  return {
    black: reg('C-black', 'Montserrat-800.woff', 'Helvetica-Bold'),
    bold: reg('C-bold', 'Montserrat-700.woff', 'Helvetica-Bold'),
    semi: reg('C-semi', 'Montserrat-600.woff', 'Helvetica-Bold'),
    medium: reg('C-medium', 'Montserrat-500.woff', 'Helvetica'),
    regular: reg('C-regular', 'Montserrat-400.woff', 'Helvetica'),
    script: reg('C-script', 'GreatVibes-400.woff', 'Times-Italic'),
  };
}

// Soft grey-beige background with light silk folds
function background(doc) {
  doc.rect(0, 0, W, H).fill(doc.linearGradient(0, 0, W, H).stop(0, BG_A).stop(0.55, BG_B).stop(1, '#E6E0DC'));
  const fold = (opacity, color, pts) => {
    doc.save().fillOpacity(opacity).fillColor(color);
    doc.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i += 3) doc.bezierCurveTo(...pts[i], ...pts[i + 1], ...pts[i + 2]);
    doc.closePath().fill().restore();
  };
  fold(0.22, '#FFFFFF', [[420, 0], [520, 120], [470, 260], [600, 360], [700, 430], [820, 380], [W, 300], [W, 0], [W, 0], [420, 0]]);
  fold(0.16, '#FFFFFF', [[0, 330], [120, 260], [260, 300], [360, 420], [420, 500], [330, H], [200, H], [100, H], [0, H], [0, 330]]);
  fold(0.06, '#3D3530', [[560, 0], [600, 90], [560, 170], [640, 250], [700, 300], [790, 250], [W, 200], [W, 120], [700, 80], [560, 0]]);
  fold(0.18, '#FFFFFF', [[150, 0], [210, 70], [190, 150], [260, 210], [300, 240], [360, 200], [380, 120], [300, 60], [250, 20], [150, 0]]);
}

// Rosette badge (top right)
function badge(doc, cx, cy, r) {
  doc.save();
  // ribbon tails
  doc.fillColor('#5F5852')
    .polygon([cx - 16, cy + r * 0.55], [cx - 4, cy + r * 0.6], [cx - 10, cy + r + 26], [cx - 18, cy + r + 18], [cx - 27, cy + r + 24]).fill()
    .polygon([cx + 16, cy + r * 0.55], [cx + 4, cy + r * 0.6], [cx + 10, cy + r + 26], [cx + 18, cy + r + 18], [cx + 27, cy + r + 24]).fill();
  // scalloped rim
  doc.fillColor(BADGE);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    doc.circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 5.2).fill();
  }
  doc.circle(cx, cy, r).fill();
  doc.lineWidth(1).strokeColor('#9A928B').circle(cx, cy, r - 6).stroke();
  doc.lineWidth(0.6).circle(cx, cy, r - 10).stroke();
  doc.restore();
}

// Largest size at which the text fits the width
function fit(doc, font, text, maxSize, minSize, width) {
  let size = maxSize;
  doc.font(font);
  while (size > minSize && doc.fontSize(size).widthOfString(text) > width) size -= 1;
  return size;
}

function signature(doc, f, { cx, y, w, name, title, image }) {
  if (image) { try { doc.image(image, cx - 62, y - 46, { fit: [124, 42], align: 'center', valign: 'bottom' }); } catch { /* no image */ } }
  doc.moveTo(cx - w / 2, y).lineTo(cx + w / 2, y).lineWidth(1).strokeColor(RULE).stroke();
  doc.font(f.semi).fontSize(10).fillColor(INK).text(name, cx - w / 2 - 20, y + 7, { width: w + 40, align: 'center' });
  doc.font(f.regular).fontSize(9).fillColor(BODY).text(title, cx - w / 2 - 20, doc.y + 1, { width: w + 40, align: 'center' });
}

/**
 * @param {PDFKit.PDFDocument} doc  A4 landscape, margin 0, already piped
 * @param {object} d { studentName, domainName, duration, issueDate, companyName, certNo, qrLabel }
 * @param {object} h { qrBuffer, directorSignature, ceoSignature, contactLine }
 */
function drawInternshipCertificate(doc, d, h = {}) {
  const f = fonts(doc);
  const cx = W / 2;

  doc.save(); background(doc); doc.restore();

  // Logo (top left) and badge (top right)
  try { doc.image(LOGO, 58, 40, { fit: [136, 60] }); } catch {
    doc.font(f.bold).fontSize(15).fillColor(INK).text(String(d.companyName).toUpperCase(), 60, 64);
  }
  badge(doc, W - 98, 86, 33);

  // Title block (left) | recipient (right)
  const dividerX = 420;
  const titleSize = fit(doc, f.black, 'CERTIFICATE', 54, 30, dividerX - 70);
  doc.font(f.black).fontSize(titleSize).fillColor(INK)
    .text('CERTIFICATE', 40, 240 - titleSize * 0.95, { width: dividerX - 58, align: 'right', lineBreak: false });
  doc.font(f.medium).fontSize(15).fillColor(INK)
    .text('OF COMPLETION', 40, 248, { width: dividerX - 60, align: 'right', characterSpacing: 4 });
  doc.moveTo(dividerX, 182).lineTo(dividerX, 276).lineWidth(1).strokeColor('#8E8883').stroke();

  doc.font(f.medium).fontSize(17).fillColor(INK).text('This is to certify that', dividerX + 18, 190, { width: W - dividerX - 70 });
  const name = String(d.studentName || 'Student');
  const nameSize = fit(doc, f.script, name, 46, 22, W - dividerX - 70);
  doc.font(f.script).fontSize(nameSize).fillColor(INK).text(name, dividerX + 16, 256 - nameSize * 0.62, { width: W - dividerX - 60, lineBreak: false });

  // Details (wording as before)
  doc.font(f.regular).fontSize(12.5).fillColor(BODY)
    .text('has successfully completed the internship program in', 100, 322, { width: W - 200, align: 'center' });
  const domainSize = fit(doc, f.bold, d.domainName, 18, 12, W - 220);
  doc.font(f.bold).fontSize(domainSize).fillColor(INK).text(d.domainName, 110, doc.y + 12, { width: W - 220, align: 'center' });
  doc.font(f.regular).fontSize(12.5).fillColor(BODY)
    .text(`Duration: ${d.duration}   |   at ${d.companyName}   |   Issued on ${d.issueDate}`, 80, doc.y + 8, { width: W - 160, align: 'center' });
  if (d.certNo) {
    doc.font(f.regular).fontSize(8).fillColor(MUTED).text(`Certificate No: ${d.certNo}`, 0, doc.y + 7, { width: W, align: 'center', characterSpacing: 0.4 });
  }

  // Signatures with the QR code in between
  const sy = 508;
  signature(doc, f, { cx: 140, y: sy, w: 156, name: 'Mr.Jayesh Badgujar', title: 'Program Director', image: h.directorSignature });
  signature(doc, f, { cx: W - 140, y: sy, w: 156, name: 'Mr.A S Borse', title: `Founder & CEO, ${d.companyName}`, image: h.ceoSignature });

  if (h.qrBuffer) {
    const qs = 58, qx = cx - qs / 2, qy = 456;
    doc.save().roundedRect(qx - 6, qy - 6, qs + 12, qs + 29, 6).lineWidth(0.8).fillAndStroke('#FFFFFF', '#A59E98').restore();
    doc.image(h.qrBuffer, qx, qy, { width: qs });
    doc.font(f.bold).fontSize(6.2).fillColor(INK).text('Scan to Verify', qx - 6, qy + qs + 3, { width: qs + 12, align: 'center' });
    doc.font(f.regular).fontSize(4.8).fillColor(MUTED).text(d.qrLabel || d.certNo || '', qx - 8, qy + qs + 12, { width: qs + 16, align: 'center' });
  }

  if (h.contactLine) {
    doc.font(f.regular).fontSize(7.5).fillColor(MUTED).text(h.contactLine, 0, H - 26, { width: W, align: 'center' });
  }
}

module.exports = { drawInternshipCertificate };
