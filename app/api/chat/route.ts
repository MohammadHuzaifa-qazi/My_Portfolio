import { NextResponse } from "next/server";
import { PERSONA_PROMPT, FALLBACK_CONTEXT } from "@/lib/chat/knowledge";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";
const MAX_HISTORY = 12; // last N messages sent to Groq — keeps free-tier usage low
const MATCH_COUNT = 4; // top N knowledge chunks retrieved per search

type ChatMessage = { role: "user" | "assistant"; content: string };

// The agent's only tool: vector search over Huzaifa's knowledge base.
const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_portfolio_knowledge",
      description:
        "Search Huzaifa's portfolio knowledge base (resume, skills, projects, achievements, hackathons, GitHub, contact). Use for ANY question about Huzaifa.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "What to search for, e.g. 'projects built' or 'education' or 'skills'",
          },
        },
        required: ["query"],
      },
    },
  },
];

// --- Knowledge search (Supabase pgvector + Edge Function embeddings) ---

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

// Call the Supabase Edge Function to get text's embedding (gte-small, 384 dims)
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
    return Array.isArray(embedding) && embedding.length > 0 ? embedding : null;
  } catch {
    return null;
  }
}

// The tool's implementation. Falls back to the full knowledge base if
// Supabase/embeddings are unavailable — the chatbot never dies.
async function searchKnowledge(query: string): Promise<string> {
  const config = supabaseConfig();
  if (!config) return FALLBACK_CONTEXT;

  const queryEmbedding = await getEmbedding(query);
  if (!queryEmbedding) return FALLBACK_CONTEXT;

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
    if (!res.ok) return FALLBACK_CONTEXT;

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return FALLBACK_CONTEXT;

    console.log(
      "[chat] tool search:",
      rows.map((row: { title?: string }) => row.title).join(" | ")
    );
    return rows
      .map((row: { title?: string; content?: string }) => {
        const title = row.title ? `[${row.title}] ` : "";
        return `- ${title}${row.content ?? ""}`;
      })
      .join("\n");
  } catch {
    return FALLBACK_CONTEXT;
  }
}

// --- Best-effort abuse protection -------------------------------------------
// In-memory sliding window, keyed by client IP. On serverless this is
// per-instance and resets on a cold start, so it raises the cost of casual
// abuse rather than stopping a determined attacker — a durable limiter would
// need Redis/KV. Without any limiter one script can drain the Groq free tier
// and take the assistant offline for real visitors.
const RATE_LIMIT = 10; // requests…
const RATE_WINDOW_MS = 60_000; // …per minute, per IP
const hits = new Map<string, number[]>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);

  if (recent.length >= RATE_LIMIT) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);

  // Opportunistic sweep so the map can't grow without bound.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

// --- Main endpoint: agentic flow with streaming response ---

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Chat is not configured yet — GROQ_API_KEY is missing." },
      { status: 500 }
    );
  }

  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "That's a lot of questions! Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } }
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

  const groqHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  const agentMessages: Array<Record<string, unknown>> = [
    { role: "system", content: PERSONA_PROMPT },
    ...messages,
  ];

  // --- Agent decision phase: should the tool be used? ---
  let usedRag = false;
  let directReply: string | null = null;

  try {
    const decisionRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: groqHeaders,
      body: JSON.stringify({
        model: MODEL,
        messages: agentMessages,
        tools: TOOLS,
        tool_choice: "auto",
        max_tokens: 400,
        temperature: 0.4,
      }),
    });

    if (!decisionRes.ok) {
      console.error("Groq decision error:", decisionRes.status, await decisionRes.text());
      return NextResponse.json(
        { error: "The assistant is unavailable right now. Please try again in a moment." },
        { status: 502 }
      );
    }

    const decision = await decisionRes.json();
    const choice = decision.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;

    if (Array.isArray(toolCalls) && toolCalls.length > 0) {
      // The agent wants to search — run the tool(s), then answer with a streaming call
      agentMessages.push(choice.message);

      for (const toolCall of toolCalls) {
        let result: string;
        try {
          const args = JSON.parse(toolCall.function?.arguments || "{}");
          result = await searchKnowledge(String(args.query ?? messages.at(-1)?.content ?? ""));
        } catch {
          result = await searchKnowledge(messages.at(-1)?.content ?? "");
        }
        if (result !== FALLBACK_CONTEXT) usedRag = true;
        agentMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }
      console.log("[chat] agent used search tool — answering with RAG context");
    } else {
      // No tool needed (greeting / general chat) — reply directly, whole message
      const reply: string | undefined = choice?.message?.content;
      if (!reply) {
        return NextResponse.json(
          { error: "The assistant is unavailable right now. Please try again in a moment." },
          { status: 502 }
        );
      }
      directReply = reply;
    }
  } catch {
    return NextResponse.json(
      { error: "Network error — please try again in a moment." },
      { status: 500 }
    );
  }

  if (directReply !== null) {
    return new Response(directReply, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Used-Rag": "0",
      },
    });
  }

  // --- Streaming phase: stream the final answer word-by-word ---
  try {
    const streamRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: groqHeaders,
      body: JSON.stringify({
        model: MODEL,
        messages: agentMessages,
        max_tokens: 500,
        temperature: 0.4,
        stream: true,
      }),
    });

    if (!streamRes.ok || !streamRes.body) {
      console.error("Groq stream error:", streamRes.status, await streamRes.text());
      return NextResponse.json(
        { error: "The assistant is unavailable right now. Please try again in a moment." },
        { status: 502 }
      );
    }

    // Parse Groq's SSE and forward plain text chunks to the client
    const groqReader = streamRes.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await groqReader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const json = JSON.parse(payload);
                const delta: string | undefined = json.choices?.[0]?.delta?.content;
                if (delta) controller.enqueue(encoder.encode(delta));
              } catch {
                // ignore malformed keep-alive chunks
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Used-Rag": usedRag ? "1" : "0",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Network error — please try again in a moment." },
      { status: 500 }
    );
  }
}
