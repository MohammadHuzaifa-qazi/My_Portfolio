// Embeds all knowledge chunks into Supabase (Phase 2.2).
//
// Run from the project root:
//   source .env.local && npx tsx scripts/embed-knowledge.ts
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

async function getEmbedding(text: string): Promise<number[] | null> {
  const res = await fetch(`${supabaseUrl}/functions/v1/embed`, {
    method: "POST",
    headers,
    body: JSON.stringify({ input: text }),
  });
  if (!res.ok) {
    console.error(`  embed failed (${res.status}): ${await res.text()}`);
    return null;
  }
  const { embedding } = await res.json();
  return Array.isArray(embedding) && embedding.length > 0 ? embedding : null;
}

async function main() {
  // 1. Clear old chunks (fresh re-embed every run)
  // (REST API requires a filter on DELETE — id>0 matches all rows)
  const del = await fetch(`${supabaseUrl}/rest/v1/documents?id=gt.0`, { method: "DELETE", headers });
  if (!del.ok) {
    console.error(`Failed to clear old documents (${del.status}). Did you run the SQL setup?`);
    process.exit(1);
  }
  console.log(`Cleared old documents. Embedding ${KNOWLEDGE_CHUNKS.length} chunks...`);

  // 2. Embed each chunk and insert
  let embedded = 0;
  const failed: string[] = [];

  for (const chunk of KNOWLEDGE_CHUNKS) {
    const embedding = await getEmbedding(`${chunk.title}: ${chunk.content}`);
    if (!embedding) {
      failed.push(chunk.title);
      continue;
    }
    const insert = await fetch(`${supabaseUrl}/rest/v1/documents`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ title: chunk.title, content: chunk.content, embedding }),
    });
    if (!insert.ok) {
      console.error(`  insert failed (${insert.status}): ${await insert.text()}`);
      failed.push(chunk.title);
      continue;
    }
    embedded++;
    console.log(`  [${embedded}/${KNOWLEDGE_CHUNKS.length}] ${chunk.title}`);
  }

  console.log(`\nDone: ${embedded}/${KNOWLEDGE_CHUNKS.length} chunks embedded.`);
  if (failed.length > 0) {
    console.error(`Failed: ${failed.join(", ")}`);
    process.exit(1);
  }
}

main();
