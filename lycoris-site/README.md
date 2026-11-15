# Lycoris

A static site with no build step: plain HTML, CSS and JavaScript modules. Upload the folder as it is.

## Pages
| Address | Page |
|---|---|
| `#/map` | Mission map: route planner, slope-aware route over the CTX elevation model, headline numbers with uncertainty, route assessment |
| `#/craters` | Crater ahead: geometry, cross-section, across vs around compared with the engine |
| `#/journey` | Journey view: plays the simulated walk over a Perseverance photo, with instruments |
| `#/calc/<record>` | Calculation records: worked calculation and an AI explanation from the Atlas guide |
| `#/claire-gate`, `#/claire` | Experimental Claire: entrance warning, then standard and Claire radiation models side by side |
| `#/data` | Data sources and every engine default, with provenance |

## Run locally
Browsers block JavaScript modules opened straight from disk, so serve the folder, for example:

```bash
npx serve .
```

or open it in VS Code with the Live Server extension.

## Deploy
**Cloudflare Pages (recommended):**
1. Dashboard → Workers & Pages → Create → Pages → Upload assets.
2. Upload this folder. No build command and no output directory are needed.
3. It is served over HTTPS with a `*.pages.dev` address; add your own domain under Custom domains.

**GoDaddy (cPanel hosting):**
1. File Manager → `public_html` (or a subfolder).
2. Upload the contents of this folder, keeping the `css`, `js` and `img` folders.

Both serve `.js` files with the right content type by default, which modules need.

## AI guide
The Explanation tab calls `https://mars-atlas-backend.vercel.app/api/chat` (set in `js/app.js` as `GUIDE_API`). If that backend is offline or blocks your domain, the page says so and the worked calculation still shows. The API key stays on the backend, never in this site.

## Where things come from
- `js/engine/`: the Mars Atlas calculation engine (same as `atlas-engine/` in the Lycoris PR, with the crew-oxygen fix below).
- `js/terrain/`: routing, terrain grid, places and crater catalogue copied from `Site stuff/src`, with the JSON files turned into JS modules.
- `css/atlas.css`: the design tokens from the Mars Atlas UI canvas.
- `img/belva-rim-sol772.jpg`: Perseverance Mastcam-Z raw image, sol 772 (NASA/JPL-Caltech/ASU).

## Known limits
- Rover mode is shown but disabled: the engine only has walking physiology.
- The crater comparison uses an idealised bowl; the route on the map follows the real terrain.
- Planning estimates only, not flight-certified guidance.
