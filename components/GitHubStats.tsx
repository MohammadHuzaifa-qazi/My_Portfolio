"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Users, FolderGit2 } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

interface GitHubData {
  publicRepos: number;
  totalStars: number;
  followers: number;
  totalForks: number;
  recentRepos: Array<{
    name: string;
    url: string;
    description: string | null;
    stars: number;
    pushedAt: string;
  }>;
}

const FALLBACK_DATA: GitHubData = {
  publicRepos: 44,
  totalStars: 3,
  followers: 7,
  totalForks: 2,
  recentRepos: [],
};

async function fetchGitHubData(): Promise<GitHubData | null> {
  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
    };
    if (process.env.NEXT_PUBLIC_GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`;
    }

    const username = SITE_CONFIG.github.split("/").pop();
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        next: { revalidate: 3600 },
        headers,
      }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, {
        next: { revalidate: 3600 },
        headers,
      }),
    ]);

    if (!userRes.ok || !reposRes.ok) return null;

    const user = await userRes.json();
    const repos = await reposRes.json();

    const ownRepos = repos.filter((r: { fork: boolean }) => !r.fork);

    return {
      publicRepos: user.public_repos,
      totalStars: ownRepos.reduce(
        (sum: number, r: { stargazers_count: number }) => sum + r.stargazers_count,
        0
      ),
      followers: user.followers,
      totalForks: ownRepos.reduce(
        (sum: number, r: { forks_count: number }) => sum + r.forks_count,
        0
      ),
      recentRepos: ownRepos
        .filter((r: { description: string | null }) => r.description)
        .slice(0, 5)
        .map(
          (r: {
            name: string;
            html_url: string;
            description: string | null;
            stargazers_count: number;
            pushed_at: string;
          }) => ({
            name: r.name.replace(/[-_]/g, " "),
            url: r.html_url,
            description: r.description,
            stars: r.stargazers_count,
            pushedAt: r.pushed_at,
          })
        ),
    };
  } catch {
    return null;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function StatBar({
  label,
  value,
  maxValue,
  icon: Icon,
  delay,
}: {
  label: string;
  value: string;
  maxValue: number;
  icon: React.ElementType;
  delay: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-white/45 font-sans text-[11px] uppercase tracking-[0.1em] flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-[#61DAFB]" />
          {label}
        </span>
        <span className="text-white font-medium">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${maxValue}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay }}
          className="h-full bg-gradient-to-r from-[#61DAFB]/60 to-[#61DAFB] rounded-full"
        />
      </div>
    </div>
  );
}

export function GitHubStats() {
  const [data, setData] = useState<GitHubData>(FALLBACK_DATA);

  useEffect(() => {
    fetchGitHubData().then((d) => d && setData(d));
  }, []);

  return (
    <section className="relative py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="font-sans text-[11px] uppercase tracking-[0.3em] text-white/35 mb-6">Open Source</div>
          <h2 className="text-4xl md:text-6xl font-bold mb-16 tracking-[-0.04em]">
            GitHub <span className="text-[#61DAFB]">Stats</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="liquid-panel rounded-[2.5rem] p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-[1.2rem] bg-[#61DAFB]/10">
                  <GitHubIcon className="w-8 h-8 text-[#61DAFB]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {SITE_CONFIG.github.split("/").pop()}
                  </h3>
                  <p className="text-white/40 text-sm">
                    Open Source Contributor
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <StatBar
                  label="Public Repos"
                  value={`${data.publicRepos}`}
                  maxValue={100}
                  icon={FolderGit2}
                  delay={0.2}
                />
                <StatBar
                  label="Total Stars"
                  value={`${data.totalStars}`}
                  maxValue={Math.max(10, data.totalStars * 10)}
                  icon={Star}
                  delay={0.4}
                />
                <StatBar
                  label="Followers"
                  value={`${data.followers}`}
                  maxValue={Math.max(10, data.followers * 10)}
                  icon={Users}
                  delay={0.6}
                />
              </div>

              <a
                href={SITE_CONFIG.github}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 text-[#61DAFB] font-sans text-[11px] uppercase tracking-[0.15em] hover:opacity-80 transition-opacity"
              >
                View Profile →
              </a>
            </div>

            <div className="liquid-panel rounded-[2.5rem] p-8">
              <h3 className="font-bold text-white mb-6 text-lg">
                Recent Activity
              </h3>

              {data.recentRepos.length > 0 ? (
                <div className="space-y-4">
                  {data.recentRepos.map((repo) => (
                    <a
                      key={repo.name}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white capitalize group-hover:text-[#61DAFB] transition-colors truncate">
                            {repo.name}
                          </div>
                          <p className="text-white/40 text-xs mt-1 line-clamp-2">
                            {repo.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-1">
                          <div className="flex items-center gap-1 text-[11px] text-white/40">
                            <Star className="w-3 h-3 text-[#61DAFB]" />
                            {repo.stars}
                          </div>
                          <div className="text-[10px] text-white/30 uppercase tracking-wide">
                            {timeAgo(repo.pushedAt)}
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">
                  Live stats load hone me thodi der lag sakti hai — meanwhile{" "}
                  <a
                    href={SITE_CONFIG.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#61DAFB] hover:underline"
                  >
                    GitHub profile
                  </a>{" "}
                  check kar lo.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
