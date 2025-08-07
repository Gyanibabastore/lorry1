const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

let puppeteer;
let isLambda = false;

try {
  // Try requiring chrome-aws-lambda in cloud environment
  puppeteer = require('puppeteer-core');
  var chromium = require('chrome-aws-lambda');
  isLambda = true;
  console.log("✅ Running in cloud environment with chrome-aws-lambda");
} catch (err) {
  // Fall back to local puppeteer
  puppeteer = require('puppeteer');
  console.log("✅ Running locally with full puppeteer");
}

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

  console.log("✅ Launching headless browser...");
  const browser = await puppeteer.launch(
    isLambda
      ? {
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath,
          headless: chromium.headless,
        }
      : {
          headless: true,
        }
  );

  const page = await browser.newPage();
  console.log("✅ Setting HTML content...");
  await page.setContent(html, { waitUntil: 'networkidle0' });

  console.log("✅ Generating PDF...");
  await page.pdf({ path: outputPath, format: 'A4' });

  await browser.close();
  console.log("✅ PDF saved to:", outputPath);

  return outputPath;
}

module.exports = generatePDFWithTemplate;
