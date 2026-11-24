/**
 * /api/sync-repos
 *
 * A secure Next.js API route that triggers the GitHub → Supabase sync
 * on demand — useful for one-click sync directly from anywhere (e.g. curl, Postman,
 * or a future admin dashboard).
 *
 * Protected by EMBED_ADMIN_KEY (already in your .env.local).
 *
 * Usage:
 *   curl -X POST https://your-portfolio.vercel.app/api/sync-repos \
 *        -H "Authorization: Bearer <EMBED_ADMIN_KEY>"
 *
 * Or locally:
 *   curl -X POST http://localhost:3000/api/sync-repos \
 *        -H "Authorization: Bearer huzaifaqazi-portfolio"
 */

import { NextResponse } from "next/server";

const GITHUB_USERNAME = "MohammadHuzaifa-qazi";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";
const MIN_README_CHARS = 50;

// Repos to skip (forks and repos with no useful content are already filtered,
// add specific repo names here if needed)
const SKIP_REPOS = new Set<string>([]);

// ─── Types ───────────────────────────────────────────────────────────────────

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  fork: boolean;
  topics: string[];
  language: string | null;
  languages_url: string;
  pushed_at: string;
  stargazers_count: number;
}

// ─── GitHub Helpers ──────────────────────────────────────────────────────────

async function fetchAllRepos(githubToken?: string): Promise<GitHubRepo[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&sort=updated`,
      { headers }
    );
    if (!res.ok) break;

    const batch: GitHubRepo[] = await res.json();
    if (batch.length === 0) break;

    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  return repos;
}

async function fetchReadme(repoName: string, githubToken?: string): Promise<string | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.raw+json",
  };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/readme`,
      { headers }
    );
    if (!res.ok) return null;
    const text = await res.text();
    return text.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").slice(0, 3000).trim();
  } catch {
    return null;
  }
}

async function fetchLanguages(languagesUrl: string, githubToken?: string): Promise<string[]> {
  const headers: Record<string, string> = {};
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;
  try {
    const res = await fetch(languagesUrl, { headers });
    if (!res.ok) return [];
    const data: Record<string, number> = await res.json();
    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);
  } catch {
    return [];
  }
}

// ─── LLM Summary ─────────────────────────────────────────────────────────────

async function generateSummary(
  repo: GitHubRepo,
  readme: string | null,
  languages: string[]
): Promise<string> {
  const techStack = [...new Set([
    ...(repo.language ? [repo.language] : []),
    ...languages,
    ...repo.topics,
  ])].slice(0, 8).join(", ") || "Various technologies";

  const prompt = `You are writing a knowledge entry for an AI portfolio chatbot.
Given this GitHub repository info, write ONE concise paragraph (3-5 sentences max) describing:
1. What the project does (purpose/features)
2. Tech stack used
3. Any notable detail (hackathon, client project, learning, etc.)

Write in third person about Huzaifa. Be factual, concise, recruiter-friendly. No fluff.

Repo: ${repo.name}
Description: ${repo.description || "No description"}
Tech: ${techStack}
Stars: ${repo.stargazers_count}
GitHub: ${repo.html_url}
README:
${readme?.slice(0, 1200) || "No README available"}

Write ONLY the paragraph.`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content: string = data.choices?.[0]?.message?.content?.trim() || "";
      if (content) return `${content} GitHub: ${repo.html_url}`;
    }
  } catch {
    // fall through to fallback
  }

  // Fallback summary
  return (
    `${repo.name.replace(/[-_]/g, " ")} is a project by Huzaifa. ` +
    (repo.description ? `${repo.description}. ` : "") +
    `Built with: ${techStack}. GitHub: ${repo.html_url}`
  );
}

// ─── Supabase Helpers ─────────────────────────────────────────────────────────

