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
  Mic,
  MicOff,
  Volume2,
  VolumeX,
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

// --- Voice Agent Helpers (STT & TTS) ----------------------------------------

function cleanMarkdownForSpeech(text: string): string {
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove headers #, ##, etc.
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italics **text** or *text* or __text__
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove bullet points / list numbers
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    // Remove blockquotes
    .replace(/^\s*>\s*/gm, "")
    // Remove raw URLs
    .replace(/https?:\/\/\S+/g, "")
    // Replace multiple spaces/newlines with single space
    .replace(/\s+/g, " ")
    .trim();
}

function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Natural sounding English voices across platforms (Chrome, Edge, Safari, macOS, Windows)
  const naturalVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Natural") ||
        v.name.includes("Google US English") ||
        v.name.includes("Samantha") ||
        v.name.includes("Jenny") ||
        v.name.includes("Guy") ||
        v.name.includes("Aria"))
  );
  if (naturalVoice) return naturalVoice;

  // 2. Any en-US voice
  const enUs = voices.find((v) => v.lang === "en-US" || v.lang === "en_US");
  if (enUs) return enUs;

  // 3. Any English voice
  const anyEn = voices.find((v) => v.lang.startsWith("en"));
  if (anyEn) return anyEn;

  // 4. Default voice
  return voices[0] || null;
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
  isSpeaking: boolean;
  onCopy: (index: number, text: string) => void;
  onRetry: (question: string) => void;
  onSpeak: (index: number, text: string) => void;
};

