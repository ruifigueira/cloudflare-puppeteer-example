import { crx, launch } from "playwright-crx";
import type { Fetcher, KVNamespace } from '@cloudflare/workers-types';

interface Env {
  MYBROWSER: Fetcher;
  BROWSER_KV_DEMO: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env) {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') ?? '';
    const trace = searchParams.has('trace');

    const browser = await launch(env.MYBROWSER);
    const page = await browser.newPage();
    
    if (trace)
      await page.context().tracing.start({ screenshots: true, snapshots: true });

    await page.goto(`https://azuleja.azulpop.pt/azulejo`);

    await page.locator('textarea').fill(text);
    await page.locator('textarea').blur();
    
    const fontSizeLocator = page.getByLabel('Tamanho');
    
    let fontSize = 36;
    do {
      await fontSizeLocator.fill(`${fontSize}`);
      await fontSizeLocator.blur();

      if (await fontSizeLocator.evaluate((e: HTMLInputElement) => parseInt(e.value) <= parseInt(e.min)))
        break;
      
      fontSize -= 2;
      await page.waitForTimeout(50);
    } while (await page.locator('.tile-body-wrapper').evaluate(e => [...e.children].some(c => c.scrollWidth > e.clientWidth || c.offsetTop + c.scrollHeight > e.offsetTop + e.clientHeight)));

    // just to ensure everything goes right
    await page.waitForTimeout(100);

    await page.getByRole('button', { name: 'Comprar' }).click();
    const hash = await page.locator('#hash-copy').inputValue();

    console.log(`generated tile with hash ${hash}`);

    if (trace) {
      await page.context().tracing.stop({ path: '/tmp/trace.zip' });
      // await page.close();

      const data = crx.fs.readFileSync('/tmp/trace.zip') as Buffer;
      return new Response(data, {
        headers: {
          "Content-Type": "application/zip",
        },
      });
    } else {
      return Response.redirect(`https://azuleja.azulpop.pt/p/images/${hash}.png`, 302);
    }
  },
};
