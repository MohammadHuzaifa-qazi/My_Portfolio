import { NextResponse } from "next/server";
import { PERSONA_PROMPT, FALLBACK_CONTEXT } from "@/lib/chat/knowledge";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";
const MAX_HISTORY = 12; // last N messages sent to Groq — keeps free-tier usage low
const MATCH_COUNT = 4; // top N knowledge chunks retrieved per question

type ChatMessage = { role: "user" | "assistant"; content: string };

// --- RAG helpers (Supabase + Edge Function embeddings) ---

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

// Call the Supabase Edge Function to get the question's embedding (gte-small, 384 dims)
async function getEmbedding(text: string): Promise<number[] | null> {
  const config = supabaseConfig();
  if (!config) return null;

  try {
    const res = await fetch(`${config.url}/functions/v1/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify({ input: text }),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const embedding = data.embedding;
    if (Array.isArray(embedding) && embedding.length > 0) {
      return embedding;
    }
    return null;
  } catch {
    return null;
  }
}

// Vector similarity search: find the most relevant knowledge chunks
async function retrieveContext(question: string): Promise<string | null> {
  const config = supabaseConfig();
  if (!config) return null;

  const queryEmbedding = await getEmbedding(question);
  if (!queryEmbedding) return null;

  try {
    const res = await fetch(`${config.url}/rest/v1/rpc/match_documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify({
        query_embedding: queryEmbedding,
        match_count: MATCH_COUNT,
      }),
    });
    if (!res.ok) return null;

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    console.log(
      "[chat] RAG retrieved:",
      rows.map((row: { title?: string }) => row.title).join(" | ")
    );

    return rows
      .map((row: { title?: string; content?: string }) => {
        const title = row.title ? `[${row.title}] ` : "";
        return `- ${title}${row.content ?? ""}`;
      })
      .join("\n");
  } catch {
    return null;
  }
}

// --- Main endpoint ---

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Chat is not configured yet — GROQ_API_KEY is missing." },
      { status: 500 }
    );
  }

  let history: ChatMessage[];
  try {
    const body = await request.json();
    history = body.messages;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!Array.isArray(history) || history.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  // Sanitize: keep only valid user/assistant messages, cap length
  const messages = history
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (messages.length === 0) {
    return NextResponse.json({ error: "No valid messages." }, { status: 400 });
  }

  // RAG: retrieve relevant chunks for the latest question.
  // Falls back to the full knowledge base if Supabase/embeddings are unavailable.
  const lastQuestion = [...messages].reverse().find((m) => m.role === "user");
  const context = (await retrieveContext(lastQuestion?.content ?? "")) ?? FALLBACK_CONTEXT;
  if (context === FALLBACK_CONTEXT) {
    console.log("[chat] RAG unavailable — using full knowledge fallback");
  }

  const systemPrompt = `${PERSONA_PROMPT}

CONTEXT — About Mohammad Huzaifa:
${context}`;

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 500,
        temperature: 0.4,
      }),
    });

    if (!groqRes.ok) {
      console.error("Groq API error:", groqRes.status, await groqRes.text());
      return NextResponse.json(
        { error: "The assistant is unavailable right now. Please try again in a moment." },
        { status: 502 }
      );
    }

    const data = await groqRes.json();
    const reply: string | undefined = data.choices?.[0]?.message?.content;

    if (!reply) {
      return NextResponse.json(
        { error: "The assistant is unavailable right now. Please try again in a moment." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply, usedRag: context !== FALLBACK_CONTEXT });
  } catch {
    return NextResponse.json(
      { error: "Network error — please try again in a moment." },
      { status: 500 }
    );
  }
}
