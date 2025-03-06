import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request, env) {
    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();
    await page.goto('https://demo.playwright.dev/todomvc');
    const TODO_ITEMS = [
      'buy some cheese',
      'feed the cat',
      'book a doctors appointment'
    ];
  
    const newTodo = page.locator('input[placeholder="What needs to be done?"]');

    for (const item of TODO_ITEMS) {
      await newTodo.fill(item);
      await page.keyboard.press('Enter');
    }

    const img = await page.screenshot();
    await browser.close();
    return new Response(img, {
      headers: {
        "content-type": "image/png",
      },
    });
  },
};