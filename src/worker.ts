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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" } });
    }
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

    const url = new URL(request.url);
    if (url.pathname === "/api/health") return json({ status: "ok", service: "lycoris-api" });

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
} satisfies ExportedHandler<Env>;
