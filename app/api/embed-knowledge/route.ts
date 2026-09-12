import { NextResponse } from "next/server";
import { KNOWLEDGE_CHUNKS } from "@/lib/chat/knowledge";

// One-time (re)embedding endpoint: embeds all knowledge chunks and
// stores them in Supabase. Run it locally after editing knowledge.ts:
//
//   curl -X POST http://localhost:3000/api/embed-knowledge -H "x-admin-key: <EMBED_ADMIN_KEY>"
//
// Protected by the x-admin-key header so it can never be triggered by visitors.

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export async function POST(request: Request) {
  const adminKey = process.env.EMBED_ADMIN_KEY;
  if (!adminKey || request.headers.get("x-admin-key") !== adminKey) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const config = supabaseConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Supabase is not configured — set SUPABASE_URL and SUPABASE_SERVICE_KEY." },
      { status: 500 }
    );
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
  };

  // 1. Clear old chunks (fresh re-embed on every run)
  // (REST API requires a filter on DELETE — id>0 matches all rows)
  try {
    const del = await fetch(`${config.url}/rest/v1/documents?id=gt.0`, {
      method: "DELETE",
      headers,
    });
    if (!del.ok) {
      return NextResponse.json(
        { error: `Failed to clear old documents (${del.status}). Did you run the SQL setup?` },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Could not reach Supabase (delete)." }, { status: 502 });
  }

  // 2. Embed each chunk via the Edge Function, then insert
  let embedded = 0;
  const failed: string[] = [];

  for (const chunk of KNOWLEDGE_CHUNKS) {
    try {
      const embedRes = await fetch(`${config.url}/functions/v1/embed`, {
        method: "POST",
        headers,
        body: JSON.stringify({ input: `${chunk.title}: ${chunk.content}` }),
      });
      if (!embedRes.ok) {
        failed.push(chunk.title);
        continue;
      }
      const { embedding } = await embedRes.json();
      if (!Array.isArray(embedding) || embedding.length === 0) {
        failed.push(chunk.title);
        continue;
      }

      const insertRes = await fetch(`${config.url}/rest/v1/documents`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ title: chunk.title, content: chunk.content, embedding }),
      });
      if (!insertRes.ok) {
        failed.push(chunk.title);
        continue;
      }
      embedded++;
    } catch {
      failed.push(chunk.title);
    }
  }

  return NextResponse.json({
    total: KNOWLEDGE_CHUNKS.length,
    embedded,
    failed,
  });
}
