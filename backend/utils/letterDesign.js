// utils/letterDesign.js
// Shared look for the Internship Completion Letter and the Letter of Recommendation
// (A4 portrait), matching the grey-beige certificate: soft silk background, logo top-left,
// rosette badge top-right, a bold title block with a thin divider, then the letter text.
//
// Used by downloadCompletionLetter and downloadLOR in controllers/internshipPlatformController.js.
// Fonts (SIL Open Font License, assets/fonts): Montserrat. Falls back to Helvetica.

const path = require('path');
const fs = require('fs');

const ASSETS = path.join(__dirname, '..', 'assets');
const LOGO = path.join(ASSETS, 'hiresnix-logo-letter.png');

const INK = '#353331';
const BODY = '#4A4744';
const MUTED = '#7A746F';
const BADGE = '#716962';

const W = 595.28;
const H = 841.89;
const L = 60;
const TW = W - 2 * L;

function fonts(doc) {
  const reg = (name, file, fallback) => {
    try { doc.registerFont(name, path.join(ASSETS, 'fonts', file)); return name; } catch { return fallback; }
  };
  return {
    black: reg('L-black', 'Montserrat-800.woff', 'Helvetica-Bold'),
    bold: reg('L-bold', 'Montserrat-700.woff', 'Helvetica-Bold'),
    semi: reg('L-semi', 'Montserrat-600.woff', 'Helvetica-Bold'),
    medium: reg('L-medium', 'Montserrat-500.woff', 'Helvetica'),
    regular: reg('L-regular', 'Montserrat-400.woff', 'Helvetica'),
  };
}

function background(doc) {
  doc.rect(0, 0, W, H).fill(doc.linearGradient(0, 0, W, H).stop(0, '#DCD5D0').stop(0.5, '#EAE5E1').stop(1, '#E6E0DC'));
  const fold = (opacity, color, pts) => {
    doc.save().fillOpacity(opacity).fillColor(color);
    doc.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i += 3) doc.bezierCurveTo(...pts[i], ...pts[i + 1], ...pts[i + 2]);
    doc.closePath().fill().restore();
  };
  fold(0.22, '#FFFFFF', [[300, 0], [370, 140], [330, 330], [430, 470], [500, 560], [580, 520], [W, 430], [W, 0], [W, 0], [300, 0]]);
  fold(0.16, '#FFFFFF', [[0, 520], [90, 450], [190, 500], [250, 640], [290, 740], [230, H], [140, H], [60, H], [0, H], [0, 520]]);
  fold(0.05, '#3D3530', [[400, 0], [430, 110], [400, 210], [460, 300], [500, 350], [560, 300], [W, 250], [W, 140], [500, 80], [400, 0]]);
}

function badge(doc, cx, cy, r) {
  doc.save();
  doc.fillColor('#5F5852')
    .polygon([cx - 12, cy + r * 0.55], [cx - 3, cy + r * 0.6], [cx - 8, cy + r + 20], [cx - 14, cy + r + 14], [cx - 21, cy + r + 19]).fill()
    .polygon([cx + 12, cy + r * 0.55], [cx + 3, cy + r * 0.6], [cx + 8, cy + r + 20], [cx + 14, cy + r + 14], [cx + 21, cy + r + 19]).fill();
  doc.fillColor(BADGE);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    doc.circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 4).fill();
  }
  doc.circle(cx, cy, r).fill();
  doc.lineWidth(0.9).strokeColor('#9A928B').circle(cx, cy, r - 5).stroke();
  doc.lineWidth(0.5).circle(cx, cy, r - 8).stroke();
  doc.restore();
}

const fit = (doc, font, text, maxSize, minSize, width) => {
  let size = maxSize;
  doc.font(font);
  while (size > minSize && doc.fontSize(size).widthOfString(text) > width) size -= 1;
  return size;
};

/**
 * Background, logo, badge and the title block. Returns fonts; doc.y is set below the header.
 * @param {object} o { big, small, meta: string[] }
 */
