import {
  Code2,
  Brain,
  Globe,
  Server,
  Database,
  Palette,
  Trophy,
  Award,
  Target,
  Users,
} from "lucide-react";

export const SITE_CONFIG = {
  name: "Mohammad Huzaifa",
  title: "Agentic AI Developer | Full-Stack Engineer | LLM Systems",
  description:
    "Portfolio of Mohammad Huzaifa — Agentic AI Developer, Full-Stack Engineer, and LLM Systems specialist.",
  email: "huzaifaqazi63@gmail.com",
  github: "https://github.com/MohammadHuzaifa-qazi",
  linkedin: "https://www.linkedin.com/in/muhammad-huzaifa-5b79502ba/",
};

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Achievements", href: "#achievements" },
  { label: "Contact", href: "#contact" },
];

export const STATS = [
  { label: "Projects", value: 5, icon: Target },
  { label: "Hackathons", value: 3, icon: Trophy },
  { label: "Repositories", value: 44, suffix: "+", icon: Award },
  { label: "Freelance Clients", value: 1, icon: Users },
];

export const SKILLS = [
  {
    category: "Languages",
    icon: Code2,
    skills: ["Python", "TypeScript", "JavaScript"],
  },
  {
    category: "AI / LLM",
    icon: Brain,
    skills: [
      "OpenAI Agents SDK",
      "LangChain",
      "LangGraph",
      "RAG",
      "Prompt Engineering",
      "Tool-Calling",
      "Agent Orchestration",
    ],
  },
  {
    category: "Frameworks",
    icon: Globe,
    skills: ["Next.js 16", "FastAPI"],
  },
  {
    category: "DevOps",
    icon: Server,
    skills: ["Docker", "Git", "GitHub", "Vercel"],
  },
  {
    category: "Databases",
    icon: Database,
    skills: ["PostgreSQL (Neon Serverless)", "SQLModel"],
  },
  {
    category: "UI / Styling",
    icon: Palette,
    skills: ["Tailwind CSS v4", "Framer Motion", "Responsive Design"],
  },
];

export const PROJECTS = [
  {
    title: "Full-Stack Todo App",
    description:
      "Built a multi-user task management app with secure JWT authentication, enabling full CRUD operations and per-user data isolation.",
    tech: ["Python", "FastAPI", "Next.js 16", "PostgreSQL", "Docker", "JWT"],
    liveUrl: "https://hackathon-todoapp-five.vercel.app",
    githubUrl: "#",
    tag: "Hackathon II",
  },
  {
    title: "AI Textbook Generator",
    description:
      "Generated a complete textbook on Physical AI & Humanoid Robotics using spec-driven development and AI-assisted content generation.",
    tech: ["Python", "FastAPI", "RAG", "Docusaurus"],
    liveUrl: "https://huzaifaqazi.github.io/Hackathon_Book_Generated",
    githubUrl: "#",
    tag: "Hackathon I",
  },
  {
    title: "Central Scents",
    description:
      "Designed and developed a premium brand showcase for a real client featuring parallax scroll, glass-morphism UI, and animated product pages.",
    tech: ["Next.js 16", "Tailwind CSS v4", "Framer Motion", "Web3Forms"],
    liveUrl: "https://central-scents-perfume-store.vercel.app",
    githubUrl: "#",
    tag: "Freelance Client",
  },
  {
    title: "ThermalOS",
    description:
      "Collaborated in a team to build ThermalOS within a competitive hackathon format, contributing to both backend and frontend development.",
    tech: ["Python", "FastAPI", "Next.js", "Docker"],
    liveUrl: "#",
    githubUrl: "https://github.com/MohammadHuzaifa-qazi/ThermalOS",
    tag: "Team Project",
  },
  {
    title: "RAG Resume Chatbot",
    description:
      "Built a retrieval-augmented chatbot that answers questions about my resume — embeds resume data, retrieves relevant context, and generates accurate responses.",
    tech: ["Python", "Streamlit", "RAG", "LangChain", "GroqLLM"],
    liveUrl: "https://huzaifa-resume-chatbot.streamlit.app/",
    githubUrl: "#",
    tag: "AI Rag Project",
  },
  {
    title: "LangGraph Agentic Pipeline",
    description:
      "Developed a complex agentic pipeline using LangGraph state machines for multi-step AI workflows.",
    tech: ["Python", "LangGraph", "LangChain"],
    liveUrl: "#",
    githubUrl: "#",
    tag: "AI Project",
  },
];

export const ACHIEVEMENTS = [
  {
    title: "GIAIC Hackathon II",
    description: "Spec-Driven Full-Stack Development",
    date: "2024",
  },
  {
    title: "GIAIC Hackathon I",
    description: "Physical AI Textbook with RAG chatbot backend",
    date: "2024",
  },
  {
    title: "Forty Guard Hackathon",
    description: "ThermalOS — Team Project",
    date: "2024",
  },
  {
    title: "99th Percentile, Grade A",
    description: "Governor's Initiative for AI, Web 3.0 & Metaverse (Q3 Assessment)",
    date: "2024",
  },
  {
    title: "Agentic AI & OpenAI Agents SDK",
    description: "Certification — Governor's Initiative",
    date: "2024",
  },
  {
    title: "LangChain & LangGraph for Agentic AI",
    description: "Certification — Governor's Initiative",
    date: "2024",
  },
];
