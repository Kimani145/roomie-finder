import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const page = await browser.newPage();

  console.log("Navigating to http://localhost:5173/login...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'load' });
  
  await page.fill('input[type="email"]', 'jkimani145@students.tukenya.ac.ke');
  await page.fill('input[type="password"]', 'wrong-pass123');

  console.log("Filled form. Submitting...");
  
  // capture the network so we see if Firebase was called
  page.on('response', response => {
    if(response.url().includes('identitytoolkit')) console.log("Firebase response:", response.status(), response.url());
  });

  await page.click('button[type="submit"]');

  console.log("Waiting for network idle...");
  await page.waitForTimeout(3000); 

  console.log("\n==================== TEST RESULTS ====================");
  console.log("Final URL         :", page.url());
  
  const allText = await page.locator('body').innerText();
  if (allText.includes('Welcome back')) {
    console.log("Login page is active");
  } else {
    console.log("Login page not active. Text snapshot:");
    console.log(allText.slice(0, 500));
  }
  
  const emailCount = await page.locator('input[type="email"]').count();
  if(emailCount > 0){
    console.log("Email field value :", await page.inputValue('input[type="email"]'));
    console.log("Password field    :", await page.inputValue('input[type="password"]'));
  }
  
  const banners = await page.locator('div[class*="bg-red"]').allTextContents();
  console.log("Banners found:", banners);
  
  console.log("=====================================================\n");

  await browser.close();
})();
