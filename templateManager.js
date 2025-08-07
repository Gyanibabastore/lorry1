const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core'); // ✅ use core
const ejs = require('ejs');

function sanitize(str) {
  return str.replace(/[^a-z0-9-_]/gi, '_').substring(0, 30);
}

// 🔁 CHANGE THIS to your local or server Chrome path
const CHROME_PATH =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function generatePDFWithTemplate(templateNumber, lrData, rawMessage) {
  const templatePath = path.join(__dirname, `./templates/template${templateNumber}.ejs`);
  const safeFileName = sanitize(rawMessage || 'message');
  const outputDir = path.join(__dirname, './generated');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `LR-${safeFileName}-${Date.now()}.pdf`);
  const html = await ejs.renderFile(templatePath, lrData);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH, // ✅ Use system-installed Chrome
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // ✅ Required for many servers
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4' });
  await browser.close();

  return outputPath;
}

module.exports = generatePDFWithTemplate;