function letterPage(doc, o) {
  const f = fonts(doc);
  doc.save(); background(doc); doc.restore();
  try { doc.image(LOGO, L - 4, 38, { fit: [122, 54] }); } catch {
    doc.font(f.bold).fontSize(14).fillColor(INK).text('HIRESNIX', L, 58);
  }
  badge(doc, W - 82, 72, 24);

  const dividerX = 318;
  const bigSize = fit(doc, f.black, o.big, 34, 20, dividerX - L - 14);
  doc.font(f.black).fontSize(bigSize).fillColor(INK)
    .text(o.big, L, 176 - bigSize * 0.95, { width: dividerX - L - 14, align: 'right', lineBreak: false });
  const smallSize = fit(doc, f.medium, o.small, 10.5, 7, dividerX - L - 14);
  doc.font(f.medium).fontSize(smallSize).fillColor(INK)
    .text(o.small, L, 182, { width: dividerX - L - 14, align: 'right', characterSpacing: 2.6, lineBreak: false });
  doc.moveTo(dividerX, 132).lineTo(dividerX, 202).lineWidth(0.9).strokeColor('#8E8883').stroke();

  let my = 150;
  (o.meta || []).forEach((line, i) => {
    doc.font(i === 0 ? f.medium : f.regular).fontSize(i === 0 ? 10.5 : 9).fillColor(i === 0 ? INK : MUTED)
      .text(line, dividerX + 16, my, { width: W - dividerX - L - 16 });
    my = doc.y + 3;
  });

  doc.moveTo(L, 226).lineTo(W - L, 226).lineWidth(0.6).strokeColor('#B9B2AC').stroke();
  doc.y = 246;
  return f;
}

function heading(doc, f, text, size = 13) {
  doc.font(f.bold).fontSize(size).fillColor(INK).text(text, L, doc.y, { width: TW });
}

function para(doc, f, text, gapAfter = 12) {
  doc.font(f.regular).fontSize(10.5).fillColor(BODY).text(text, L, doc.y, { width: TW, align: 'justify', lineGap: 3.5 });
  doc.y += gapAfter;
}

function signature(doc, f, { x, y, name, title, image, forLine = true }) {
  const w = 170;
  if (image && fs.existsSync(image)) {
    try { doc.image(image, x + w / 2 - 66, y - 46, { fit: [132, 44], align: 'center', valign: 'bottom' }); } catch { /* no image */ }
  }
  doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.9).strokeColor(BODY).stroke();
  doc.font(f.semi).fontSize(10).fillColor(INK).text(name, x, y + 7, { width: w + 60 });
  doc.font(f.regular).fontSize(9).fillColor(BODY).text(title, x, doc.y + 1, { width: w + 80 });
  if (forLine) doc.font(f.regular).fontSize(7.5).fillColor(MUTED).text('For SR PATIL INFRASTRUCTURE PRIVATE LIMITED', x, doc.y + 2, { width: w + 100 });
}

function qr(doc, f, buf, label, x, y, size = 62) {
  doc.save().roundedRect(x - 6, y - 6, size + 12, size + 29, 6).lineWidth(0.8).fillAndStroke('#FFFFFF', '#A59E98').restore();
  doc.image(buf, x, y, { width: size });
  doc.font(f.bold).fontSize(6.3).fillColor(INK).text('Scan to Verify', x - 6, y + size + 3, { width: size + 12, align: 'center' });
  doc.font(f.regular).fontSize(4.9).fillColor(MUTED).text(label, x - 8, y + size + 12, { width: size + 16, align: 'center' });
}

function footer(doc, f) {
  doc.moveTo(L, H - 64).lineTo(W - L, H - 64).lineWidth(0.6).strokeColor('#B9B2AC').stroke();
  doc.font(f.semi).fontSize(7.5).fillColor(BODY)
    .text('Operated by SR PATIL INFRASTRUCTURE PRIVATE LIMITED  |  CIN: U42909MH2024PTC429260', 0, H - 54, { width: W, align: 'center' });
  doc.font(f.regular).fontSize(7.5).fillColor(MUTED)
    .text('support@hiresnix.co.in  |  hr@hiresnix.co.in  |  www.hiresnix.co.in  |  Shirpur, Maharashtra, India', 0, H - 41, { width: W, align: 'center' });
}

function watermark(doc, f, text = 'CONFIDENTIAL') {
  const size = 92;
  doc.save();
  doc.font(f.black).fontSize(size);
  const tw = doc.widthOfString(text);
  doc.rotate(-55, { origin: [W / 2, H / 2] });
  doc.fillColor('#6E6660').fillOpacity(0.08).text(text, W / 2 - tw / 2, H / 2 - size / 2, { lineBreak: false });
  doc.restore();
  doc.fillOpacity(1);
}

module.exports = { letterPage, heading, para, signature, qr, footer, watermark, L, W, H };
