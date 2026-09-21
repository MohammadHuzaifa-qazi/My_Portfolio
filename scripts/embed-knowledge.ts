// Embeds all knowledge chunks into Supabase (Phase 2.2).
//
// Run from the project root:
//   set -a; source .env.local; set +a; npx tsx scripts/embed-knowledge.ts
//
// Re-run this whenever you edit KNOWLEDGE_CHUNKS in lib/chat/knowledge.ts.

import { KNOWLEDGE_CHUNKS } from "../lib/chat/knowledge";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY — source .env.local first.");
  process.exit(1);
}

const supabaseUrl: string = url;
const supabaseKey: string = key;

const headers = {
  "Content-Type": "application/json",
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The Edge Function occasionally answers 500 on a cold start or when hit in a
// tight loop, so retry with backoff instead of dropping the chunk on the floor.
async function getEmbedding(text: string): Promise<number[] | null> {
  const MAX_ATTEMPTS = 4;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/embed`, {
        method: "POST",
        headers,
        body: JSON.stringify({ input: text }),
      });

      if (res.ok) {
        const { embedding } = await res.json();
        if (Array.isArray(embedding) && embedding.length > 0) return embedding;
        console.error(`  embed returned no vector (attempt ${attempt})`);
      } else {
        console.error(`  embed failed (${res.status}) on attempt ${attempt}`);
      }
    } catch (error) {
      console.error(`  embed request threw on attempt ${attempt}:`, error);
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(600 * 2 ** (attempt - 1)); // 600ms, 1.2s, 2.4s
    }
  }

  return null;
}

async function main() {
  // 1. Embed everything BEFORE touching the database. If any chunk fails we
  //    abort with the old data still intact, rather than leaving a half-filled
  //    table (which is what happens when delete-then-insert goes wrong midway).
  console.log(`Embedding ${KNOWLEDGE_CHUNKS.length} chunks...`);

  const rows: Array<{ title: string; content: string; embedding: number[] }> = [];
  const failed: string[] = [];

  for (const chunk of KNOWLEDGE_CHUNKS) {
    const embedding = await getEmbedding(`${chunk.title}: ${chunk.content}`);
    if (!embedding) {
      failed.push(chunk.title);
      continue;
    }
    rows.push({ title: chunk.title, content: chunk.content, embedding });
    console.log(`  [${rows.length}/${KNOWLEDGE_CHUNKS.length}] ${chunk.title}`);
    await sleep(200); // be gentle with the Edge Function
  }

  if (failed.length > 0) {
    console.error(
      `\nAborting — ${failed.length} chunk(s) could not be embedded: ${failed.join(", ")}`
    );
    console.error("Nothing was written, so the existing knowledge base is untouched. Re-run to retry.");
    process.exit(1);
  }

  // 2. All embeddings in hand — now swap them in.
  //    (REST API requires a filter on DELETE — id>0 matches all rows)
  const del = await fetch(`${supabaseUrl}/rest/v1/documents?id=gt.0`, {
    method: "DELETE",
    headers,
  });
  if (!del.ok) {
    console.error(`Failed to clear old documents (${del.status}). Did you run the SQL setup?`);
    process.exit(1);
  }

  const insert = await fetch(`${supabaseUrl}/rest/v1/documents`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!insert.ok) {
    console.error(`Insert failed (${insert.status}): ${await insert.text()}`);
    console.error("WARNING: old rows were deleted but the new ones did not land. Re-run this script.");
    process.exit(1);
  }

  console.log(`\nDone: all ${rows.length} chunks embedded and stored.`);
}

main();
