const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Wait a bit to let React hydrate and crash if it does
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
