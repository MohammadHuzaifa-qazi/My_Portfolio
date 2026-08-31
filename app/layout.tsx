import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Mohammad Huzaifa | Agentic AI Developer",
    description:
      "Portfolio of Mohammad Huzaifa — Agentic AI Developer, Full-Stack Engineer, and Rag based LLM Systems specialist.",
    type: "website",
    locale: "en_US",
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
                const theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
