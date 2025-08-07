const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const pdf = require('html-pdf'); // ✅ Uses PhantomJS internally

function sanitize(str) {
  return str.replace(/[^a-z0-9-_]/gi, '_').substring(0, 30);
}

async function generatePDFWithTemplate(templateNumber, lrData, rawMessage) {
  const templatePath = path.join(__dirname, `./templates/template${templateNumber}.ejs`);
  const safeFileName = sanitize(rawMessage || 'message');
  const outputDir = path.join(__dirname, './generated');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `LR-${safeFileName}-${Date.now()}.pdf`);
  const html = await ejs.renderFile(templatePath, lrData);

  return new Promise((resolve, reject) => {
    pdf.create(html, { format: 'A4' }).toFile(outputPath, (err, res) => {
      if (err) return reject(err);
      resolve(outputPath);
    });
  });
}

module.exports = generatePDFWithTemplate;
