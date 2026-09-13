"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { LoaderTwo } from "@/components/ui/loader";
import { SITE_CONFIG } from "@/lib/constants";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTED_QUESTIONS = [
  "What projects has Huzaifa built?",
  "Can he build AI agents?",
  "What are his strongest skills?",
];

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi! I'm Huzaifa's AI assistant. Ask me anything about his skills, projects, or experience.",
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: question }];
    // Add an empty assistant message — it fills up as the answer is revealed
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);

    const updateLast = (content: string) => {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content };
        return copy;
      });
    };

    // Typewriter smoothing: Groq streams the whole answer in one quick burst,
    // so we reveal the accumulated text at a steady, readable pace instead.
    let target = "";
    let displayed = 0;
    let streamDone = false;

    const revealTimer = setInterval(() => {
      if (displayed < target.length) {
        const speed = Math.max(2, Math.ceil(target.length / 50)); // ~1.5s full reveal
        displayed = Math.min(target.length, displayed + speed);
        updateLast(target.slice(0, displayed));
      }
      if (streamDone && displayed >= target.length) {
        clearInterval(revealTimer);
        setIsLoading(false);
      }
    }, 30);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        target = data?.error || "Something went wrong. Please try again in a moment.";
        streamDone = true;
        return;
      }

      // Read the streamed answer chunk by chunk into `target`
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        target += decoder.decode(value, { stream: true });
      }
      if (!target.trim()) {
        target = "Something went wrong. Please try again in a moment.";
      }
      streamDone = true;
    } catch {
      if (!target.trim()) {
        target = "Network error — please try again in a moment.";
      }
      streamDone = true;
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, duration: 0.4 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-[70] grid h-14 w-14 place-items-center rounded-full border border-[#61DAFB]/30 bg-gradient-to-br from-[#61DAFB] to-[#0097b2] shadow-[0_0_30px_rgba(97,218,251,0.45)] cursor-pointer"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6 text-[#05070b]" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="h-6 w-6 text-[#05070b]" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="liquid-panel fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 z-[70] flex h-[min(560px,70vh)] w-[min(100%,380px)] flex-col overflow-hidden rounded-[1.8rem] sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
              <div className="grid h-10 w-10 place-items-center rounded-[1rem] border border-white/10 bg-gradient-to-br from-[#61DAFB]/20 to-[#0097b2]/10">
                <span className="text-sm font-bold text-[#61DAFB]">H</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">
                  Ask about {SITE_CONFIG.name}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#78FFB4] animate-pulse-react" />
                  <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-white/35">
                    AI Assistant · Online
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((msg, i) => {
                const isLastAssistant =
                  i === messages.length - 1 && msg.role === "assistant";
                const isPending = isLoading && isLastAssistant && !msg.content;
                const isGenerating = isLoading && isLastAssistant && !!msg.content;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-br-md bg-[#61DAFB]/15 text-white/90 border border-[#61DAFB]/20"
                          : "rounded-bl-md bg-white/[0.05] text-white/75 border border-white/[0.06]"
                      }`}
                    >
                      {isPending ? (
                        <LoaderTwo />
                      ) : (
                        <>
                          <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                        ul: ({ children }) => (
                          <ul className="mb-1.5 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="mb-1.5 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
                        ),
                        li: ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => (
                          <strong className="font-semibold text-white">{children}</strong>
                        ),
                        em: ({ children }) => <em className="italic">{children}</em>,
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#61DAFB] underline underline-offset-2 break-all"
                          >
                            {children}
                          </a>
                        ),
                        code: ({ children }) => (
                          <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">{children}</code>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                          {isGenerating && (
                            <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-[#61DAFB]" />
                          )}
                        </>
                      )}
                  </div>
                </motion.div>
                );
              })}

              {/* Suggested questions — only until first user message */}
              {messages.length === 1 && !isLoading && (
                <div className="space-y-2 pt-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="w-full cursor-pointer rounded-xl border border-[#61DAFB]/20 bg-[#61DAFB]/[0.06] px-4 py-2.5 text-left text-[12px] text-white/70 transition-colors hover:bg-[#61DAFB]/15 hover:text-white"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-white/[0.06] p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about skills, projects..."
                maxLength={500}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#61DAFB]/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl bg-gradient-to-br from-[#61DAFB] to-[#0097b2] text-[#05070b] transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
