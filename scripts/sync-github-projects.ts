/**
 * sync-github-projects.ts
 *
 * Automatically fetches all public repos from GitHub, generates AI summaries,
 * creates vector embeddings, and upserts them into Supabase.
 *
 * Run locally:
 *   npx tsx scripts/sync-github-projects.ts
 *
 * Or via npm:
 *   npm run sync:repos
 *
 * Environment variables needed (source .env.local first):
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY, GROQ_API_KEY
 *   Optional: GITHUB_TOKEN (for higher API rate limits: 5000/hr vs 60/hr)
 */

import { KNOWLEDGE_CHUNKS } from "../lib/chat/knowledge";

// ─── Config ──────────────────────────────────────────────────────────────────

const GITHUB_USERNAME = "MohammadHuzaifa-qazi";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";

// Repos to skip (forks, boilerplate, learning playgrounds with no real value)
const SKIP_REPOS = new Set([
  // Add repo names here if you want to exclude them from the chatbot knowledge
  // e.g. "my-learning-notes", "template-repo"
]);

// Only sync repos with a description OR a README (repos with neither aren't useful for the chatbot)
const MIN_README_CHARS = 50;

// ─── Environment ─────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional but recommended

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing SUPABASE_URL or SUPABASE_SERVICE_KEY — source .env.local first.");
  process.exit(1);
}
if (!GROQ_API_KEY) {
  console.error("❌  Missing GROQ_API_KEY — source .env.local first.");
  process.exit(1);
}

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
  updated_at: string;
  stargazers_count: number;
  default_branch: string;
}

interface SupabaseDocument {
  id: number;
  title: string;
  content: string;
  updated_at?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

function supabaseHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY!,
    Authorization: `Bearer ${SUPABASE_KEY!}`,
  };
}

// ─── GitHub API ──────────────────────────────────────────────────────────────

async function fetchAllRepos(): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&sort=updated`,
      { headers: githubHeaders() }
    );

    if (!res.ok) {
      console.error(`GitHub API error: ${res.status} ${await res.text()}`);
      break;
    }

    const batch: GitHubRepo[] = await res.json();
    if (batch.length === 0) break;

    repos.push(...batch);
    page++;

    if (batch.length < 100) break; // Last page
  }

  return repos;
}

async function fetchReadme(repo: GitHubRepo): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repo.name}/readme`,
      { headers: { ...githubHeaders(), Accept: "application/vnd.github.raw+json" } }
    );
    if (!res.ok) return null;
    const text = await res.text();
    // Strip HTML tags and excessive whitespace, limit to 3000 chars for LLM
    return text
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .slice(0, 3000)
      .trim();
  } catch {
    return null;
  }
}

async function fetchLanguages(languagesUrl: string): Promise<string[]> {
  try {
    const res = await fetch(languagesUrl, { headers: githubHeaders() });
    if (!res.ok) return [];
    const data: Record<string, number> = await res.json();
    // Sort by usage bytes, return top 5 language names
    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);
  } catch {
    return [];
  }
}

// ─── LLM Summary Generation ──────────────────────────────────────────────────

async function generateProjectSummary(
  repo: GitHubRepo,
  readme: string | null,
  languages: string[]
): Promise<string> {
  const techStack =
    [...new Set([...(repo.language ? [repo.language] : []), ...languages, ...repo.topics])]
      .slice(0, 8)
      .join(", ") || "Not specified";

  const prompt = `You are writing a knowledge entry for an AI portfolio chatbot. 
Given this GitHub repository info, write ONE concise paragraph (3-5 sentences max) that describes:
1. What the project does (purpose/features)
2. Tech stack used
3. Any notable detail (hackathon, client, learning project, etc.)

Write in third person about Huzaifa. Be factual, concise, and recruiter-friendly. No fluff.

Repo: ${repo.name}
Description: ${repo.description || "No description provided"}
Tech Stack: ${techStack}
Stars: ${repo.stargazers_count}
GitHub URL: ${repo.html_url}
README (excerpt):
${readme ? readme.slice(0, 1500) : "No README available"}

Write ONLY the paragraph, nothing else.`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      console.warn(`  ⚠️  Groq error for ${repo.name}: ${res.status}`);
      // Fallback: build a basic summary from available metadata
      return buildFallbackSummary(repo, techStack);
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content?.trim() || "";
    if (!content) return buildFallbackSummary(repo, techStack);

    // Append the GitHub URL so chatbot can always link to it
    return `${content} GitHub: ${repo.html_url}`;
  } catch {
    return buildFallbackSummary(repo, techStack);
  }
}

function buildFallbackSummary(repo: GitHubRepo, techStack: string): string {
  return (
    `${repo.name.replace(/[-_]/g, " ")} is a project by Huzaifa. ` +
    (repo.description ? `${repo.description}. ` : "") +
    `Built with: ${techStack || "various technologies"}. ` +
    `GitHub: ${repo.html_url}`
  );
}

// ─── Embedding ───────────────────────────────────────────────────────────────

async function getEmbedding(text: string): Promise<number[] | null> {
  const MAX_ATTEMPTS = 4;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/embed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY!,
          Authorization: `Bearer ${SUPABASE_KEY!}`,
        },
        body: JSON.stringify({ input: text }),
      });

      if (res.ok) {
        const { embedding } = await res.json();
        if (Array.isArray(embedding) && embedding.length > 0) return embedding;
        console.warn(`  ⚠️  embed returned no vector (attempt ${attempt})`);
      } else {
        console.warn(`  ⚠️  embed failed (${res.status}) attempt ${attempt}`);
      }
    } catch (err) {
      console.warn(`  ⚠️  embed request error attempt ${attempt}:`, err);
    }

    if (attempt < MAX_ATTEMPTS) await sleep(600 * 2 ** (attempt - 1));
  }

  return null;
}