const MessageBubble = memo(function MessageBubble({
  msg,
  index,
  isPending,
  isGenerating,
  copied,
  isSpeaking,
  onCopy,
  onRetry,
  onSpeak,
}: MessageBubbleProps) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`group flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-[#61DAFB]/20 to-[#0097b2]/10 text-[11px] font-bold text-[#61DAFB] shadow-sm select-none">
          H
        </div>
      )}

      <div className={`flex flex-col max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed transition-all ${
            isUser
              ? "rounded-br-sm border border-[#61DAFB]/25 bg-gradient-to-br from-[#61DAFB]/20 to-[#0097b2]/15 text-white shadow-sm"
              : isSpeaking
              ? "rounded-bl-sm border border-[#61DAFB]/45 bg-white/[0.07] text-white shadow-[0_0_15px_rgba(97,218,251,0.18)]"
              : "rounded-bl-sm border border-white/[0.08] bg-white/[0.04] text-white/80"
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
            className={`mt-1 flex items-center gap-1 ${
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
              <>
                {!isUser && (
                  <button
                    type="button"
                    onClick={() => onSpeak(index, msg.content)}
                    aria-label={isSpeaking ? "Stop speaking" : "Listen to message"}
                    title={isSpeaking ? "Stop speaking" : "Listen to message"}
                    className={`flex items-center gap-1.5 h-6 px-2 cursor-pointer rounded-lg text-[11px] transition-colors focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none ${
                      isSpeaking
                        ? "text-[#61DAFB] bg-[#61DAFB]/15 font-medium"
                        : "text-white/40 hover:bg-white/[0.06] hover:text-white/80"
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <div className="flex items-end gap-0.5 h-2.5" aria-hidden="true">
                          <span className="w-0.5 bg-[#61DAFB] rounded-full animate-bounce [animation-delay:0ms] h-2" />
                          <span className="w-0.5 bg-[#61DAFB] rounded-full animate-bounce [animation-delay:150ms] h-3" />
                          <span className="w-0.5 bg-[#61DAFB] rounded-full animate-bounce [animation-delay:300ms] h-1.5" />
                        </div>
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3 w-3" />
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                )}
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
              </>
            )}
          </div>
        )}
      </div>
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

  // Voice Agent State (STT & TTS)
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);

  const voiceEnabledRef = useRef(voiceEnabled);
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  const recognitionRef = useRef<any>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  // Preload and cache browser voices (crucial for Chrome/Edge)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const populateVoices = () => {
      window.speechSynthesis.getVoices();
    };
    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }, []);

  // Voice output (TTS) controller with Chrome cancel & GC workarounds
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopSpeaking = useCallback(() => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
    setIsSpeaking(false);
    setSpeakingIndex(null);
    speechUtteranceRef.current = null;
    if (typeof window !== "undefined") {
      (window as any).__activeUtterance = null;
    }
  }, []);

  const speakText = useCallback(
    (text: string, index?: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }

      // Cancel previous playback
      window.speechSynthesis.cancel();

      const clean = cleanMarkdownForSpeech(text);
      if (!clean) {
        setIsSpeaking(false);
        setSpeakingIndex(null);
        return;
      }

      // 75ms delay allows Chromium's asynchronous cancel operation to settle,
      // preventing the newly queued utterance from being immediately aborted.
      speakTimeoutRef.current = setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(clean);
          utterance.lang = "en-US";

          const voice = getPreferredVoice();
          if (voice) {
            utterance.voice = voice;
          }

          utterance.rate = 1.0;
          utterance.pitch = 1.0;

          utterance.onstart = () => {
            setIsSpeaking(true);
            if (typeof index === "number") setSpeakingIndex(index);
          };

          utterance.onend = () => {
            setIsSpeaking(false);
            setSpeakingIndex(null);
            speechUtteranceRef.current = null;
            if (typeof window !== "undefined") {
              (window as any).__activeUtterance = null;
            }
          };

          utterance.onerror = (e) => {
            if (e.error !== "canceled" && e.error !== "interrupted") {
              console.warn("[TTS] Utterance error:", e.error);
            }
            setIsSpeaking(false);
            setSpeakingIndex(null);
            speechUtteranceRef.current = null;
            if (typeof window !== "undefined") {
              (window as any).__activeUtterance = null;
            }
          };

          // Store on window to prevent Chrome V8 garbage collection mid-speech
          (window as any).__activeUtterance = utterance;
          speechUtteranceRef.current = utterance;

          // Resume if audio context was suspended
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.error("[TTS] Speech execution failed:", err);
          setIsSpeaking(false);
          setSpeakingIndex(null);
        }
      }, 75);
    },
    []
  );

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (!next) {
        stopSpeaking();
      }
      return next;
    });
  }, [stopSpeaking]);

  const handleBubbleSpeak = useCallback(
    (index: number, text: string) => {
      if (isSpeaking && speakingIndex === index) {
        stopSpeaking();
      } else {
        speakText(text, index);
      }
    },
    [isSpeaking, speakingIndex, speakText, stopSpeaking]
  );

  // Voice input (STT) controller
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

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
    if (!isOpen) {
      stopSpeaking();
      stopListening();
    }
  }, [isOpen, stopSpeaking, stopListening]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      abortRef.current?.abort();
      stopSpeaking();
      stopListening();
    };
  }, [stopSpeaking, stopListening]);

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
    stopSpeaking();
    stopListening();
    targetRef.current = "";
    displayedRef.current = 0;
    setMessages([WELCOME_MESSAGE]);
    setCopiedIndex(null);
    setLiveMessage("");
    setIsLoading(false);
    setInput("");
    inputRef.current?.focus();
  }, [stopTimer, stopSpeaking, stopListening]);

  // --- Send / stream / reveal ----------------------------------------------

  const send = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || loadingRef.current) return;

      stopSpeaking();
      stopListening();

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
        if (!failure && voiceEnabledRef.current && content.trim()) {
          speakText(content, messagesRef.current.length - 1);
        }
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
              if (voiceEnabledRef.current && target.trim()) {
                speakText(target, messagesRef.current.length - 1);
              }
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
          if (voiceEnabledRef.current && targetRef.current.trim()) {
            speakText(targetRef.current, messagesRef.current.length - 1);
          }
        }
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return; // user stopped it
        finishWith("Network error — please try again in a moment.", true);
      }
    },
    [patchLast, stopTimer, speakText, stopSpeaking, stopListening]
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

  // Voice recognition callbacks using stable sendRef
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari."
      );
      return;
    }

    stopSpeaking();

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognitionRef.current = recognition;
      let finalTranscript = "";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            currentTranscript += transcript;
          }
        }
        const combined = (finalTranscript + currentTranscript).trim();
        if (combined) {
          setInput(combined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        const textToSend = finalTranscript.trim();
        if (textToSend) {
          void sendRef.current(textToSend);
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  }, [stopSpeaking]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Deliberately NOT aborted when the panel closes: this component stays
  // mounted, so letting the answer finish in the background means a visitor who
  // closes and reopens mid-answer finds the reply waiting instead of a dead
  // bubble. Teardown on real unmount is handled by the effect above.

  const stopGeneration = useCallback(() => {
    streamDoneRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    stopTimer();
    stopSpeaking();
    const partial = targetRef.current.slice(0, displayedRef.current);
    patchLast(partial.trim().length > 0 ? partial : "Stopped.");
    setIsLoading(false);
    setLiveMessage("Generation stopped.");
  }, [patchLast, stopTimer, stopSpeaking]);

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
            className="fixed bottom-24 left-4 right-4 z-[70] flex h-[min(560px,70dvh)] w-auto flex-col overflow-hidden rounded-[1.8rem] bg-[#0c131f] border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.85)] sm:left-auto sm:right-6 sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/[0.08] bg-[#0f1726] px-5 py-3.5">
              <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#61DAFB]/25 to-[#0097b2]/10 shadow-inner select-none">
                <span className="text-sm font-bold text-[#61DAFB]">H</span>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0b1118] bg-[#78FFB4]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white truncate">
                    Ask Huzaifa
                  </span>
                  <span className="rounded-md bg-[#61DAFB]/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-[#61DAFB]">
                    AI AGENT
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isSpeaking ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-end gap-0.5 h-2.5" aria-hidden="true">
                        <span className="w-0.5 bg-[#61DAFB] rounded-full animate-bounce [animation-delay:0ms] h-2" />
                        <span className="w-0.5 bg-[#61DAFB] rounded-full animate-bounce [animation-delay:150ms] h-3" />
                        <span className="w-0.5 bg-[#61DAFB] rounded-full animate-bounce [animation-delay:300ms] h-1.5" />
                      </div>
                      <span className="font-sans text-[10px] font-medium uppercase tracking-wider text-[#61DAFB]">
                        Speaking...
                      </span>
                    </div>
                  ) : isListening ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FF7878] animate-ping" />
                      <span className="font-sans text-[10px] font-medium uppercase tracking-wider text-[#FF7878]">
                        Listening...
                      </span>
                    </div>
                  ) : isLoading ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#61DAFB] animate-ping" />
                      <span className="font-sans text-[10px] uppercase tracking-wider text-[#61DAFB]/80">
                        Thinking...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#78FFB4] animate-pulse-react" />
                      <span className="font-sans text-[10px] uppercase tracking-wider text-white/50">
                        Online · Voice Ready
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {/* Voice Output Toggle (Mute / Unmute) */}
                <button
                  type="button"
                  onClick={toggleVoice}
                  aria-label={voiceEnabled ? "Mute voice replies" : "Enable voice replies"}
                  title={voiceEnabled ? "Voice enabled (Click to mute)" : "Voice muted (Click to unmute)"}
                  className={`grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none ${
                    voiceEnabled
                      ? "text-[#61DAFB] bg-[#61DAFB]/10 hover:bg-[#61DAFB]/20"
                      : "text-white/35 hover:bg-white/[0.06] hover:text-white/70"
                  }`}
                >
                  {voiceEnabled ? (
                    <Volume2 className={`h-4 w-4 ${isSpeaking ? "animate-pulse" : ""}`} />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </button>

                {/* Reset Chat */}
                <button
                  type="button"
                  onClick={clearChat}
                  aria-label="Start a new chat"
                  title="Start a new chat"
                  className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-xl text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80 focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                {/* Direct Close in Header */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                  title="Close chat"
                  className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-xl text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80 focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
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
                className="h-full space-y-3.5 overflow-y-auto px-4 py-4"
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
                      isSpeaking={speakingIndex === i}
                      onCopy={copyMessage}
                      onRetry={handleRetry}
                      onSpeak={handleBubbleSpeak}
                    />
                  );
                })}

                {/* Starter prompts — until the visitor asks something */}
                {messages.length === 1 && !isLoading && (
                  <div className="space-y-2.5 pt-3">
                    <div className="px-1 text-[11px] font-medium text-white/40 uppercase tracking-wider">
                      Suggested Questions
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => send(q)}
                          className="group flex items-center justify-between cursor-pointer rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-left text-[12px] text-white/75 transition-all hover:border-[#61DAFB]/35 hover:bg-[#61DAFB]/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none"
                        >
                          <span>{q}</span>
                          <span className="text-[#61DAFB] opacity-0 transition-opacity group-hover:opacity-100">
                            →
                          </span>
                        </button>
                      ))}
                    </div>
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
              className="border-t border-white/[0.08] bg-[#0f1726] px-3.5 py-3"
            >
              <label htmlFor="chat-input" className="sr-only">
                Ask a question about {SITE_CONFIG.name}
              </label>

              <div
                className={`flex items-center gap-1.5 rounded-2xl border p-1.5 transition-all duration-200 ${
                  isListening
                    ? "border-[#FF7878]/50 bg-[#FF7878]/[0.07] shadow-[0_0_20px_rgba(255,120,120,0.18)]"
                    : "border-white/10 bg-[#151f32] focus-within:border-[#61DAFB]/50 focus-within:bg-[#172338] focus-within:shadow-[0_0_0_3px_rgba(97,218,251,0.1)]"
                }`}
              >
                <input
                  id="chat-input"
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={
                    isListening
                      ? "Listening... speak now"
                      : "Ask about projects, skills, or hiring..."
                  }
                  maxLength={MAX_INPUT}
                  autoComplete="off"
                  className={`min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-[13.5px] text-white outline-none ${
                    isListening
                      ? "placeholder:text-[#FF7878]/90"
                      : "placeholder:text-white/40"
                  }`}
                />

                {/* Speech-to-Text Mic Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isLoading}
                  aria-label={isListening ? "Stop listening" : "Speak your question"}
                  title={isListening ? "Listening... Click to stop" : "Speak question with voice"}
                  className={`relative grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl transition-all duration-200 active:scale-95 ${
                    isListening
                      ? "border border-[#FF7878]/50 bg-[#FF7878]/20 text-[#FF7878] shadow-[0_0_14px_rgba(255,120,120,0.35)]"
                      : "text-white/55 hover:bg-white/[0.08] hover:text-white"
                  } disabled:cursor-not-allowed disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none`}
                >
                  {isListening && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-xl border border-[#FF7878]/60 animate-ping opacity-40"
                    />
                  )}
                  {isListening ? (
                    <MicOff className="relative h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>

                {/* Send or Stop Button */}
                {isLoading ? (
                  <button
                    type="button"
                    onClick={stopGeneration}
                    aria-label="Stop generating"
                    title="Stop generating"
                    className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-white/15 bg-white/10 text-white/85 transition-all duration-200 hover:bg-white/20 hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-[#61DAFB]/60 focus-visible:outline-none"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    aria-label="Send message"
                    title="Send message"
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                      input.trim()
                        ? "cursor-pointer bg-gradient-to-br from-[#61DAFB] to-[#0097b2] text-[#05070b] shadow-[0_2px_12px_rgba(97,218,251,0.35)] hover:brightness-110 active:scale-95"
                        : "cursor-not-allowed bg-white/[0.06] text-white/25"
                    }`}
                  >
                    <Send className="h-4 w-4 -translate-x-[0.5px] translate-y-[0.5px]" />
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
