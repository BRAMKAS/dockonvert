/**
 * Local Cloudflare Worker that exposes D1 + R2 as REST APIs
 * for the Python FastAPI backend to consume during development.
 */

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for local dev
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ── D1 Routes ──
      if (path === "/d1/query" && request.method === "POST") {
        const { sql, params } = (await request.json()) as {
          sql: string;
          params?: unknown[];
        };
        const stmt = params ? env.DB.prepare(sql).bind(...params) : env.DB.prepare(sql);
        const result = await stmt.all();
        return Response.json(result, { headers: corsHeaders });
      }

      if (path === "/d1/execute" && request.method === "POST") {
        const { sql, params } = (await request.json()) as {
          sql: string;
          params?: unknown[];
        };
        const stmt = params ? env.DB.prepare(sql).bind(...params) : env.DB.prepare(sql);
        const result = await stmt.run();
        return Response.json(result, { headers: corsHeaders });
      }

      if (path === "/d1/batch" && request.method === "POST") {
        const { statements } = (await request.json()) as {
          statements: { sql: string; params?: unknown[] }[];
        };
        const stmts = statements.map((s) =>
          s.params ? env.DB.prepare(s.sql).bind(...s.params) : env.DB.prepare(s.sql)
        );
        const results = await env.DB.batch(stmts);
        return Response.json(results, { headers: corsHeaders });
      }

      // ── R2 Routes ──
      if (path.startsWith("/r2/") && request.method === "PUT") {
        const key = path.slice(4); // strip /r2/
        const body = await request.arrayBuffer();
        const contentType = request.headers.get("Content-Type") || "application/octet-stream";
        await env.BUCKET.put(key, body, {
          httpMetadata: { contentType },
        });
        return Response.json({ success: true, key }, { headers: corsHeaders });
      }

      if (path.startsWith("/r2/") && request.method === "GET") {
        const key = path.slice(4);
        const object = await env.BUCKET.get(key);
        if (!object) {
          return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
        }
        const headers = new Headers(corsHeaders);
        headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
        return new Response(object.body, { headers });
      }

      if (path.startsWith("/r2/") && request.method === "DELETE") {
        const key = path.slice(4);
        await env.BUCKET.delete(key);
        return Response.json({ success: true }, { headers: corsHeaders });
      }

      if (path === "/r2" && request.method === "GET") {
        const list = await env.BUCKET.list();
        return Response.json(
          { objects: list.objects.map((o) => ({ key: o.key, size: o.size })) },
          { headers: corsHeaders }
        );
      }

      // ── Health ──
      if (path === "/health") {
        return Response.json({ status: "ok", services: ["d1", "r2"] }, { headers: corsHeaders });
      }

      return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return Response.json({ error: message }, { status: 500, headers: corsHeaders });
    }
  },
};
