// Supabase Edge Function: embed
//
// Deployed in the Supabase dashboard (Edge Functions -> embed).
// This local copy is the source of truth — copy from here into the
// dashboard editor if it ever needs redeploying.
//
// Takes { input: "some text" } and returns { embedding: [0.1, ...] }
// using the gte-small model (384 dimensions), free, runs on Supabase.

const session = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  const body = await req.json();
  const input = body.input;

  if (typeof input !== "string" || input.length === 0) {
    return new Response(JSON.stringify({ error: "input required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const embedding = await session.run(input, {
    mean_pool: true,
    normalize: true,
  });

  return new Response(JSON.stringify({ embedding }), {
    headers: { "Content-Type": "application/json" },
  });
});
