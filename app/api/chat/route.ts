import { NextResponse } from "next/server";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat/knowledge";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";
const MAX_HISTORY = 12; // last N messages sent to Groq — keeps free-tier usage low

type ChatMessage = { role: "user" | "assistant"; content: string };

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

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...messages],
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

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "Network error — please try again in a moment." },
      { status: 500 }
    );
  }
}
