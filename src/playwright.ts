import { crx, launch } from "playwright-crx";
import type { Fetcher, KVNamespace } from '@cloudflare/workers-types';

interface Env {
  MYBROWSER: Fetcher;
  BROWSER_KV_DEMO: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env) {
    const { searchParams, pathname } = new URL(request.url);
    const extension = request.url.match(/\.(zip|png)$/)?.[1];
    if (extension) {
      const cached = await env.BROWSER_KV_DEMO.get(pathname, { type: "arrayBuffer" });
      console.log(`Cache hit for ${request.url}: ${!!cached}`);
      return cached ? new Response(cached, {
        headers: {
          "Content-Type": extension === 'zip' ? "application/zip" : "image/png",
          "Access-Control-Allow-Origin": "*",
        },
      }) : new Response('Not Found', { status: 404 });
    }

    const todos = searchParams.getAll('todo');
    const type = searchParams.get('type');
    const trace = type === 'trace';

    const browser = await launch(env.MYBROWSER);
    const page = await browser.newPage();
    
    if (trace)
      await page.context().tracing.start({ screenshots: true, snapshots: true });

    await page.goto('https://demo.playwright.dev/todomvc');

    const TODO_ITEMS = todos.length > 0 ? todos : [
      'buy some cheese',
      'feed the cat',
      'book a doctors appointment'
    ];

    const newTodo = page.getByPlaceholder('What needs to be done?');
    for (const item of TODO_ITEMS) {
      await newTodo.fill(item);
      await newTodo.press('Enter');
    }

    const timestamp = new Date().toISOString().replace(/T/, '-').replace(/[:.]/g, '').split('.')[0];
    if (trace) {
      await page.context().tracing.stop({ path: '/tmp/trace.zip' });
      // await page.close();

      const data = crx.fs.readFileSync('/tmp/trace.zip') as Buffer;

      const path = `/api/trace-${timestamp}.zip`;
      // @ts-ignore
      await env.BROWSER_KV_DEMO.put(path, data, { expirationTtl: 60 });

      return Response.json({ path });
    } else {
      const img = await page.screenshot();
      
      // debug.enable('pw:*');
      // await browser.close();
      // debug.disable();

      const path = `/api/screenshot-${timestamp}.png`;
      console.log(`Caching ${path}`);
      // @ts-ignore
      await env.BROWSER_KV_DEMO.put(path, img, { expirationTtl: 60 });

      return Response.json({ path });
    }
  },
};
