// Temporary test: see which chunks RAG retrieves for a question (delete after use).
const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;
const question = process.argv[2] ?? "How many repositories do you have?";

async function main() {
  const embRes = await fetch(`${url}/functions/v1/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ input: question }),
  });
  const { embedding } = await embRes.json();

  const matchRes = await fetch(`${url}/rest/v1/rpc/match_documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ query_embedding: embedding, match_count: 4 }),
  });
  const rows = await matchRes.json();

  console.log(`Question: "${question}"`);
  console.log("Chunks RAG ne diye:");
  rows.forEach((r: { title: string; similarity: number }) =>
    console.log(`  ${r.similarity.toFixed(3)} → ${r.title}`)
  );

  // Check: kya koi chunk me "repositories" ka count hai?
  const hasRepoInfo = rows.some((r: { content: string }) =>
    /\b(repositor|repos)\b/i.test(r.content)
  );
  console.log(`\nKya retrieved chunks me repo COUNT hai? ${hasRepoInfo ? "HAAN" : "NAHI — knowledge gap!"}`);
}

main();
