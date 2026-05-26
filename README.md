# All for One

> A private council for clearer thinking: ask one question, invite multiple thinker lenses and mental models, then let a host synthesize the result.

All for One is a local-first thinking workspace. It helps you explore a question from multiple angles: named thinker-inspired lenses, classic mental models, optional background material, and a final host summary that extracts consensus, trade-offs, blind spots, and next actions.

It is designed for personal use first: quiet, fast, and useful when you want better judgment rather than another chat window.

## What It Does

- Ask one question and get multiple perspectives in one run.
- Combine thinker-inspired lenses with classic mental models.
- Add optional research/context before asking.
- Use Codex Desktop locally by default.
- Use an OpenAI API Key when deployed or when you prefer API mode.
- Save history locally, then search and reopen past results.
- Edit or add skills through simple Markdown prompt files.

## Screens

The app is built around three areas:

- **Question and context**: write the question, optionally paste background material.
- **Council selection**: choose thinker lenses and mental models.
- **Host summary**: read the synthesis first, then inspect individual perspectives by category.

## Built-In Lenses

### Thinker Lenses

These are not simulations of the real people. They are cognitive lenses inspired by public ideas, writing styles, and decision patterns.

| Lens | Focus |
| --- | --- |
| Jobs | Product taste, simplicity, focus, narrative, user experience |
| Qiushi | Investigation, evidence, reality testing, main contradiction |
| Feynman | Clarity, explanation, curiosity, foundational understanding |
| Munger | Mental models, incentives, mistakes, worldly wisdom |
| Musk | First principles, engineering constraints, speed, scale |
| Taleb | Uncertainty, fragility, tail risk, optionality |
| Naval | Leverage, judgment, wealth, happiness, life strategy |
| Paul Graham | Startups, founders, product-market fit, writing |
| Zhang Yiming | Information efficiency, product systems, organization |
| Buffett | Long-term value, moat, patience, downside protection |

### Mental Models

| Model | Use It To |
| --- | --- |
| First Principles | Break a problem down to facts, constraints, and real limits |
| Inversion | Ask how this fails, then avoid the causes |
| Second-Order Effects | Look beyond direct results into follow-on consequences |
| Antifragility | Judge whether stress makes a plan weaker, stable, or stronger |
| Opportunity Cost | Compare what each choice consumes or prevents |
| Main Contradiction | Find the key conflict that currently constrains progress |
| Pareto Principle | Identify the few inputs that drive most outcomes |
| Occam's Razor | Prefer simpler explanations with fewer assumptions |
| Circle of Competence | Separate what you know from what only feels familiar |
| Systems Thinking | See feedback loops, incentives, delays, and leverage points |

## Quick Start

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Localhost defaults to **Codex Desktop mode**.

## Calling Modes

### 1. Codex Desktop Mode

Default for local use.

```text
Browser -> Next.js API -> Codex Desktop app-server -> Response
```

This mode uses your local Codex Desktop session. It only works on your own machine because cloud deployments cannot access your local desktop app.

### 2. API Key Mode

Use this mode for Vercel or any deployed environment.

You can either paste a key in the web UI, or create `.env.local`:

```bash
cp .env.example .env.local
```

Then set:

```text
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4.1-mini
```

Restart the dev server after changing `.env.local`.

## Deploying to Vercel

The app can be deployed to Vercel, but deployed environments should use **API Key mode**.

```bash
npx vercel
```

Production deploy:

```bash
npx vercel --prod
```

Recommended Vercel environment variables:

```text
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4.1-mini
```

When the app is not running on `localhost`, it defaults to API Key mode.

## How Skills Work

Skills are plain Markdown prompts plus metadata.

```text
skills/manifest.json    # skill metadata
skills/*.md             # prompt bodies
skills/host.md          # host synthesis prompt
```

To add a new skill:

1. Create a new Markdown prompt in `skills/`.
2. Add an entry to `skills/manifest.json`.
3. Restart the dev server.

Local edits to `skills/*.md` take effect on the next API call.

## Optional Local Avatars

Real portrait files are intentionally not included in this repository. If you want local portraits, put your own licensed images under:

```text
public/avatars/
```

The UI falls back to generated initials when avatar files are missing.

## Development

```bash
npm run dev
npm run build
```

Useful project structure:

```text
app/                    # Next.js app and UI
app/api/debate/route.ts # council orchestration endpoint
app/api/skills/route.ts # skill metadata endpoint
lib/codexDesktop.ts     # local Codex Desktop bridge
lib/skills.ts           # skill loading helpers
skills/                 # prompts and manifest
```

## Notes

- This app is a thinking tool, not a source of truth.
- Thinker lenses are prompt-based perspectives, not claims to represent real people.
- For important legal, financial, medical, or safety decisions, use the output as a starting point and consult qualified professionals.

## License

Apache License 2.0. See [LICENSE](./LICENSE).
