"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  RotateCcw,
  Copy,
  Check,
  ArrowDown,
  Square,
} from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { LoaderTwo } from "@/components/ui/loader";
import { SITE_CONFIG } from "@/lib/constants";

type Message = {
  role: "user" | "assistant";
  content: string;
  /** Assistant reply that failed — renders a Retry action instead of dead text. */
  error?: boolean;
  /** The question to re-ask when the Retry action is used. */
  retryText?: string;
};

const SUGGESTED_QUESTIONS = [
  "What projects has Huzaifa built?",
  "Can he build AI agents?",
  "What are his strongest skills?",
  "How can I hire him?",
];

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi! I'm Huzaifa's AI assistant. Ask me anything about his skills, projects, or experience.",
};

const MAX_INPUT = 500;
/** How close to the bottom (px) we must be before auto-scroll takes over. */
const AUTOSCROLL_THRESHOLD = 80;

// Defined at module scope so the identity is stable — otherwise every
// typewriter tick would remount the whole markdown tree.
const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-1.5 last:mb-0">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-1.5 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-1.5 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#61DAFB] underline underline-offset-2 break-all hover:text-[#9ae9ff]"
    >
      {children}
    </a>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">
      {children}
    </code>
  ),
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// --- Message bubble ---------------------------------------------------------
// Memoized: during generation the typewriter re-renders the parent ~33x/sec,
// but only the last message's object identity changes, so everything above
// it skips re-rendering (and skips re-parsing its markdown) entirely.

type MessageBubbleProps = {
  msg: Message;
  index: number;
  isPending: boolean;
  isGenerating: boolean;
  copied: boolean;
  onCopy: (index: number, text: string) => void;
  onRetry: (question: string) => void;
};

