Terminal Portfolio (Next.js + Tailwind)

A lightweight, terminal-style single-page portfolio. Minimal dependencies, fast, accessible, and mobile friendly.

## Getting Started

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Commands

- **/help**: list commands
- **/help <command>**: detailed usage for a command
- **/projects [page]**: paginated list; shows title, description, tags, demo, source
- **open <n>**: open the nth project demo in a new tab
- **/about**: short bio, role, location, key skills
- **/contact**: email + socials; type `copy email` to copy
- **/resume**: opens a placeholder resume PDF
- **/theme <light|dark|matrix|solarized>**: switch theme
- **/clear** or **cls**: clear terminal
- **search <term>**: fuzzy-ish search across projects

## Customize content

Edit the `CONFIG` object at the top of `src/app/page.tsx`:

- `bio`: your name, role, location, about, skills
- `projects`: title, description, `tech` tags, `demoUrl`, `sourceUrl`
- `email` and `socials`
- `resumeUrl`: replace with `/resume.pdf` in `public/` when ready
- `pageSize`: project pagination size

Themes are defined in `THEMES` in `src/app/page.tsx`.

## Accessibility & Performance

- Semantic roles (`region`, `log`), focus styles, keyboard history (↑/↓)
- Minimal JS; CSS animations for output; no analytics or tracking

## Build & deploy

```bash
npm run build
npm start
```
