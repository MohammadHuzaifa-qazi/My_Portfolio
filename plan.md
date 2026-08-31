# 🚀 Mohammad Huzaifa — Portfolio Website Plan

## Project Overview

| Item | Detail |
|------|--------|
| **Name** | Mohammad Huzaifa Portfolio |
| **Type** | Single-Page Application (SPA) |
| **Framework** | Next.js 16 (App Router) |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion |
| **UI Libraries** | Aceternity UI + Magic UI |
| **Theme** | Midnight Ocean — Dark (#0a0f1c) + Cyan (#00d4ff) |
| **Mode** | Dark/Light toggle |
| **Deployment** | Vercel |
| **Contact API** | Web3Forms |
| **Phase** | Phase 1 (Phase 2 = RAG Chatbot) |

---

## 🎨 Color Palette

### Dark Mode (Default)
| Token | Color | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0f1c` | Main background |
| `--bg-secondary` | `#111827` | Card backgrounds |
| `--accent` | `#00d4ff` | Primary accent (cyan) |
| `--accent-hover` | `#00b8d4` | Hover states |
| `--text-primary` | `#ffffff` | Headings |
| `--text-secondary` | `#94a3b8` | Body text |
| `--border` | `#1e293b` | Borders |

### Light Mode
| Token | Color | Usage |
|-------|-------|-------|
| `--bg-primary` | `#f8fafc` | Main background |
| `--bg-secondary` | `#ffffff` | Card backgrounds |
| `--accent` | `#00b8d4` | Primary accent (darker cyan for contrast) |
| `--text-primary` | `#0f172a` | Headings |
| `--text-secondary` | `#475569` | Body text |
| `--border` | `#e2e8f0` | Borders |

---

## 📁 File Structure

```
portfolio/
├── app/
│   ├── layout.tsx                 # Root layout, metadata, fonts
│   ├── page.tsx                   # Main page (all sections)
│   ├── globals.css                # Global styles + CSS variables
│   └── 404.tsx                    # Custom 404 page
├── components/
│   ├── LoadingScreen.tsx          # Animated loading screen
│   ├── Navbar.tsx                 # Floating navbar + hamburger + theme toggle
│   ├── Hero.tsx                   # Full-screen intro + particles
│   ├── About.tsx                  # Bio + education + stats + Download CV
│   ├── Skills.tsx                 # 6 skill category cards
│   ├── Projects.tsx               # 6 project cards
│   ├── Achievements.tsx           # Timeline section
│   ├── GitHubStats.tsx            # GitHub contribution graph
│   ├── Contact.tsx                # Web3Forms form + social links
│   └── ui/
│       ├── particle.tsx           # Magic UI particle background
│       ├── card-spotlight.tsx     # Aceternity spotlight on hover
│       ├── text-generate.tsx      # Aceternity text animation
│       ├── glow-button.tsx        # Magic UI glowing button
│       ├── loading-spinner.tsx    # Loading animation
│       ├── theme-toggle.tsx       # Sun/Moon toggle button
│       ├── hamburger-menu.tsx     # Mobile menu icon
│       └── mobile-menu.tsx        # Mobile slide-in menu
├── hooks/
│   ├── useTheme.ts                # Dark/light mode logic + localStorage
│   └── useScrollSpy.ts           # Active navbar link tracking
├── lib/
│   ├── constants.ts               # All data (projects, skills, links)
│   ├── web3forms.ts               # Form submission helper
│   └── utils.ts                   # Utility functions
├── public/
│   ├── images/
│   │   ├── avatar.png             # Profile photo
│   │   ├── projects/              # Project screenshots
│   │   └── og-image.png           # Open Graph image
│   ├── Huzaifa_CV.pdf             # Downloadable CV
│   ├── favicon.ico                # Browser tab icon
│   └── robots.txt                 # SEO
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── plan.md                        # This file
```

---

## 📐 Sections Detail

### Section 0: Loading Screen
**Component:** `LoadingScreen.tsx`

| Element | Detail |
|---------|--------|
| Background | `#0a0f1c` (full screen) |
| Animation | Gradient spinner OR name fade-in |
| Duration | 2 seconds |
| Exit | Fade out → reveal portfolio |

```
┌─────────────────────────────────────┐
│                                     │
│         Loading...                  │
│      ──────●──────  (spinner)      │
│                                     │
└─────────────────────────────────────┘
```

---

### Section 1: Navbar
**Component:** `Navbar.tsx`

| Element | Detail |
|---------|--------|
| Style | Floating, glass-morphism (`backdrop-blur`) |
| Position | Fixed top, centered |
| Links | Home, About, Skills, Projects, Achievements, Contact |
| Right side | Theme toggle (Sun/Moon icon) |
| Mobile | Hamburger icon → slide-in menu from right |
| Scroll effect | Background becomes opaque on scroll |

**Desktop:**
```
┌──────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────┐  │
│  │ MH  Home  About  Skills  Projects  Contact  ☀ │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Mobile:**
```
┌────────────────────┐
│  MH           [☰]  │  ← tap hamburger
└────────────────────┘

┌────────────────────┐
│ MH           [✕]   │  ← slide-in menu
│ ─────────────────  │
│ Home               │
│ About              │
│ Skills             │
│ Projects           │
│ Achievements       │
│ Contact            │
│ ☀ / 🌙            │
└────────────────────┘
```

---

### Section 2: Hero
**Component:** `Hero.tsx`

| Element | Detail | Animation |
|---------|--------|-----------|
| Background | Particles (Magic UI) + gradient orbs | Continuous floating |
| Greeting | "Hi, I'm" | Fade in from bottom (0.4s) |
| Name | "Mohammad Huzaifa" | Gradient text, slide up (0.6s) |
| Subtitle | "Agentic AI Developer \| Full-Stack Engineer \| LLM Systems" | Typing effect (1s) |
| CTA 1 | "View Projects" → `#projects` | Glow button, fade in (1.5s) |
| CTA 2 | "Contact Me" → `#contact` | Outline button, fade in (1.8s) |
| Scroll indicator | Down arrow | Bouncing animation |

**NO social icons in Hero** — shifted to Contact section.

```
┌─────────────────────────────────────────────┐
│                                             │
│         ✦ ✦ ✦ Particles ✦ ✦ ✦             │
│                                             │
│            Hi, I'm                          │
│       Mohammad Huzaifa                      │
│                                             │
│   Agentic AI Developer | Full-Stack         │
│   Engineer | LLM Systems                    │
│                                             │
│     [ View Projects ]  [ Contact Me ]       │
│                                             │
│              ↓                              │
└─────────────────────────────────────────────┘
```

---

### Section 3: About
**Component:** `About.tsx`

| Element | Detail |
|---------|--------|
| Bio | 2-3 lines from CV professional summary |
| Education | BSAI @ SMI University (5th Semester, 2028) |
| Certification | GIAIC — AI, Web 3.0 & Metaverse (Batch 1) |
| Download CV | Button → downloads `Huzaifa_CV.pdf` |
| Stats | 5 Projects, 3 Hackathons, 99th Percentile, 1 Freelance Client |

**Stats Animation:** Counter from 0 → target number on scroll.

```
┌─────────────────────────────────────────────┐
│  ABOUT ME                                    │
│                                              │
│  BSAI undergraduate... [bio text]            │
│                                              │
│  ┌──────────┐  ┌──────────┐                 │
│  │ Education│  │ Cert     │  [Download CV]   │
│  │ BSAI     │  │ GIAIC    │                 │
│  │ SMI Uni  │  │ Batch 1  │                 │
│  └──────────┘  └──────────┘                 │
│                                              │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐            │
│  │ 5  │  │ 3  │  │99th│  │ 1  │            │
│  │Proj│  │Hack│  │ %ile│  │Clnt│            │
│  └────┘  └────┘  └────┘  └────┘            │
└─────────────────────────────────────────────┘
```

---

### Section 4: Skills
**Component:** `Skills.tsx`

| Category | Skills |
|----------|--------|
| Languages | Python, TypeScript, JavaScript |
| AI / LLM | OpenAI Agents SDK, LangChain, LangGraph, RAG, Prompt Engineering, Tool-Calling, Agent Orchestration |
| Frameworks | Next.js 16, FastAPI |
| DevOps | Docker, Git, GitHub, Vercel |
| Databases | PostgreSQL (Neon Serverless), SQLModel |
| UI / Styling | Tailwind CSS v4, Framer Motion, Responsive Design |

**Card Animation:** Hover → scale up + glow border + spotlight effect.

```
┌─────────────────────────────────────────────┐
│  SKILLS                                      │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │Languages │ │ AI / LLM │ │Frameworks│    │
│  │ Python   │ │ OpenAI   │ │ Next.js  │    │
│  │ TS, JS   │ │ LangChain│ │ FastAPI  │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ DevOps   │ │Databases │ │UI/Styling│    │
│  │ Docker   │ │PostgreSQL│ │ Tailwind │    │
│  │ Git, CI  │ │ SQLModel │ │ Framer   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
└─────────────────────────────────────────────┘
```

---

### Section 5: Projects
**Component:** `Projects.tsx`

| # | Project | Tech Stack | Link | Note |
|---|---------|-----------|------|------|
| 1 | Full-Stack Todo App | FastAPI, Next.js, PostgreSQL, Docker, JWT | hackathon-todoapp-five.vercel.app | Hackathon II |
| 2 | AI Textbook Generator | FastAPI, RAG, Docusaurus | huzaifaqazi.github.io/Hackathon_Book_Generated | Hackathon I |
| 3 | Central Scents | Next.js, Tailwind, Framer Motion | central-scents-perfume-store.vercel.app | Freelance Client |
| 4 | ThermalOS | FastAPI, Next.js, Docker | github.com/MohammadHuzaifa-qazi/ThermalOS | **Team Project** |
| 5 | AI Customer Support Agent | FastAPI, OpenAI SDK | [Placeholder] | — |
| 6 | LangGraph Agentic Pipeline | Python, LangGraph | [Placeholder] | — |

**Card Animation:** 3D tilt on hover + glow border + spotlight.

```
┌─────────────────────────────────────────────┐
│  PROJECTS                                     │
│                                              │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ Todo App     │  │ AI Textbook  │        │
│  │ [screenshot] │  │ [screenshot] │        │
│  │ FastAPI...   │  │ RAG...       │        │
│  │ [Live] [Git] │  │ [Live] [Git] │        │
│  └──────────────┘  └──────────────┘        │
│                                              │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ Central Scents│  │ ThermalOS   │        │
│  │ [screenshot] │  │ [screenshot] │        │
│  │ Next.js...   │  │ FastAPI...   │        │
│  │ [Live] [Git] │  │ [Git]        │        │
│  │ Freelance ✦  │  │ Team Project │        │
│  └──────────────┘  └──────────────┘        │
│                                              │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ AI Support   │  │ LangGraph    │        │
│  │ [screenshot] │  │ [screenshot] │        │
│  │ FastAPI...   │  │ Python...    │        │
│  │ [Live] [Git] │  │ [Live] [Git] │        │
│  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────┘
```

---

### Section 6: Achievements
**Component:** `Achievements.tsx`

| Achievement | Detail |
|-------------|--------|
| GIAIC Hackathon II | Spec-Driven Full-Stack Development |
| GIAIC Hackathon I | Physical AI Textbook with RAG chatbot |
| Forty Guard Hackathon | ThermalOS — Team Project |
| 99th Percentile | Grade A — GIAIC Q3 Assessment |
| Certification 1 | Agentic AI & OpenAI Agents SDK |
| Certification 2 | LangChain & LangGraph for Agentic AI |

**Animation:** Timeline line draws as you scroll, items fade in staggered.

```
┌─────────────────────────────────────────────┐
│  ACHIEVEMENTS                                │
│                                              │
│  ●─── GIAIC Hackathon II (2024)             │
│  │    Spec-Driven Full-Stack Development    │
│  │                                          │
│  ●─── GIAIC Hackathon I (2024)              │
│  │    AI Textbook + RAG Chatbot            │
│  │                                          │
│  ●─── Forty Guard Hackathon                 │
│  │    ThermalOS — Team Project             │
│  │                                          │
│  ●─── 99th Percentile, Grade A             │
│  │                                          │
│  ●─── Certifications (2)                    │
│       OpenAI Agents SDK + LangGraph        │
└─────────────────────────────────────────────┘
```

---

### Section 7: GitHub Stats
**Component:** `GitHubStats.tsx`

| Element | Detail |
|---------|--------|
| GitHub username | MohammadHuzaifa-qazi |
| Stats card | Contributions, repos, stars |
| Contribution graph | Green squares grid |
| Source | GitHub Readme Stats API / Contribution Graph |

```
┌─────────────────────────────────────────────┐
│  GITHUB STATS                                │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │  MohammadHuzaifa-qazi               │    │
│  │                                     │    │
│  │  Contributions: ████░░░░ 150+      │    │
│  │  Repositories: 10+                  │    │
│  │  Stars: 5+                          │    │
│  │                                     │    │
│  │  [GitHub Profile →]                 │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │  █ █ █ █ █ █ █ █ █ █ █ █ █ █ █    │    │
│  │  █ █ ░ █ █ █ ░ █ █ █ █ █ █ █ ░    │    │
│  │  █ █ █ █ ░ █ █ █ █ ░ █ █ █ █ █    │    │
│  │  (contribution graph)               │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

### Section 8: Contact
**Component:** `Contact.tsx`

| Element | Detail |
|---------|--------|
| Form | Name, Email, Message → Web3Forms API |
| Social Links | GitHub, LinkedIn, Fiverr, Email |
| NO phone number | Removed per user request |
| NO direct email | Form only |

```
┌─────────────────────────────────────────────┐
│  CONTACT                                     │
│                                              │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │  Send Message    │  │  Connect       │  │
│  │                  │  │                │  │
│  │  Name: [______] │  │  ┌──────────┐  │  │
│  │                  │  │  │  GitHub  │  │  │
│  │  Email: [_____] │  │  └──────────┘  │  │
│  │                  │  │  ┌──────────┐  │  │
│  │  Message:        │  │  │ LinkedIn │  │  │
│  │  [________]      │  │  └──────────┘  │  │
│  │  [________]      │  │  ┌──────────┐  │  │
│  │                  │  │  │  Fiverr  │  │  │
│  │  [Send Message]  │  │  └──────────┘  │  │
│  │                  │  │  ┌──────────┐  │  │
│  │                  │  │  │  Email   │  │  │
│  │                  │  │  └──────────┘  │  │
│  └──────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🎬 Animations Summary

| Section | Animation | Library |
|---------|-----------|---------|
| Loading | Spinner/fade | Framer Motion |
| Navbar | Blur on scroll | CSS + Framer |
| Hero | Particles + typing + stagger | Magic UI + Framer |
| About | Scroll fade-in + counter | Framer Motion |
| Skills | Card hover scale/glow | Aceternity UI |
| Projects | 3D tilt + spotlight | Aceternity UI |
| Achievements | Timeline draw | Framer Motion |
| GitHub Stats | Graph fade-in | Framer Motion |
| Contact | Form focus animations | Framer Motion |
| All sections | Scroll-triggered reveal | Framer Motion `whileInView` |

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Changes |
|------------|-------|---------|
| Mobile | < 768px | Hamburger menu, stacked grid, smaller text |
| Tablet | 768 - 1024px | 2-column grid, reduced padding |
| Desktop | > 1024px | Full layout, 3-column grid |
| Large | > 1536px | Max-width container, larger fonts |

---

## 🔧 Dependencies

```json
{
  "next": "^16.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "framer-motion": "^12.0.0",
  "tailwindcss": "^4.0.0",
  "@tailwindcss/postcss": "^4.0.0",
  "clsx": "^2.1.0",
  "lucide-react": "^0.400.0"
}
```

**Aceternity UI & Magic UI:** Components will be implemented directly (not npm packages — they are copy-paste component libraries).

---

## ✅ Pre-Launch Checklist

- [ ] All 9 components built
- [ ] Dark/Light mode working
- [ ] Mobile responsive
- [ ] All animations smooth
- [ ] Web3Forms integration tested
- [ ] CV download working
- [ ] All project links working
- [ ] SEO metadata added
- [ ] Favicon added
- [ ] Custom 404 page
- [ ] Vercel Analytics added
- [ ] Lighthouse score > 90
- [ ] Deployed to Vercel

---

## 📊 Plan Grade: 95/100

### Phase 2 Preview: RAG Chatbot
- Floating chat widget (bottom-right)
- Built with LangChain + OpenAI
- Knowledge base: CV + project data
- Typing animation in responses
- Showcases actual AI skills

---

*Last Updated: 2026-08-28*
*Status: Ready for Development*