export interface Env {
  DB: D1Database;
}

type Dataset = {
  id: string;
  title: string;
  source_family: string;
  source_product_id: string | null;
  source_url: string | null;
  spatial_context: string;
  temporal_context: string;
  native_unit: string | null;
  evidence_status: string;
  ingestion_status: string;
  repository_path: string;
  sha256: string | null;
  row_count: number | null;
  quality_notes: string;
};

type MapSource = {
  id: string;
  title: string;
  capabilities_url: string;
  coordinate_reference: string;
};

type MapCheck = {
  id: string;
  capabilities_url: string;
  etag: string | null;
  last_modified: string | null;
  status: number;
  last_checked_at: string;
  changed_at: string;
};

const NASA_MARS_TREK: MapSource[] = [
  {
    id: "mars-trek-global-mola-hillshade",
    title: "MGS MOLA global color hillshade",
    capabilities_url: "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/WMTSCapabilities.xml",
    coordinate_reference: "urn:ogc:def:crs:EPSG::104905",
  },
  {
    id: "mars-trek-jezero-hirise-controlled",
    title: "MRO HiRISE Jezero controlled mosaic",
    capabilities_url: "https://trek.nasa.gov/tiles/Mars/EQ/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd/1.0.0/WMTSCapabilities.xml",
    coordinate_reference: "Mars equirectangular, as declared by the upstream WMTS capabilities document",
  },
];

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: {
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
  },
});

const integer = (value: string | null, fallback: number, maximum: number): number | null => {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  return Math.min(Number(value), maximum);
};

const refreshMapSource = async (env: Env, source: MapSource): Promise<void> => {
  const checkedAt = new Date().toISOString();
  const previous = await env.DB.prepare(
    "SELECT id, capabilities_url, etag, last_modified, status, last_checked_at, changed_at FROM map_source_checks WHERE id = ?",
  ).bind(source.id).first<MapCheck>();
  let etag: string | null = null;
  let lastModified: string | null = null;
  let status = 0;
  try {
    const response = await fetch(source.capabilities_url, { method: "HEAD" });
    status = response.status;
    etag = response.headers.get("etag");
    lastModified = response.headers.get("last-modified");
  } catch {
    status = 0;
  }
  const unchanged = previous && previous.etag === etag && previous.last_modified === lastModified && previous.status === status;
  const changedAt = unchanged ? previous.changed_at : checkedAt;
  await env.DB.prepare(
    "INSERT INTO map_source_checks (id, title, capabilities_url, etag, last_modified, status, last_checked_at, changed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, capabilities_url = excluded.capabilities_url, etag = excluded.etag, last_modified = excluded.last_modified, status = excluded.status, last_checked_at = excluded.last_checked_at, changed_at = excluded.changed_at",
  ).bind(source.id, source.title, source.capabilities_url, etag, lastModified, status, checkedAt, changedAt).run();
};

const refreshMapSources = (env: Env) => Promise.all(NASA_MARS_TREK.map((source) => refreshMapSource(env, source)));

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" } });
    }
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

    const url = new URL(request.url);
    if (url.pathname === "/api/health") return json({ status: "ok", service: "lycoris-api" });

    if (url.pathname === "/api/maps/nasa-mars-trek") {
      const { results } = await env.DB.prepare(
        "SELECT id, capabilities_url, etag, last_modified, status, last_checked_at, changed_at FROM map_source_checks ORDER BY id",
      ).all<MapCheck>();
      const checks = new Map(results.map((check) => [check.id, check]));
      return json({
        provider: "NASA Mars Trek",
        delivery: "Use each upstream WMTS capabilities URL directly in the map client. Tiles are never mirrored by Lycoris, so upstream NASA tile updates appear without a local data-copy cycle.",
        monitor: "Lycoris checks each capabilities document with HEAD every six hours and records its ETag/Last-Modified revision metadata.",
        layers: NASA_MARS_TREK.map((source) => ({ ...source, sync: checks.get(source.id) ?? null })),
      });
    }

    if (url.pathname === "/api/datasets") {
      const { results } = await env.DB.prepare(
        "SELECT id, title, source_family, source_product_id, source_url, spatial_context, temporal_context, native_unit, evidence_status, ingestion_status, repository_path, sha256, row_count, quality_notes FROM dataset_products ORDER BY id",
      ).all<Dataset>();
      return json({ datasets: results });
    }

    const datasetMatch = /^\/api\/datasets\/([^/]+)$/.exec(url.pathname);
    if (datasetMatch) {
      const dataset = await env.DB.prepare(
        "SELECT id, title, source_family, source_product_id, source_url, spatial_context, temporal_context, native_unit, evidence_status, ingestion_status, repository_path, sha256, row_count, quality_notes FROM dataset_products WHERE id = ?",
      ).bind(decodeURIComponent(datasetMatch[1])).first<Dataset>();
      return dataset ? json({ dataset }) : json({ error: "dataset_not_found" }, 404);
    }

    if (url.pathname === "/api/observations") {
      const datasetId = url.searchParams.get("dataset_id");
      const sol = integer(url.searchParams.get("sol"), -1, 10_000);
      const limit = integer(url.searchParams.get("limit"), 100, 500);
      if (!datasetId || sol === null || limit === null || sol < -1) return json({ error: "invalid_query" }, 400);
      const statement = sol === -1
        ? env.DB.prepare("SELECT sol, lmst_hours, observed_at_utc, dose_b_ugy_h, dose_e_ugy_h, pressure_pa, air_temperature_k, quality_flag, source_row FROM environment_observations WHERE dataset_id = ? ORDER BY source_row LIMIT ?").bind(datasetId, limit)
        : env.DB.prepare("SELECT sol, lmst_hours, observed_at_utc, dose_b_ugy_h, dose_e_ugy_h, pressure_pa, air_temperature_k, quality_flag, source_row FROM environment_observations WHERE dataset_id = ? AND sol = ? ORDER BY source_row LIMIT ?").bind(datasetId, sol, limit);
      const { results } = await statement.all();
      return json({ dataset_id: datasetId, observations: results });
    }

    return json({ error: "not_found" }, 404);
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refreshMapSources(env));
  },
} satisfies ExportedHandler<Env>;
