# Exnovo Agentic OS — UI build plan (design system → production)

Source of truth: the **Exnovo Round Table** design system (claude.ai artifact). This folder mirrors it for the repo:

| file | what |
|---|---|
| `exnovo-tokens.css` | Tailwind v4 `@theme` tokens + plain CSS variables |
| `exnovo-components.css` | the `ex-*` component classes (Panel, StatCard, QuestCard, RoundTable …) |
| `components.d.ts` | prop contracts for each React component |
| `ui-component-map.json` | every mockup region → component → data source, with known mockup errors to ignore |

## Findings in the current repo (2026-09-25)
1. Two parallel UIs: the React app (`src/`, Vite + React 19 + Tailwind v4 + R3F) and a vanilla module (`static/ui.js`, `native_round_table_ui_module.js`) plus an aiohttp SSE stub (`api/streaming.py`). The React app is the product. The vanilla files should be retired once the SSE hook exists in React.
2. `src/index.css` uses Orbitron + neon `#00f0ff`/`#ffd700`. The mockups use softer steel blue and warm gold with Rajdhani. The tokens here follow the mockups.
3. The Round Table is currently a Three.js scene. The design system makes an SVG RoundTable the default (accessible, data-driven, sharp text); R3F stays as an optional immersive view.
4. `.parity/report.json` shows a visual-diff pipeline was started (mismatch 0.19–0.31). Compare against the design-system previews, not the raw mockups: the mockups contain generated text errors.
5. `git` refuses the repo for the claude-ops user ("dubious ownership"); run `git config --global --add safe.directory /opt/exnovo-webui` as that user before committing.

## Build order (each step: build, screenshot with Playwright, compare to the design-system preview, human approval)
1. **Foundations** — in `src/index.css`: Google Fonts `@import` for Rajdhani 400–700, Cinzel 700, JetBrains Mono 500 first, then `@import "tailwindcss";`, then `@import "../design/exnovo-tokens.css";` and `@import "../design/exnovo-components.css";`. Remove Orbitron and the old `.hud-*` classes; set body to `bg-ground text-ink font-ui`.
2. **Shell** — `TopBar`, `SideNav`, router with `/`, `/quests`, `/round-table`, `/strategy`.
3. **State layer** — one `EventSource('/api/streaming')` connection feeding two stores: an agent store (quests, seats, the six-state reducer) and a telemetry store (USD cost, tokens). Read both through `useSyncExternalStore` with selectors so a cost tick re-renders only the cost badge, never the Round Table. Batch telemetry to one update per animation frame. Deterministic code with unit tests; no model-generated logic in the event path.
4. **Dashboard** — `StatCard` ×4, `RoundTable` (SVG), `ActivityFeed`.
5. **Quests** — `FilterGroup`, `QuestCard`, `KnightProgressRow`.
6. **Round Table view** — full-size `RoundTable` + quest drawer with `KnightCard`s; R3F canvas behind an "Immersive" toggle.
7. **Strategy** — `PropertyList`, revenue SVG chart in a regal Panel, `KnightCard` pair.
8. **Backend gaps** — the `/api/*` endpoints marked "backend missing" in `ui-component-map.json`. Until they exist, render the empty state ("No quests yet") rather than fake numbers.

## Review log
- 2026-09-25 Gemini red-team: adopted split telemetry/agent stores, the under-15px data-face rule, the glow/overflow rule and a list fallback for the ring under 640px. Not adopted: replacing clip-path borders (already drawn with pseudo-elements), moving the top tab (it is cut inward, no overflow), HTML overlays for seats (uniform SVG scaling does not distort circles), Inter/Space Grotesk (off-brand).

## Prompt for Claude Code (paste as-is)
```
First run: mkdir -p /opt/exnovo-webui/design && cp /home/claude-ops/agentic-os-brain/design-handoff/exnovo-round-table/* /opt/exnovo-webui/design/
Then read design/BUILD_PLAN.md, design/ui-component-map.json and design/components.d.ts in /opt/exnovo-webui.
Implement step 1 and step 2 only. Use the ex-* classes from design/exnovo-components.css and the
tokens in design/exnovo-tokens.css; do not invent new colors, fonts or radii. Build React components
under src/components/ds/ matching the prop contracts in components.d.ts. Then run the dev server,
screenshot / at 1440x900 and 390x844 with Playwright, and stop for review. Do not touch api/,
the Tailscale config or anything outside /opt/exnovo-webui.
```