const MessageBubble = memo(function MessageBubble({
  msg,
  index,
  isPending,
  isGenerating,
  copied,
  onCopy,
  onRetry,
}: MessageBubbleProps) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`group flex flex-col ${isUser ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? "rounded-br-md border border-[#61DAFB]/20 bg-[#61DAFB]/15 text-white/90"
            : "rounded-bl-md border border-white/[0.06] bg-white/[0.05] text-white/75"
        }`}
      >
        {isPending ? (
          // Decorative: the sr-only live region already announces "thinking".
          <span aria-hidden="true">
            <LoaderTwo />
          </span>
        ) : (
          <>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={MARKDOWN_COMPONENTS}
            >
              {msg.content}
            </ReactMarkdown>
            {isGenerating && (
              <span
                aria-hidden="true"
                className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-[#61DAFB]"
              />
            )}
          </>
        )}
      </div>

      {/* Per-message actions — hover/focus only, so they never fight the text */}
      {!isPending && msg.content.trim().length > 0 && (
        <div
          className={`mt-1 flex gap-1 ${
            isUser ? "justify-end" : "justify-start"
          } opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100`}
        >
          {msg.error ? (
            <button
              type="button"
              onClick={() => msg.retryText && onRetry(msg.retryText)}
              className="cursor-pointer rounded-lg px-2 py-1 text-[11px] text-[#61DAFB] transition-colors hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none"
            >
              Retry
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onCopy(index, msg.content)}
              aria-label={copied ? "Copied" : "Copy message"}
              className="grid h-6 w-6 cursor-pointer place-items-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80 focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none"
            >
              {copied ? (
                <Check className="h-3 w-3 text-[#78FFB4]" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
});

// --- Widget -----------------------------------------------------------------

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [liveMessage, setLiveMessage] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Streaming plumbing (refs — these must not trigger renders)
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef = useRef("");
  const displayedRef = useRef(0);
  const streamDoneRef = useRef(false);
  const loadingRef = useRef(false);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    loadingRef.current = isLoading;
  }, [isLoading]);

  // --- No client-side persistence, on purpose --------------------------------
  // The conversation lives in React state only: refreshing starts a clean chat,
  // and nothing is ever written to storage. On a shared machine (university lab,
  // library PC) an open tab must not hand the next visitor someone else's chat.
  // Nothing is persisted server-side either — /api/chat is stateless.

  // --- Scroll management ----------------------------------------------------
  // Only follow the tail when the reader is already at the tail, so scrolling
  // up to re-read an earlier answer is never yanked back down.
  useEffect(() => {
    if (!atBottom) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading, atBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distanceFromBottom < AUTOSCROLL_THRESHOLD);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setAtBottom(true);
  }, []);

  // --- Focus management: focus the input on open, restore it on close -------
  useEffect(() => {
    if (isOpen) {
      // Let the open animation start before stealing focus.
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    fabRef.current?.focus();
  }, [isOpen]);

  // --- Escape to close + trap Tab inside the dialog -------------------------
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // --- Teardown: never leave a timer or an in-flight request behind ---------
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  // --- Message helpers ------------------------------------------------------

  const patchLast = useCallback((content: string, extra?: Partial<Message>) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.role !== "assistant") return prev;
      const next = [...prev];
      next[next.length - 1] = { ...last, content, ...extra };
      return next;
    });
  }, []);

  const copyMessage = useCallback(async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(
        () => setCopiedIndex((current) => (current === index ? null : current)),
        1600
      );
    } catch {
      // clipboard blocked (insecure context / permissions) — stay silent
    }
  }, []);

  const clearChat = useCallback(() => {
    streamDoneRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    stopTimer();
    targetRef.current = "";
    displayedRef.current = 0;
    setMessages([WELCOME_MESSAGE]);
    setCopiedIndex(null);
    setLiveMessage("");
    setIsLoading(false);
    setInput("");
    inputRef.current?.focus();
  }, [stopTimer]);

  // --- Send / stream / reveal ----------------------------------------------

  const send = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || loadingRef.current) return;

      // Set synchronously, not just via the sync effect: two clicks in the same
      // tick would otherwise both pass the guard before React re-renders.
      loadingRef.current = true;

      const controller = new AbortController();
      abortRef.current = controller;

      // Drop any previous failed turn — it should not pollute the new context.
      const base = messagesRef.current.filter((m) => !m.error && m.content.trim());
      const history: Message[] = [...base, { role: "user", content: question }];

      setMessages([...history, { role: "assistant", content: "" }]);
      setInput("");
      setIsLoading(true);
      setAtBottom(true);
      setCopiedIndex(null);
      setLiveMessage("Assistant is thinking.");

      targetRef.current = "";
      displayedRef.current = 0;
      streamDoneRef.current = false;

      const finishWith = (content: string, failure: boolean) => {
        streamDoneRef.current = true;
        stopTimer();
        patchLast(content, failure ? { error: true, retryText: question } : undefined);
        setIsLoading(false);
        setLiveMessage(content);
      };

      // Groq delivers the whole answer in one ~150ms burst, so a raw stream is
      // invisible. Instead we accumulate into targetRef and reveal at a
      // readable, steady pace. Reduced-motion users skip this entirely.
      const animate = !prefersReducedMotion();

      if (animate) {
        timerRef.current = setInterval(() => {
          const target = targetRef.current;

          if (displayedRef.current < target.length) {
            const speed = Math.max(2, Math.ceil(target.length / 50));
            displayedRef.current = Math.min(
              target.length,
              displayedRef.current + speed
            );
            patchLast(target.slice(0, displayedRef.current));
          }

          // Settle only when the stream has closed AND everything that arrived
          // has been revealed — otherwise stopping here would freeze the text
          // mid-sentence while chunks were still landing.
          if (streamDoneRef.current && displayedRef.current >= target.length) {
            stopTimer();
            if (!target.trim()) {
              finishWith(
                "Something went wrong. Please try again in a moment.",
                true
              );
            } else {
              setIsLoading(false);
              setLiveMessage(target);
            }
          }
        }, 30);
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          finishWith(
            data?.error || "Something went wrong. Please try again in a moment.",
            true
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          targetRef.current += decoder.decode(value, { stream: true });
          if (!animate) patchLast(targetRef.current);
        }

        streamDoneRef.current = true;
        if (!targetRef.current.trim()) {
          finishWith(
            "Something went wrong. Please try again in a moment.",
            true
          );
          return;
        }
        if (!animate) {
          // No typewriter: content is already rendered, just settle state.
          setIsLoading(false);
          setLiveMessage(targetRef.current);
        }
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return; // user stopped it
        finishWith("Network error — please try again in a moment.", true);
      }
    },
    [patchLast, stopTimer]
  );

  // Stable indirection so MessageBubble's memo isn't defeated by a new closure
  // on every typewriter tick.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);
  const handleRetry = useCallback((question: string) => {
    void sendRef.current(question);
  }, []);

  // Deliberately NOT aborted when the panel closes: this component stays
  // mounted, so letting the answer finish in the background means a visitor who
  // closes and reopens mid-answer finds the reply waiting instead of a dead
  // bubble. Teardown on real unmount is handled by the effect above.

  const stopGeneration = useCallback(() => {
    streamDoneRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    stopTimer();
    const partial = targetRef.current.slice(0, displayedRef.current);
    patchLast(partial.trim().length > 0 ? partial : "Stopped.");
    setIsLoading(false);
    setLiveMessage("Generation stopped.");
  }, [patchLast, stopTimer]);

  const lastIndex = messages.length - 1;

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        ref={fabRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, duration: 0.4 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-[70] grid h-14 w-14 cursor-pointer place-items-center rounded-full border border-[#61DAFB]/30 bg-gradient-to-br from-[#61DAFB] to-[#0097b2] shadow-[0_0_30px_rgba(97,218,251,0.45)] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        <span className="sr-only">
          {isOpen ? "Close chat" : "Chat with Huzaifa's AI assistant"}
        </span>
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              aria-hidden="true"
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
              aria-hidden="true"
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

      {/* Screen-reader announcements: one clear sentence per turn, instead of
          the 33-per-second churn the typewriter produces. */}
      <div className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Chat with ${SITE_CONFIG.name}'s AI assistant`}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="liquid-panel fixed bottom-24 left-4 right-4 z-[70] flex h-[min(560px,70dvh)] w-auto flex-col overflow-hidden rounded-[1.8rem] sm:left-auto sm:right-6 sm:w-96"
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
                  <div
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-[#78FFB4] animate-pulse-react"
                  />
                  <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/55">
                    AI Assistant · Online
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={clearChat}
                aria-label="Start a new chat"
                title="Start a new chat"
                className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/90 focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Conversation */}
            <div className="relative flex-1 overflow-hidden">
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                role="log"
                aria-live="off"
                aria-busy={isLoading}
                aria-label="Conversation"
                className="h-full space-y-3 overflow-y-auto px-4 py-4"
              >
                {messages.map((msg, i) => {
                  const isLastAssistant =
                    i === lastIndex && msg.role === "assistant";
                  return (
                    <MessageBubble
                      key={i}
                      msg={msg}
                      index={i}
                      isPending={isLoading && isLastAssistant && !msg.content}
                      isGenerating={
                        isLoading && isLastAssistant && !!msg.content
                      }
                      copied={copiedIndex === i}
                      onCopy={copyMessage}
                      onRetry={handleRetry}
                    />
                  );
                })}

                {/* Starter prompts — until the visitor asks something */}
                {messages.length === 1 && !isLoading && (
                  <div className="space-y-2 pt-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        className="w-full cursor-pointer rounded-xl border border-[#61DAFB]/20 bg-[#61DAFB]/[0.06] px-4 py-2.5 text-left text-[12px] text-white/75 transition-colors hover:bg-[#61DAFB]/15 hover:text-white focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Jump back to the latest answer */}
              <AnimatePresence>
                {!atBottom && (
                  <motion.button
                    type="button"
                    onClick={scrollToBottom}
                    aria-label="Scroll to latest message"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute bottom-3 left-1/2 grid h-8 w-8 -translate-x-1/2 cursor-pointer place-items-center rounded-full border border-white/10 bg-[#0b1118]/90 text-white/70 shadow-lg backdrop-blur transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Composer */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send(input);
              }}
              className="flex items-center gap-2 border-t border-white/[0.06] p-3"
            >
              <label htmlFor="chat-input" className="sr-only">
                Ask a question about {SITE_CONFIG.name}
              </label>
              <input
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about skills, projects..."
                maxLength={MAX_INPUT}
                autoComplete="off"
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] text-white outline-none transition-colors placeholder:text-white/45 focus:border-[#61DAFB]/50 focus-visible:ring-1 focus-visible:ring-[#61DAFB]/40"
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  aria-label="Stop generating"
                  title="Stop generating"
                  className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-white/15 bg-white/[0.06] text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send message"
                  className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl bg-gradient-to-br from-[#61DAFB] to-[#0097b2] text-[#05070b] transition-opacity disabled:cursor-not-allowed disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
