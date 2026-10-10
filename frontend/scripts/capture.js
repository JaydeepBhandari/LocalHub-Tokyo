const { chromium } = require('playwright');
const fs = require('fs');

async function captureScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Go to Home
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot_home_dark.png', fullPage: true });
  
  // Toggle Theme
  await page.click('.theme-toggle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot_home_light.png', fullPage: true });

  // Click Senso-ji Temple
  await page.click('.theme-toggle'); // back to dark
  await page.waitForTimeout(500);
  
  const sensojiLinks = await page.$$('text="Senso-ji Temple"');
  if (sensojiLinks.length > 0) {
    await sensojiLinks[0].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshot_sensoji.png', fullPage: true });
  }

  await browser.close();
  console.log("Screenshots captured");
}

captureScreenshots();
