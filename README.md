# weid.fun

> A Tier 4 personal blog framework — every article is a unique piece, not a templated post.

**weid.fun** is an experimental personal blog framework built around a single conviction:

> *Every article should be a distinct visual/interactive work — uniqueness itself is the standard.*

This project deliberately avoids conventional blog frameworks (Hugo, Jekyll, Astro, Next.js starters, etc.). Those tools optimize for consistency across posts; this one optimizes for the opposite. Each article is a standalone page, free to use its own stack, composition, and aesthetic.

For Chinese speakers: see [README.zh-CN.md](./README.zh-CN.md).

---

## Core Ideas

### Three tensions, three answers

| Tension | Answer |
|---|---|
| Expressive freedom vs. maintainability for one author | AI agents transform raw material into finished pages; the author works in "vibe coding" mode. |
| Uniqueness vs. quality control | A three-layer standard system (see below). |
| Open-source framework vs. private blog content | A single repo with two branches: `main` is the clean framework, `personal` holds your content. |

### The three-layer standard system

| Layer | Purpose | Location |
|---|---|---|
| **Hard Rules** | Non-negotiable floor (e.g. responsive at every breakpoint) | `src/standards/hard-rules.md` |
| **Component Vault** | Reusable Tier 4 primitives | `src/primitives/*` |
| **Reference Vault** | Taste calibration gallery | `src/reference-vault/*` |

Agents read Layers 1 and 2 while generating, and review against Layers 1 and 3 when self-auditing.

### The publish pipeline

The `/publish` skill takes raw input (conversation or inbox folder) and runs end to end with no author intervention:

1. Organize `articles/<slug>/source/`
2. Analyze content and pick palette / typography / primitives
3. Read the series spec if this isn't the first article in a series
4. Auto-illustrate with `baoyu-article-illustrator` when needed
5. Write `page.tsx` / `index.html` / `meta.json`
6. Update `vite.config.ts` entries and `home-data.json`
7. Build with `bun run build`
8. Self-review loop: Playwright screenshots across three breakpoints → agent vision review → iterate (max 3 rounds)
9. First article of a series: write `series/<name>/spec.json`

Deployment is a separate command — `publish` never deploys automatically.

## Tech Stack

| Layer | Choice |
|---|---|
| Build | Vite (multi-page mode) |
| UI | React 18 + TypeScript |
| 3D / WebGL | react-three-fiber + @react-three/drei |
| Animation | GSAP + Motion One |
| Gesture input | @use-gesture/react (unified pointer) |
| Styling | Tailwind CSS + custom CSS |
| Runtime / package manager | Bun |
| Visual review | Playwright + agent-native vision judgment |
| Deploy | rsync + nginx (static hosting) |

## Project Structure

```
weid.fun/
├── src/
│   ├── primitives/          # Component Vault (framework, shared)
│   ├── reference-vault/     # Reference Vault (personal, ignored on main)
│   ├── standards/
│   │   ├── hard-rules.md           # baseline (framework)
│   │   └── hard-rules.custom.md    # personal overrides (ignored on main)
│   ├── lib/                 # shared utilities
│   ├── home/                # homepage entry
│   └── articles/            # all articles (personal, ignored on main)
├── series/                  # series specs (personal, ignored on main)
├── skills/publish/          # /publish skill (framework)
├── scripts/                 # publish + deploy scripts (framework)
├── inbox/                   # folder-mode staging (always ignored)
├── docs/                    # framework documentation
├── vite.config.ts
└── dist/                    # build output (ignored)
```

## Getting Started

```bash
# Install dependencies
bun install

# Start the dev server
bun run dev

# Build for production
bun run build

# Preview the production build
bun run preview

# Run end-to-end tests
bun run test:e2e
```

## Publishing an Article

Two input modes are supported:

**Conversation mode** — paste markdown + drop a reference image in Claude Code, then:

```
/publish --series thoughts
```

**Folder mode** — drop raw material into `inbox/<name>/`, then:

```
/publish inbox/<name> --series tech-deep-dive --pin
```

The agent organizes the folder, generates the page, runs the self-review loop, and reports a local preview URL when it's done.

## Deploying

Deployment is intentionally separate from publishing. The deploy script uses environment variables and requires an explicit confirmation flag:

```bash
WEID_DEPLOY_SERVER=user@your-server ./scripts/deploy.sh --yes
```

Flags:
- `--dry-run` — print commands without executing
- `--yes` — required to actually run `rsync --delete` and reload nginx

The script builds the project, rsyncs `dist/` to the remote path, and reloads nginx. See `scripts/nginx/weid.fun.conf` for the server configuration template.

## Repo Strategy: main vs personal

- **`main`** — framework code only. `.gitignore` excludes all personal content (articles, reference vault, custom rules, home-data). Safe to open source.
- **`personal`** — framework + your content. `.gitignore` is a relaxed subset that tracks personal files.

Merge direction is **one-way**: `main → personal`. Never merge `personal` back into `main` — that would leak personal content into the framework branch.

```bash
# Daily blogging
git checkout personal
# write, /publish, preview, /deploy

# Framework improvements
git checkout main
# edit primitives / scripts / skills

# Sync framework updates into your blog
git checkout personal
git merge main
```

## Non-Goals

The project explicitly does **not** include:

- CMS / admin UI
- Comments / user accounts
- Multi-author workflows
- Push-to-deploy automation
- SEO tuning (early phase)
- Backend APIs (static site only)
- A consistent blog template (this is the anti-thesis)

## Status

Active — MVP shipped. Primitives, hard rules, and reference vault grow as the blog evolves.
