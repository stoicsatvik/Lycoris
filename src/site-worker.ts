import catalog from "./worker";

type Env = Parameters<typeof catalog.fetch>[1] & {
  LY_MEDIA: Fetcher;
  GROQ_API_KEY?: string;
};

const json = (body: object, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

async function atlas(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!env.GROQ_API_KEY) return json({ error: "Atlas is not configured" }, 503);

  try {
    const { facts = {} } = await request.json<{ facts?: object }>();
    const prompt = "You are Atlas, a concise Mars EVA research-simulation companion. Use only these supplied model facts. Address the requested mode or question if supplied. Give two short sentences: one immediate action, one science or route observation. Never claim live telemetry, live solar forecasting, certification, medical advice, or operational authority. If solar state is simulated, call it a training drill. Facts: " + JSON.stringify(facts);
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.GROQ_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        temperature: .25,
        max_tokens: 180,
        messages: [
          { role: "system", content: "Answer in exactly two short sentences without showing reasoning." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!response.ok) return json({ error: "Atlas is temporarily unavailable" }, 502);
    const data = await response.json<{ choices?: Array<{ message?: { content?: string } }> }>();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return reply ? json({ reply }) : json({ error: "Atlas is temporarily unavailable" }, 502);
  } catch {
    return json({ error: "Atlas is temporarily unavailable" }, 502);
  }
}

async function media(request: Request, assets: Fetcher): Promise<Response> {
  const asset = await assets.fetch(request);
  const match = /^bytes=(\d*)-(\d*)$/i.exec(request.headers.get("Range") ?? "");
  if (request.method !== "GET" || asset.status !== 200 || !match || (!match[1] && !match[2])) return asset;

  const bytes = await asset.arrayBuffer();
  const size = bytes.byteLength;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  const headers = new Headers(asset.headers);
  headers.set("Accept-Ranges", "bytes");
  headers.delete("Content-Encoding");
  if (start >= size || start > end) {
    headers.set("Content-Range", `bytes */${size}`);
    headers.set("Content-Length", "0");
    return new Response(null, { status: 416, headers });
  }
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/atlas") return atlas(request, env);
    if (pathname === "/img/curiosity-walk-loop.mp4" || pathname.startsWith("/audio/")) {
      return media(request, env.LY_MEDIA);
    }
    return catalog.fetch(request, env);
  },
  scheduled: catalog.scheduled,
} satisfies ExportedHandler<Env>;
