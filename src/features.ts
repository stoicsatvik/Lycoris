export type Feature = {
  id: string;
  title: string;
  status: "available" | "prototype" | "planned" | "evidence_required";
  description: string;
  route: string | null;
};

export const FEATURES: Feature[] = [
  { id: "mission-overview", title: "Mission control overview", status: "available", description: "One place for map, environment, EVA, suit and uncertainty states.", route: null },
  { id: "mars-map-2d", title: "2D NASA Mars map", status: "available", description: "Direct NASA Mars Trek WMTS layers with revision-monitoring metadata.", route: "/api/maps/nasa-mars-trek" },
  { id: "terrain-3d", title: "3D terrain explorer", status: "planned", description: "Terrain visualization once a provenance-bound DEM and coordinate transform are selected.", route: null },
  { id: "atlas-route", title: "Atlas route and return reserve", status: "prototype", description: "Fail-closed route feasibility and a unified state model; no flight-route verdict.", route: null },
  { id: "eva-suit", title: "3D Mars-EVA suit", status: "prototype", description: "Editable Lycoris M1 visual concept plus virtual verification gates, not human-rated hardware.", route: null },
  { id: "life-support", title: "Oxygen, CO2, cooling, water and battery", status: "prototype", description: "Separate resource balances updated by evidence-qualified rates; unknown inputs abstain.", route: null },
  { id: "radiation", title: "Radiation and environment", status: "evidence_required", description: "Displays source-bound observations when ingested; never presents modeled dose as live crew telemetry.", route: "/api/observations" },
  { id: "solar-storm", title: "Solar-storm uncertainty rehearsal", status: "available", description: "Seeded training scenarios with official NOAA source linkage; not a forecast or authorization tool.", route: "/api/simulations/solar-storm?journey_day=1" },
  { id: "ai-assistant", title: "Evidence-grounded AI assistant", status: "planned", description: "Answers must cite catalogued sources and state uncertainty; it will not make medical or mission-authority decisions.", route: null },
  { id: "human-factors", title: "Human-factor registry", status: "prototype", description: "Candidate factor definitions mapped to state, control, environment, parameters and uncertainty.", route: null },
  { id: "dataset-provenance", title: "Dataset provenance and freshness", status: "available", description: "Source, hash, quality and ingestion status for every available data product.", route: "/api/datasets" },
  { id: "contingencies", title: "Emergency and turn-back rehearsal", status: "planned", description: "Scenario-based return, shelter and communications workflows governed by mission-approved rules.", route: null }
];

const escape = (value: string): string => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);

export const featurePage = (): Response => {
  const cards = FEATURES.map((feature) => "<article><p class=\"status " + feature.status + "\">" + feature.status.replace("_", " ") + "</p><h2>" + escape(feature.title) + "</h2><p>" + escape(feature.description) + "</p>" + (feature.route ? "<a href=\"" + feature.route + "\">Open data endpoint →</a>" : "<span>Interface in development</span>") + "</article>").join("");
  const html = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Lycoris | Mars mission planner</title><style>body{margin:0;background:#071014;color:#e7eff2;font:16px system-ui,sans-serif}main{max-width:1160px;margin:auto;padding:52px 24px}h1{font-size:clamp(2.3rem,7vw,5.5rem);margin:0;color:#f6fbfc}header p{max-width:70ch;color:#aabdc3;line-height:1.55}.notice{border-left:3px solid #fa8c2a;padding:14px 17px;background:#102027;margin:32px 0;color:#d5e1e5}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:15px}article{background:#102027;border:1px solid #29414a;border-radius:14px;padding:20px;min-height:172px}h2{font-size:1.15rem;margin:.4rem 0}article p{color:#b9c9ce;line-height:1.5}.status{text-transform:uppercase;letter-spacing:.08em;font-size:.68rem;font-weight:700}.available{color:#57d68d}.prototype{color:#ffbe55}.planned{color:#9bb4ff}.evidence_required{color:#ff7890}a{color:#91d7ff}span{color:#82969d;font-size:.9rem}</style></head><body><main><header><p class=\"status available\">Lycoris / Mars mission planning</p><h1>Explore. Simulate. Verify.</h1><p>A transparent research interface for Mars surface planning. Every capability shows whether it is live, virtual, planned, or awaiting calibrated evidence.</p></header><p class=\"notice\">Lycoris is a scientific prototype. It does not provide astronaut medical advice, real-time crew telemetry, operational forecasts, or flight certification.</p><section class=\"grid\">" + cards + "</section></main></body></html>";
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
};
