/**
 * utils/academyCertificate.js
 * Draws the Hiresnix AI Academy certificate PDF and streams it to the response.
 * Same design as the institution-student certificate.
 */
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function streamAcademyCertificate(res, { studentName, idLabel, courseName, certNo, fileId }) {
  const verifyUrl = `${process.env.CLIENT_URL || 'https://hiresnix.co.in'}/verification/academy-certificate/${certNo}`;
  const issuedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // Build QR first so a failure here can still return a JSON error
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  const safeFile = `Academy_${courseName.replace(/[^A-Za-z0-9]+/g, '_')}_${String(fileId).replace(/[^A-Za-z0-9-]+/g, '')}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFile}"`);

  const W = 841.89, H = 595.28;
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  doc.pipe(res);

  const GOLD = '#d4af37', DARK = '#0f172a', ACCENT = '#6366f1';

  doc.rect(0, 0, W, H).fill('#ffffff');
  doc.rect(20, 20, W - 40, H - 40).lineWidth(3).stroke(GOLD);
  doc.rect(26, 26, W - 52, H - 52).lineWidth(1).stroke(GOLD);

  doc.rect(20, 20, W - 40, 90).fill(DARK);
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('Hiresnix', 50, 35);
  doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('Empowering Future Professionals', 50, 62);
  doc.fillColor('#818cf8').fontSize(11).font('Helvetica-Bold')
     .text('AI ACADEMY — CERTIFICATE OF COMPLETION', 0, 52, { align: 'right', width: W - 50 });

  const diamond = (x, y, s) => doc.moveTo(x, y - s).lineTo(x + s, y).lineTo(x, y + s).lineTo(x - s, y).fillColor(GOLD).fill();
  diamond(35, 70, 6); diamond(W - 35, 70, 6);

  doc.fillColor(DARK).fontSize(34).font('Helvetica-Bold').text('Certificate of Completion', 0, 130, { align: 'center' });
  doc.rect(W / 2 - 120, 178, 240, 2).fill(GOLD);

  doc.fillColor('#475569').fontSize(13).font('Helvetica').text('This is to certify that', 0, 196, { align: 'center' });
  doc.fillColor(DARK).fontSize(30).font('Helvetica-Bold').text(studentName, 0, 218, { align: 'center' });
  doc.fillColor('#475569').fontSize(13).font('Helvetica')
     .text('has successfully completed the AI Academy course in', 0, 262, { align: 'center' });
  doc.fillColor(ACCENT).fontSize(18).font('Helvetica-Bold').text(courseName, 0, 286, { align: 'center' });
  doc.fillColor('#475569').fontSize(12).font('Helvetica')
     .text(`at Hiresnix AI Academy  |  Issued on ${issuedDate}`, 0, 316, { align: 'center' });
  doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text(`Certificate No: ${certNo}`, 0, 338, { align: 'center' });
  if (idLabel) doc.fillColor('#334155').fontSize(9).font('Helvetica').text(idLabel, 0, 352, { align: 'center' });

  const qrSize = 75, qrX = W / 2 - qrSize / 2, qrY = H - 170;
  doc.roundedRect(qrX - 9, qrY - 9, qrSize + 18, qrSize + 36, 6).fillAndStroke('#ffffff', GOLD);
  doc.image(qrBuffer, qrX, qrY, { width: qrSize });
  doc.fillColor('#1e293b').fontSize(7).font('Helvetica-Bold')
     .text('Scan to Verify', qrX - 4, qrY + qrSize + 4, { width: qrSize + 8, align: 'center' });
  doc.fillColor('#64748b').fontSize(5.5).font('Helvetica')
     .text(certNo, qrX - 4, qrY + qrSize + 15, { width: qrSize + 8, align: 'center' });

  const sig = (name, title, x, y, imgPath, mult) => {
    try {
      if (fs.existsSync(imgPath)) {
        const boxW = 100 * mult, boxH = 40 * mult;
        doc.image(imgPath, x + (160 - boxW) / 2, y - (boxH - 12), { fit: [boxW, boxH], align: 'center' });
      }
    } catch (e) { /* signature image optional */ }
    doc.moveTo(x, y).lineTo(x + 160, y).stroke('#334155');
    doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(name, x, y + 6, { width: 160, align: 'center' });
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(title, x, y + 20, { width: 160, align: 'center' });
  };
  const sigDir = path.join(__dirname, '..', 'signatures');
  sig('Mr.Jayesh Badgujar', 'Program Director', W / 2 - 260, H - 125, path.join(sigDir, 'Director.png'), 1.6);
  sig('Mr.A S Borse', 'Founder & CEO, Hiresnix', W / 2 + 100, H - 125, path.join(sigDir, 'ceo.png'), 1.6);

  doc.rect(20, H - 58, W - 40, 38).fill(DARK);
  doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
     .text('support@hiresnix.co.in  |  www.hiresnix.co.in  |  Shirpur, Maharashtra, India', 0, H - 45, { align: 'center' });

  doc.end();
}

module.exports = { streamAcademyCertificate };