async function getEmbedding(text: string): Promise<number[] | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/embed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY!}`,
        },
        body: JSON.stringify({ input: text }),
      });
      if (res.ok) {
        const { embedding } = await res.json();
        if (Array.isArray(embedding) && embedding.length > 0) return embedding;
      }
    } catch {
      // retry
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 600 * 2 ** (attempt - 1)));
  }
  return null;
}

async function upsertDocument(doc: {
  title: string;
  content: string;
  embedding: number[];
}): Promise<boolean> {
  const baseHeaders = {
    "Content-Type": "application/json",
    apikey: process.env.SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY!}`,
  };

  // Check if exists
  const checkRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/documents?title=eq.${encodeURIComponent(doc.title)}&select=id`,
    { headers: baseHeaders }
  );
  const existing: { id: number }[] = checkRes.ok ? await checkRes.json() : [];

  if (existing.length > 0) {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/documents?id=eq.${existing[0].id}`,
      {
        method: "PATCH",
        headers: { ...baseHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ content: doc.content, embedding: doc.embedding }),
      }
    );
    return res.ok;
  } else {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/documents`, {
      method: "POST",
      headers: { ...baseHeaders, Prefer: "return=minimal" },
      body: JSON.stringify([doc]),
    });
    return res.ok;
  }
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  const adminKey = process.env.EMBED_ADMIN_KEY;

  if (!adminKey || token !== adminKey) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid Authorization: Bearer <EMBED_ADMIN_KEY> header." },
      { status: 401 }
    );
  }

  // ── Env check ───────────────────────────────────────────────────────────────
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured — missing environment variables." },
      { status: 500 }
    );
  }

  const githubToken = process.env.GITHUB_TOKEN; // optional

  const startTime = Date.now();
  const log: string[] = [];

  try {
    // ── Fetch repos ────────────────────────────────────────────────────────────
    const allRepos = await fetchAllRepos(githubToken);
    const repos = allRepos.filter((r) => !r.fork && !SKIP_REPOS.has(r.name));
    log.push(`Fetched ${repos.length} own repos (${allRepos.length} total)`);

    let synced = 0;
    let skipped = 0;
    let failed = 0;

    for (const repo of repos) {
      const docTitle = `GitHub — ${repo.name}`;

      // Check if already up-to-date
      const checkRes = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/documents?title=eq.${encodeURIComponent(docTitle)}&select=content`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY!}`,
          },
        }
      );
      const existingDocs: { content: string }[] = checkRes.ok ? await checkRes.json() : [];

      if (existingDocs.length > 0 && existingDocs[0].content.includes(`pushed:${repo.pushed_at}`)) {
        skipped++;
        continue;
      }

      // Fetch README and languages in parallel
      const [readme, languages] = await Promise.all([
        fetchReadme(repo.name, githubToken),
        fetchLanguages(repo.languages_url, githubToken),
      ]);

      const hasContent = (readme && readme.length >= MIN_README_CHARS) || repo.description;
      if (!hasContent) {
        skipped++;
        continue;
      }

      const summary = await generateSummary(repo, readme, languages);
      const content = `${summary}\npushed:${repo.pushed_at}`;
      const embedding = await getEmbedding(`${docTitle}: ${summary}`);

      if (!embedding) {
        log.push(`❌ Failed to embed: ${repo.name}`);
        failed++;
        continue;
      }

      const ok = await upsertDocument({ title: docTitle, content, embedding });
      if (ok) {
        log.push(`✅ Synced: ${repo.name}`);
        synced++;
      } else {
        log.push(`❌ Upsert failed: ${repo.name}`);
        failed++;
      }

      // Small delay to be gentle on rate limits
      await new Promise((r) => setTimeout(r, 300));
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    return NextResponse.json({
      success: true,
      synced,
      skipped,
      failed,
      duration: `${duration}s`,
      log,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Sync failed", detail: String(err) },
      { status: 500 }
    );
  }
}

// ── GET: Health check / status ─────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "POST /api/sync-repos",
    usage: 'POST with header: Authorization: Bearer <EMBED_ADMIN_KEY>',
    github_username: GITHUB_USERNAME,
  });
}
