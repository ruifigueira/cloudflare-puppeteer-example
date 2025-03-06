import pw from './playwright';
import pptt from './puppeteer';
import azuleja from './azuleja';

export default {
  async fetch(request, env) {
    const { searchParams, pathname } = new URL(request.url);

    if (pathname.startsWith("/api/")) {
      let isPuppeteer = searchParams.get('pptt');
      console.log(`Rendering with ${isPuppeteer ? 'Puppeteer' : 'Playwright'}`);
      return isPuppeteer ? await pptt.fetch(request, env) : await pw.fetch(request, env);
    } else if (pathname.startsWith("/azuleja")) {
      return await azuleja.fetch(request, env);
    }

    return env.ASSETS?.fetch(request) ?? new Response('Not Found', { status: 404 });
  }
};