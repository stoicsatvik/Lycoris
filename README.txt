LYCORIS
-------

Lycoris is a Mars mission-planning and training simulator for Space Apps 2026.
Plan a traverse across Jezero Crater, compare Walk and Rover estimates, and
replay the route in the Helmet HUD. Experimental Claire explores a hypothesis
about how temperature relates to radiation estimates.

Live site: https://lycoris.buildwithsatvik.workers.dev/

QUICK START
-----------

1. Install Node.js and npm.
2. Run npm ci from the repository root.
3. Run npm run dev and open the local address Wrangler prints.

To initialize the local dataset catalog, run npm run db:migrate:local.
The Atlas companion uses GROQ_API_KEY as a Worker secret. Keep credentials
out of Git.

PROJECT FILES
-------------

web/                 Website, simulation modules, terrain, images, and media
src/site-worker.ts   Website routing, media streaming, and Atlas companion
src/worker.ts        Dataset catalog API and scheduled map checks
wrangler.jsonc       Cloudflare Worker, static assets, and D1 configuration
README.md            Research architecture and catalog API details

DEPLOYMENT
----------

The Cloudflare configuration serves the website from web/ and keeps the
catalog API under /api/. Run npx wrangler deploy --dry-run to validate the
bundle. To deploy manually, sign in to the Cloudflare account that manages
the Lycoris Worker, then run npm run deploy from the repository root.

MODEL LIMITS
------------

The simulation is for training and research. The Helmet HUD shows modeled
values. Rover mode uses an assumed pace and occupant oxygen-use proxy.
Vehicle power, range, traction, and cabin shielding are unmodeled.
Experimental Claire is unvalidated. Route outcomes provide no operational
approval.
