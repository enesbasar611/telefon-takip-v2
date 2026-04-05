const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

async function run() {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            userDataDir: './.puppeteer_edevlet_session',
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-infobars"
            ],
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        await page.goto("https://www.turkiye.gov.tr/imei-sorgulama", { waitUntil: "networkidle2", timeout: 60000 });
        await page.waitForSelector("#txtImei", { timeout: 10000 });
        await page.type("#txtImei", "359364538037117", { delay: 100 });

        await page.click('.submitButton');

        console.log("Waiting 3 seconds...");
        await new Promise(r => setTimeout(r, 3000));

        // Take a screenshot of what happens 3 seconds after clicking submit
        await page.screenshot({ path: "C:\\Users\\PC\\.gemini\\antigravity\\brain\\058bd189-8290-41e4-ae7c-825e92a76354\\test_after_click.png" });
        const html = await page.content();
        const fs = require('fs');
        fs.writeFileSync("C:\\Users\\PC\\.gemini\\antigravity\\brain\\058bd189-8290-41e4-ae7c-825e92a76354\\test_after_click.html", html);

        console.log("Check artifacts.");

    } catch (error) {
        console.error("Test Error:", error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
run();
