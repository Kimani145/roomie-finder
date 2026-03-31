import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Navigating to http://localhost:5173/login...");
  await page.goto('http://localhost:5173/login');
  
  // Wait for the email input
  await page.waitForSelector('input[type="email"]');
  console.log("Page loaded. Email field found.");

  // Type in the email
  await page.fill('input[type="email"]', 'jkimani145@students.tukenya.ac.ke');
  
  // Type in a random password
  await page.fill('input[type="password"]', 'stress-test-1234!!');

  console.log("Filled form. Submitting...");

  // Click the submit button
  await page.click('button[type="submit"]');

  // Wait a moment for Firebase to reject it and the alert to appear
  await page.waitForTimeout(2000);

  // Check if the AlertCircle shows up
  const alertText = await page.locator('.text-red-700').textContent().catch(() => null);
  console.log("Alert UI says:", alertText ? alertText.trim() : "No alert found!");

  // Check the email input value
  const emailVal = await page.inputValue('input[type="email"]');
  console.log("Email field value after error:", emailVal);

  // Check the password input value
  const passVal = await page.inputValue('input[type="password"]');
  console.log("Password field value after error:", passVal);

  await browser.close();
})();
