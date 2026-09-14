import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://myportfolio-git-main-huzaifa-qazis-projects.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Mohammad Huzaifa | Agentic AI Developer",
  description:
    "Portfolio of Mohammad Huzaifa — Agentic AI Developer, Full-Stack Engineer, and Rag Based LLM Systems specialist. Building production-ready AI applications.",
  keywords: [
    "AI Developer",
    "Full-Stack Engineer",
    "LangChain",
    "LangGraph",
    "OpenAI",
    "Next.js",
    "Python",
    "Portfolio",
  ],
  authors: [{ name: "Mohammad Huzaifa" }],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Mohammad Huzaifa | Agentic AI Developer",
    description:
      "Portfolio of Mohammad Huzaifa — Agentic AI Developer, Full-Stack Engineer, and Rag based LLM Systems specialist.",
    type: "website",
    locale: "en_US",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Mohammad Huzaifa | Agentic AI Developer",
    description:
      "Agentic AI Developer — LangChain, LangGraph, RAG, Next.js. Chat with my AI portfolio assistant.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "yefDZUVfsBzgFwasIoLmHTKHNif6kdwnAm7YwIlAzVE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Always force dark theme — light theme is not yet supported
                localStorage.removeItem('theme');
                document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
