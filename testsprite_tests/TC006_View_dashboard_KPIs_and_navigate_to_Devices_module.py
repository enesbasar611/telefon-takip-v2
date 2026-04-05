import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:3000
        await page.goto("http://localhost:3000")
        
        # -> Fill the email field with example@gmail.com (TestSprite automated login), then fill password and submit the test login button.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div[2]/div[2]/div/div[3]/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('example@gmail.com')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div[2]/div[2]/div/div[3]/div/input[2]').nth(0)
        await asyncio.sleep(3); await elem.fill('password123')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/div[2]/div/div[3]/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Fill the TestSprite email and password fields and click the 'TestSprite Test Login' button, then wait for the dashboard to load so we can verify KPI content and navigate to /servis/liste.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div[2]/div[2]/div/div[3]/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('example@gmail.com')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div[2]/div[2]/div/div[3]/div/input[2]').nth(0)
        await asyncio.sleep(3); await elem.fill('password123')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div[2]/div[2]/div/div[3]/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Navigate directly to /dashboard and check whether the dashboard KPIs are visible. If dashboard loads, then navigate to /servis/liste to verify the device list.
        await page.goto("http://localhost:3000/dashboard")
        
        # -> Navigate directly to /dashboard to see if the dashboard page and KPIs load without login, then verify KPI content and navigate to Devices module (/servis/liste).
        await page.goto("http://localhost:3000/dashboard")
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        assert await frame.locator("xpath=//*[contains(., 'Müşteriler')]").nth(0).is_visible(), "The dashboard should show the Müşteriler navigation link so users can access customers.",
        assert await frame.locator("xpath=//*[contains(., 'Satış')]").nth(0).is_visible(), "The dashboard should show the Satış navigation link so users can access the POS.",
        assert await frame.locator("xpath=//*[contains(., 'Servis')]").nth(0).is_visible(), "The dashboard should show the Servis navigation link so users can access devices.",
        assert await frame.locator("xpath=//*[contains(., 'Stok')]").nth(0).is_visible(), "The dashboard should show the Stok navigation link so users can access inventory.",
        current_url = await frame.evaluate("() => window.location.href")
        assert '/servis/liste' in current_url, "The page should have navigated to /servis/liste after opening the Devices module.",
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    