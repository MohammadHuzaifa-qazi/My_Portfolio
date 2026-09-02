"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key:
            process.env.NEXT_PUBLIC_WEB3FORMS_KEY ||
            "6ae0e455-a422-426d-b380-6dfd1dd88c4a",
          subject: `Portfolio message from ${formData.name}`,
          from_name: "Portfolio Contact Form",
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
        setFormData({ name: "", email: "", message: "" });
      } else {
        setError(
          result.message || "Something went wrong. Please try again or email me directly."
        );
      }
    } catch {
      setError("Network error. Please try again or email me directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative py-24 px-6 md:px-12 lg:px-20">
      <div className="absolute right-[20%] bottom-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(120,255,180,.06),transparent_70%)] blur-3xl" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="font-sans text-[11px] uppercase tracking-[0.3em] text-white/35 mb-6">Get in Touch</div>
          <h2 className="text-4xl md:text-6xl font-bold mb-16 tracking-[-0.04em]">
            Let&apos;s <span className="text-[#61DAFB]">Connect</span>
          </h2>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <p className="text-white/45 text-lg leading-relaxed">
                Have a project in mind or want to collaborate? Feel free to reach
                out. I&apos;m always open to discussing new opportunities.
              </p>

              <div className="space-y-4">
                <a
                  href={SITE_CONFIG.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="liquid-panel flex items-center gap-4 p-4 rounded-[1.6rem] transition-all duration-300 hover:border-[#61DAFB]/30 group"
                >
                  <div className="p-3 rounded-[1rem] bg-[#61DAFB]/10 group-hover:bg-[#61DAFB]/15 transition-colors">
                    <GitHubIcon className="w-5 h-5 text-[#61DAFB]" />
                  </div>
                  <span className="text-white/50 group-hover:text-white transition-colors font-sans text-sm">
                    GitHub
                  </span>
                </a>

                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="liquid-panel flex items-center gap-4 p-4 rounded-[1.6rem] transition-all duration-300 hover:border-[#61DAFB]/30 group"
                >
                  <div className="p-3 rounded-[1rem] bg-[#61DAFB]/10 group-hover:bg-[#61DAFB]/15 transition-colors">
                    <Mail className="w-5 h-5 text-[#61DAFB]" />
                  </div>
                  <span className="text-white/50 group-hover:text-white transition-colors font-sans text-sm">
                    Email
                  </span>
                </a>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="liquid-panel rounded-[2.5rem] p-10 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-[#61DAFB]/10 flex items-center justify-center mx-auto mb-6">
                    <div className="text-2xl text-[#61DAFB]">✓</div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Message Sent!
                  </h3>
                  <p className="text-white/40">
                    Thank you for reaching out. I&apos;ll get back to you soon.
                  </p>
                </motion.div>
              ) : (
                <div className="liquid-panel rounded-[2.5rem] p-8 space-y-6">
                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-white/35 mb-3">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-5 py-4 rounded-[1.4rem] bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/20 focus:border-[#61DAFB]/50 focus:outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-white/35 mb-3">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-5 py-4 rounded-[1.4rem] bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/20 focus:border-[#61DAFB]/50 focus:outline-none transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-white/35 mb-3">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="w-full px-5 py-4 rounded-[1.4rem] bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/20 focus:border-[#61DAFB]/50 focus:outline-none transition-colors resize-none"
                      placeholder="Your message..."
                    />
                  </div>

                  {error && (
                    <p className="text-red-400/90 text-sm text-center">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="dew w-full flex items-center justify-center gap-3 px-8 py-4 rounded-[1.8rem] font-sans text-[11px] uppercase tracking-[0.2em] text-white disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
