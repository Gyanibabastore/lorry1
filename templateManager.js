const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const ejs = require('ejs');

// ✅ Sanitize file names (remove unsafe characters)
function sanitize(str) {
  return str
    .replace(/[^a-z0-9-_]/gi, '_')  // Replace all non-alphanumeric characters
    .substring(0, 30);              // Limit filename length to 30 characters
}

async function generatePDFWithTemplate(templateNumber, lrData, rawMessage) {
  const templatePath = path.join(__dirname, `./templates/template${templateNumber}.ejs`);
  
  const safeFileName = sanitize(rawMessage || 'message');
  const outputDir = path.join(__dirname, './generated');

  // ✅ Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `LR-${safeFileName}-${Date.now()}.pdf`);

  const html = await ejs.renderFile(templatePath, lrData);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4' });
  await browser.close();

  return outputPath;
}

module.exports = generatePDFWithTemplate;
