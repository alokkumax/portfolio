"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Project = {
  title: string;
  description: string;
  tech: string[];
  demoUrl: string;
  sourceUrl: string;
};

type ThemeName = "dark" | "matrix" | "solarized" | "light";

type CommandResultLine = {
  id: string;
  html: string;
};

type OutputBlock = {
  id: string;
  lines: CommandResultLine[];
};

const CONFIG = {
  promptUser: "alokkumax",
  promptHost: "portfolio",
  location: "~/",
  typingMsPerChar: 10,
  outputMsPerChar: 6,
  pageSize: 5,
  email: "hello@example.com",
  socials: {
    github: "https://github.com/yourname",
    linkedin: "https://www.linkedin.com/in/yourname/",
    twitter: "https://twitter.com/yourname",
  },
  resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  bio: {
    name: "Alok Kumar Sah",
    role: "Frontend Engineer",
    location: "Somewhere, Earth",
    about:
      "I craft fast, accessible web apps. I enjoy systems design, DX, and beautiful UIs.",
    skills: [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Tailwind CSS",
      "Testing",
    ],
  },
  projects: [
    {
      title: "zensu",
      description: "A calm productivity tool focused on flow and minimal UI.",
      tech: ["Next.js", "TypeScript", "Tailwind"],
      demoUrl: "#",
      sourceUrl: "https://github.com/alokkumax/zensu",
    },
    {
      title: "danger ahead",
      description: "Realtime hazard alerts demo with map overlays.",
      tech: ["React", "WebSocket", "Maplibre"],
      demoUrl: "#",
      sourceUrl: "https://github.com/alokkumax/danger-ahead",
    },
    {
      title: "groceryCMS",
      description: "Headless CMS starter for small grocery catalogs.",
      tech: ["Next.js", "Prisma", "SQLite"],
      demoUrl: "#",
      sourceUrl: "https://github.com/alokkumax/groceryCMS",
    },
    {
      title: "echomeets",
      description: "Lightweight audio-first meeting notes with transcripts.",
      tech: ["TypeScript", "Web Audio", "VAD"],
      demoUrl: "#",
      sourceUrl: "https://github.com/alokkumax/echomeets",
    },
  ] as Project[],
};

const THEMES: Record<ThemeName, Record<string, string>> = {
  dark: {
    "--bg": "#0b0e14",
    "--fg": "#e6edf3",
    "--muted": "#9aa4b2",
    "--accent": "#7aa2f7",
    "--cursor": "#d0d7de",
    "--link": "#93c5fd",
    "--tag": "#10b981",
  },
  matrix: {
    "--bg": "#000",
    "--fg": "#c2f5c2",
    "--muted": "#79c379",
    "--accent": "#00ff66",
    "--cursor": "#b8ffb8",
    "--link": "#7CFFB2",
    "--tag": "#00e676",
  },
  solarized: {
    "--bg": "#002b36",
    "--fg": "#eee8d5",
    "--muted": "#93a1a1",
    "--accent": "#b58900",
    "--cursor": "#fdf6e3",
    "--link": "#6c71c4",
    "--tag": "#2aa198",
  },
  light: {
    "--bg": "#f8fafc",
    "--fg": "#0f172a",
    "--muted": "#334155",
    "--accent": "#2563eb",
    "--cursor": "#0f172a",
    "--link": "#1d4ed8",
    "--tag": "#059669",
  },
};

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    const raw = window.localStorage.getItem(key);
    if (raw == null) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Handle legacy values that were stored as plain strings (e.g., light)
      return (raw as unknown) as T;
    }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

