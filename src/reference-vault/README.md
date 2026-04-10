# Reference Vault

This directory holds visual references that the self-review loop compares against.
Each reference is a pair of files:

- `<name>.jpg` (or `.png` / `.webp`) — screenshot of the reference page
- `<name>.md` — description: URL, why it's in the vault, what to learn from it

Example:

```text
src/reference-vault/
├── 001-rauno-freiberg-home.jpg
├── 001-rauno-freiberg-home.md
├── 002-bartosz-ciechanowski-gears.jpg
└── 002-bartosz-ciechanowski-gears.md
```

## Usage by Self-Review

视觉评审准备步骤（见 `scripts/publish/vision-review.ts`）会整理这个目录里的
reference images，随后由 Agent 在 `/publish` skill 里自行判断：

> "Does this new article feel like it belongs in the same family as these references?"

## Maintenance

- Add references that represent the quality bar you want
- Remove references that no longer reflect your taste
- Keep descriptions concise (3-5 sentences)
- **On main branch this directory is gitignored** — the references you collect are
  personal taste artifacts and belong on the personal branch