// ─── Supabase DB Helpers ─────────────────────────────────────────────────────

async function fetchExistingGithubDocs(): Promise<SupabaseDocument[]> {
  // We tag GitHub-synced docs with title prefix "GitHub — " to distinguish them
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?title=like.GitHub%20%E2%80%94%20*&select=id,title,content,updated_at`,
    { headers: supabaseHeaders() }
  );
  if (!res.ok) return [];
  return res.json();
}

async function upsertDocument(doc: {
  title: string;
  content: string;
  embedding: number[];
}): Promise<boolean> {
  // Try to update existing document first (match by title)
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?title=eq.${encodeURIComponent(doc.title)}&select=id`,
    { headers: supabaseHeaders() }
  );

  const existing: { id: number }[] = checkRes.ok ? await checkRes.json() : [];

  if (existing.length > 0) {
    // UPDATE
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/documents?id=eq.${existing[0].id}`,
      {
        method: "PATCH",
        headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
        body: JSON.stringify({ content: doc.content, embedding: doc.embedding }),
      }
    );
    return updateRes.ok;
  } else {
    // INSERT
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
      method: "POST",
      headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify([doc]),
    });
    return insertRes.ok;
  }
}

// ─── Main Sync Logic ─────────────────────────────────────────────────────────

async function main() {
  console.log("🔄  GitHub Portfolio Auto-Sync\n");
  console.log(`👤  GitHub User  : ${GITHUB_USERNAME}`);
  console.log(`🗃️   Supabase     : ${SUPABASE_URL}`);
  console.log(`🤖  Groq Model   : ${GROQ_MODEL}\n`);

  // 1. Fetch all public repos
  console.log("📡  Fetching public repos from GitHub...");
  const allRepos = await fetchAllRepos();
  const ownRepos = allRepos.filter(
    (r) => !r.fork && !SKIP_REPOS.has(r.name)
  );
  console.log(`    Found ${allRepos.length} repos → ${ownRepos.length} own (non-fork) repos\n`);

  // 2. Fetch existing GitHub-synced docs from Supabase to detect what's new/changed
  console.log("🗄️   Fetching existing GitHub docs from Supabase...");
  const existingDocs = await fetchExistingGithubDocs();
  const existingTitles = new Map(existingDocs.map((d) => [d.title, d]));
  console.log(`    ${existingDocs.length} GitHub-synced docs already in DB\n`);

  // 3. Build the set of repos that exist in KNOWLEDGE_CHUNKS (manual entries)
  //    to avoid overwriting them with auto-generated lower-quality summaries
  const manualProjectNames = new Set(
    KNOWLEDGE_CHUNKS
      .filter((c) => c.title.startsWith("Project — "))
      .map((c) =>
        c.title
          .replace("Project — ", "")
          .toLowerCase()
          .replace(/\s+/g, "-")
      )
  );

  // 4. Process each repo
  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (const repo of ownRepos) {
    const docTitle = `GitHub — ${repo.name}`;

    // Skip if this project is already in manual KNOWLEDGE_CHUNKS
    // (manual entries are higher quality — written by you)
    if (
      manualProjectNames.has(repo.name.toLowerCase()) ||
      manualProjectNames.has(repo.name.toLowerCase().replace(/-/g, ""))
    ) {
      console.log(`⏭️   [SKIP — manual entry exists] ${repo.name}`);
      skipped++;
      continue;
    }

    // Check if already synced — only re-sync if pushed_at changed
    const existing = existingTitles.get(docTitle);
    if (existing) {
      // Parse the first line of content for the pushed_at timestamp we stored
      if (existing.content.includes(`pushed:${repo.pushed_at}`)) {
        console.log(`✅  [UP-TO-DATE] ${repo.name}`);
        skipped++;
        continue;
      }
    }

    console.log(`🔄  Processing: ${repo.name}`);

    // Fetch README and languages in parallel
    const [readme, languages] = await Promise.all([
      fetchReadme(repo),
      fetchLanguages(repo.languages_url),
    ]);

    // Skip repos with no meaningful content
    const hasContent =
      (readme && readme.length >= MIN_README_CHARS) || repo.description;
    if (!hasContent) {
      console.log(`    ⏭️   Skipping (no description or README): ${repo.name}`);
      skipped++;
      continue;
    }

    // Generate LLM summary
    const summary = await generateProjectSummary(repo, readme, languages);

    // Append hidden timestamp for change detection (doesn't affect chatbot output)
    const content = `${summary}\npushed:${repo.pushed_at}`;

    // Generate embedding
    const embedding = await getEmbedding(`${docTitle}: ${summary}`);
    if (!embedding) {
      console.error(`    ❌  Failed to embed: ${repo.name}`);
      failed++;
      await sleep(1000);
      continue;
    }

    // Upsert to Supabase
    const ok = await upsertDocument({ title: docTitle, content, embedding });
    if (ok) {
      console.log(`    ✅  Synced: ${repo.name}`);
      synced++;
    } else {
      console.error(`    ❌  Supabase upsert failed: ${repo.name}`);
      failed++;
    }

    // Be gentle — avoid rate limiting
    await sleep(300);
  }

  // 5. Summary
  console.log("\n─────────────────────────────────────────");
  console.log(`✅  Synced   : ${synced}`);
  console.log(`⏭️   Skipped  : ${skipped}`);
  console.log(`❌  Failed   : ${failed}`);
  console.log("─────────────────────────────────────────\n");

  if (failed > 0) {
    console.error(`⚠️   ${failed} repo(s) failed. Re-run the script to retry.\n`);
    process.exit(1);
  }

  console.log("🎉  Sync complete! Chatbot now knows about your latest GitHub projects.\n");
}

main();