export default function Home() {
  const [theme, setTheme] = useLocalStorage<ThemeName>("theme", "dark");
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useLocalStorage<string[]>("history", []);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<OutputBlock[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Apply theme variables
  useEffect(() => {
    const vars = THEMES[theme];
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    setMounted(true);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight });
  }, [output]);

  const prompt = useMemo(
    () => (
      <span>
        <span className="text-[var(--tag)]">{CONFIG.promptUser}</span>
        <span className="text-[var(--muted)]">@</span>
        <span className="text-[var(--accent)]">{CONFIG.promptHost}</span>
        <span className="text-[var(--muted)]">:{CONFIG.location}$</span>
      </span>
    ),
    []
  );

  function toggleTheme() {
    const next: ThemeName = theme === "light" ? "dark" : "light";
    setTheme(next);
  }

  function print(lines: string[]) {
    const id = crypto.randomUUID();
    const block: OutputBlock = {
      id,
      lines: lines.map((html) => ({ id: crypto.randomUUID(), html })),
    };
    setOutput((o) => [...o, block]);
  }

  async function handleCommand(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;
    setHistory((h) => [...h, cmd]);
    setHistoryIdx(-1);
    setInput("");

    const [name, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ");

    switch (name.toLowerCase()) {
      case "/help": {
        if (arg) {
          const details: Record<string, string> = {
            "/help": "Usage: /help [command] — show available commands or details.",
            "/projects":
              "Usage: /projects [page] — paginated list. 'open <n>' to open.",
            "/about": "Usage: /about — short bio, role, location, skills.",
            "/contact":
              "Usage: /contact — email and socials. 'copy email' to clipboard.",
            "/resume": "Usage: /resume — open/download resume PDF.",
            "/theme":
              "Usage: /theme <light|dark|matrix|solarized> — switch theme.",
            "/clear": "Usage: /clear — clear terminal history (alias: cls).",
          };
          const text = details[arg] || `No details for '${arg}'.`;
          print([escapeHtml(text)]);
          return;
        }
        print([
          strong("Available commands:"),
          code("/help"),
          code("/help <command>"),
          code("/projects [page]"),
          code("open <n>"),
          code("/about"),
          code("/contact"),
          code("/resume"),
          code("/theme <light|dark|matrix|solarized>"),
          code("/clear | cls"),
        ]);
        return;
      }
      case "/projects": {
        const page = Math.max(1, parseInt(rest[0] || "1", 10) || 1);
        const start = (page - 1) * CONFIG.pageSize;
        const slice = CONFIG.projects.slice(start, start + CONFIG.pageSize);
        const totalPages = Math.max(1, Math.ceil(CONFIG.projects.length / CONFIG.pageSize));
        if (slice.length === 0) {
          print([`No projects on page ${page}.`]);
          return;
        }
        const lines: string[] = [`Projects (page ${page}/${totalPages}):`];
        slice.forEach((p, i) => {
          const index = start + i + 1;
          const tags = p.tech.map((t) => `<span class='tag'>${escapeHtml(t)}</span>`).join(" ");
          lines.push(
            `${index}. <span class='title'>${escapeHtml(p.title)}</span> — ${escapeHtml(
              p.description
            )} <span class='dim'>${tags}</span> \n <a href='${p.demoUrl}' target='_blank' rel='noreferrer'>demo</a> · <a href='${p.sourceUrl}' target='_blank' rel='noreferrer'>source</a>`
          );
        });
        lines.push("Type 'open <n>' to open demo in a new tab.");
        print(lines);
        return;
      }
      case "open": {
        const n = parseInt(rest[0] || "", 10);
        if (!n) {
          print(["Usage: open <n> — open the nth project demo."]);
          return;
        }
        const proj = CONFIG.projects[n - 1];
        if (!proj) {
          print([`Project ${n} not found.`]);
          return;
        }
        window.open(proj.demoUrl, "_blank");
        print([`Opening ${escapeHtml(proj.title)}...`]);
        return;
      }
      case "/about": {
        const b = CONFIG.bio;
        print([
          strong(`${b.name} — ${b.role}`),
          `${escapeHtml(b.location)}`,
          `${escapeHtml(b.about)}`,
          `Skills: ${b.skills.map((s) => `<span class='tag'>${escapeHtml(s)}</span>`).join(" ")}`,
        ]);
        return;
      }
      case "/contact": {
        const s = CONFIG.socials;
        print([
          `Email: <a href='mailto:${CONFIG.email}'>${CONFIG.email}</a> (type 'copy email')`,
          `GitHub: <a href='${s.github}' target='_blank' rel='noreferrer'>${s.github}</a>`,
          `LinkedIn: <a href='${s.linkedin}' target='_blank' rel='noreferrer'>${s.linkedin}</a>`,
          `Twitter: <a href='${s.twitter}' target='_blank' rel='noreferrer'>${s.twitter}</a>`,
        ]);
        return;
      }
      case "copy": {
        if (arg.toLowerCase() === "email") {
          try {
            await navigator.clipboard.writeText(CONFIG.email);
            print(["Email copied to clipboard."]);
          } catch {
            print(["Copy failed — your browser blocked clipboard access."]);
          }
        } else {
          print(["Usage: copy email"]);
        }
        return;
      }
      case "/resume": {
        window.open(CONFIG.resumeUrl, "_blank");
        print(["Opening resume.pdf …"]);
        return;
      }
      case "/theme": {
        const t = rest[0]?.toLowerCase() as ThemeName | undefined;
        if (!t || !(t in THEMES)) {
          print(["Usage: /theme <light|dark|matrix|solarized>"]);
          return;
        }
        setTheme(t);
        print([`Theme set to ${t}.`]);
        return;
      }
      case "/clear":
      case "cls": {
        setOutput([]);
        return;
      }
      default: {
        if (name.toLowerCase() === "search") {
          const term = arg.toLowerCase();
          if (!term) {
            print(["Usage: search <term>"]);
            return;
          }
          const matches = CONFIG.projects
            .map((p, i) => ({
              p,
              i,
              hay: `${p.title} ${p.description} ${p.tech.join(" ")}`.toLowerCase(),
            }))
            .filter((r) => term.split(/\s+/).every((q) => r.hay.includes(q)));
          if (matches.length === 0) {
            print([`No matches for '${escapeHtml(term)}'.`]);
            return;
          }
          print([
            strong(`Search results (${matches.length}):`),
            ...matches.map((m) =>
              `${m.i + 1}. <span class='title'>${escapeHtml(m.p.title)}</span> — ${escapeHtml(
                m.p.description
              )}`
            ),
          ]);
          return;
        }
        print([`Command not found: ${escapeHtml(name)}. Type /help.`]);
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleCommand(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(idx);
      setInput(history[idx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = historyIdx === -1 ? -1 : Math.min(history.length - 1, historyIdx + 1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? "" : history[idx] || "");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] font-mono flex items-center justify-center p-4">
      <main
        role="region"
        aria-label="Terminal"
        className="w-full max-w-3xl rounded-xl border border-[color:color-mix(in_oklab,var(--fg)_15%,transparent)] bg-[color:color-mix(in_oklab,var(--bg)_88%,var(--fg)_6%)] shadow-2xl backdrop-blur-sm overflow-hidden"
        onClick={() => inputRef.current?.focus()}
      >
        <header className="flex items-center gap-2 px-4 py-2 border-b border-[color:color-mix(in_oklab,var(--fg)_15%,transparent)] bg-[color:color-mix(in_oklab,var(--bg)_80%,var(--fg)_8%)]">
          <div className="flex gap-1">
            <span className="size-3 rounded-full bg-red-500/80" />
            <span className="size-3 rounded-full bg-yellow-400/80" />
            <span className="size-3 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-2 text-xs text-[var(--muted)]">{CONFIG.promptUser}@{CONFIG.promptHost}</span>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
            aria-pressed={mounted ? (theme === "light") : undefined}
            className="ml-auto text-xs text-[var(--muted)] hover:text-[var(--fg)] transition-colors rounded px-2 py-1 border border-[color:color-mix(in_oklab,var(--fg)_20%,transparent)] bg-[color:color-mix(in_oklab,var(--bg)_70%,var(--fg)_6%)]"
            suppressHydrationWarning
          >
            <span suppressHydrationWarning>{mounted ? (theme === "light" ? "light" : "dark") : ""}</span>
          </button>
        </header>

        <section
          ref={containerRef}
          className="max-h-[70vh] md:max-h-[60vh] overflow-y-auto px-6 py-5 space-y-2 focus:outline-none"
          role="log"
          aria-live="polite"
        >
          {output.map((block) => (
            <div key={block.id} className="animate-fadein">
              {block.lines.map((l) => (
                <div
                  key={l.id}
                  className="whitespace-pre-wrap leading-relaxed [word-break:break-word]"
                  dangerouslySetInnerHTML={{ __html: l.html }}
                />
              ))}
            </div>
          ))}
        </section>

        <footer className="px-4 py-3 border-t border-[color:color-mix(in_oklab,var(--fg)_15%,transparent)] bg-[color:color-mix(in_oklab,var(--bg)_85%,var(--fg)_4%)]">
          <div className="flex items-center gap-2">
            <span className="shrink-0 select-none">{prompt}</span>
            <div className="relative w-full">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Terminal input"
                className="w-full bg-transparent outline-none caret-[var(--cursor)] placeholder:text-[var(--muted)]"
                placeholder="Type /help to begin…"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <span className="pointer-events-none absolute inset-y-0 right-0 hidden md:block text-xs text-[var(--muted)]">↑↓ history • Enter run</span>
            </div>
          </div>
        </footer>
      </main>
      <StyleInPage />
    </div>
  );
}

function StyleInPage() {
  return (
    <style>{`
      a { color: var(--link); text-decoration: underline; }
      .title { color: var(--accent); }
      .dim { color: var(--muted); }
      .tag { display:inline-block; padding:0 6px; border:1px solid color-mix(in oklab, var(--tag) 60%, transparent); border-radius:999px; color:var(--tag); font-size:12px; margin-left:4px; }
      @keyframes blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
      .caret::after { content: '▌'; color: var(--cursor); animation: blink 1s steps(1) infinite; }
      .animate-fadein { animation: fadein 300ms ease-out both, slide 300ms ease-out both; }
      @keyframes fadein { from { opacity: 0 } to { opacity: 1 } }
      @keyframes slide { from { transform: translateY(4px) } to { transform: translateY(0) } }
    `}</style>
  );
}

function strong(s: string) {
  return `<span class='title'>${escapeHtml(s)}</span>`;
}
function code(s: string) {
  return `<code class='px-2 py-0.5 rounded bg-white/10'>${escapeHtml(s)}</code>`;
}
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
