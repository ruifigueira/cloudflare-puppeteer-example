# Playwright Browser Rendering

## Build Playwright CRX

To build and pack Playwright CRX for cloudflare `cloudflare` branch from `playwright-crx`:

```sh
git clone git@github.com:ruifigueira/playwright-crx.git
cd playwright-crx
git checkout cloudflare
npm ci
npm run build
npm pack
```

## Run the demo 

To run this demo:

- import `playwright-crx` npm pack generated above:

```sh
# Replace path accordingly
npm i -D file:../playwright-crx/playwright-crx-0.12.0.tgz
```

- edit `kv_namespaces` on `wrangler.jsonc` and set proper values for `id` and `preview_id`
- Run `wrangler`:

```sh
npx wrangler dev --remote
```

- press `b` to open the browser
