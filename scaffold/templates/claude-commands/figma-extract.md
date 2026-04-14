---
name: figma-extract
description: Extract Figma design data via a local CLI and implement as production React components. Use this skill whenever the user provides a Figma URL, mentions implementing a design from Figma, says "build this component" alongside a figma.com link, asks to convert a Figma frame to code, or invokes /figma-extract. This skill replaces the Figma MCP server entirely — do not use get_design_context or other Figma MCP tools when this skill is active.
---

# Figma Extract

Turn Figma designs into production React components using a local CLI that extracts design data directly from the Figma REST API. The CLI produces a flat, structured spec with every property resolved to Tailwind classes — optimized for accurate code generation without the detail loss that comes from nested MCP payloads.

## Why this workflow exists

The Figma MCP server returns deeply nested data that causes details to slip through — icon names, font weights, color overrides, and component mappings get lost when an LLM has to simultaneously parse a complex tree and write code. This CLI extracts the same data but flattens it deterministically, resolves every value to a Tailwind class, maps components to shadcn, and exports brand assets as SVG files. The result is a spec that's easy to follow line by line.

## Phase 1: Extract the design

Run the CLI from within the target project directory (this matters — the CLI reads `.figma-extract.json` for component mapping and icon library config):

```sh
figma-extract "<figma-url>"
```

The CLI makes three parallel API calls and outputs:
- A `Screenshot:` URL at the top — view this first to understand the overall layout
- A flat spec with every node's properties and Tailwind class mappings
- `Asset:` paths for any brand SVGs it exported to `src/assets/`

**What the CLI outputs for colors:** Every color appears as `hex → tailwind-class` (e.g., `#171717 → text-neutral-900`). These are raw values resolved against the default Tailwind palette. The CLI does NOT attempt to map colors to semantic tokens — that's your job in Phase 1.5 below.

## Phase 1.5: Analyze the project's design system

Before showing the user anything, read the project to understand its styling approach. This determines how you'll map the extracted colors to the project's actual tokens.

**Check in this order:**

1. **shadcn / CSS variable themes** — Look for `components.json` and read the project's global CSS file (`src/index.css`, `src/globals.css`, `src/app/globals.css`, or similar). If it contains CSS variables like `--background`, `--foreground`, `--primary`, etc., this is a CSS-variable-based theme. Read both the `:root` and `.dark` blocks to understand the full token set.

2. **Tailwind config** — Check `tailwind.config.ts` or `tailwind.config.js` for custom theme extensions. The project may define semantic colors there (e.g., `primary: 'hsl(var(--primary))'`).

3. **Other design systems** — Check `package.json` for MUI (`@mui/material`), Chakra (`@chakra-ui/react`), Mantine, or other component libraries. Each has its own theming approach.

4. **No design system** — If none of the above, the project uses plain CSS/Tailwind with no semantic layer.

**Build a mental color map.** For CSS-variable themes, convert each variable's value to hex (oklch values need approximate conversion) and match it against the colors in the extracted spec. For example:

- Spec shows `#09090b → bg-zinc-950` and the project's `.dark` CSS has `--background: oklch(0.145 0 0)` which is approximately `#09090b` → this color maps to `bg-background`
- Spec shows `#fafafa → text-neutral-50` and the project's `.dark` CSS has `--foreground: oklch(0.985 0 0)` which is approximately `#fafafa` → this color maps to `text-foreground`

You will use this mapping when building the component in Phase 3.

## Phase 2: Offer collaborative planning

<HARD-GATE>
After the CLI output is ready, you MUST present the planning offer to the user BEFORE writing any code. Do not skip this step. Do not go straight to building. Present the offer, wait for a response, then proceed accordingly.
</HARD-GATE>

Present this offer to the user:

> "I've extracted the design spec. Before I build, would you like to go over the plan together? I can walk you through what I'm going to build, which components I'll use, how I'll map colors to your project's theme, and ask a few questions about how this component should work in your app. Or I can just build it directly — your call."

**If the user declines (or says "just build it"):** Skip to Phase 2.5 (docs lookup) and then Phase 3, using the color mapping from Phase 1.5 and making reasonable default decisions (data-driven with a typed array, useState for local UI state, props interface for the data shape, project components where available).

**If the user accepts:** Enter the collaborative planning flow below.

### Collaborative planning flow

This follows the brainstorming pattern: one question at a time, multiple choice when possible, scaled to the complexity of what's being built. Don't turn a simple card component into a 20-minute interview — read the spec and calibrate.

**Step 1: Present the build summary.** In one concise message, describe:
- What you see in the spec (e.g., "a data table with 10 rows, a filter toolbar, and pagination")
- Which components you plan to use (Table, Button, Badge, Checkbox, Select, etc.)
- How you'll map the extracted colors to the project's tokens (present the mapping from Phase 1.5)
- Any brand assets the CLI exported

Ask: "Does this look right? Anything I'm misreading?"

**Step 2: Ask about the environment.** One question:
- Is this a brand new component from scratch, or being added to an existing page/route?
- If existing: which file should it go in, or should it be a new file imported there?

**Step 3: Ask about component architecture.** One question, multiple choice:
- **A) Reusable component** — accepts data via props, designed to be used in multiple places. I'll define a typed props interface and make the data shape explicit.
- **B) Page-level component** — a standalone view that fetches or owns its own data. I'll wire up local state and placeholder data.
- **C) Just the visual** — match the Figma exactly, static presentation only. No state, no interactivity, just the look.

The user's answer shapes everything: props interface vs internal state, onClick stubs vs full handlers, typed data shape vs hardcoded array.

**Step 4: Ask about interactivity (if A or B).** Based on what the spec contains, ask about relevant behaviors. Only ask about things that are actually in the spec — don't invent questions. One question with checkboxes:
- "Which of these should be wired up?"
  - [ ] Checkboxes select rows
  - [ ] Status/Priority buttons filter the table
  - [ ] Pagination actually pages through data
  - [ ] Sort columns when clicking headers
  - [ ] "Add Task" opens a dialog/sheet
  - [ ] Search input filters in real-time
  - [ ] Other (describe)

**Step 5: Open floor.** One final question:
> "Anything else I should know? Design preferences, state management approach (useState, zustand, context), data source, or any other context about how this fits into your app?"

**Step 6: Present the build plan.** Summarize what you're going to build in a short, scannable format:
- Component name and file path
- Props interface (if reusable)
- Components being used (shadcn, MUI, custom, etc.)
- Color/token mapping strategy
- State management approach
- Interactive behaviors being wired

Ask: "Good to build?"

Then proceed to Phase 3.

## Phase 2.5: Read the docs for every component in the build

This step is mandatory regardless of whether the user went through collaborative planning or skipped it. For EVERY component library component identified in the spec, look up its documentation before writing code. The visual spec tells you WHAT to render; the component docs tell you HOW to make it work — controlled state patterns, required providers, composition sub-components, and the underlying library's API.

### For shadcn projects

**A full component reference is bundled at `shadcn-component-reference.md`** in the figma-extract directory. Read it first for a quick overview of every component's key patterns and the implementation detail you'd miss from the visual design alone. Then look up the full docs for each component you're about to use.

**How to look up full docs, in order of preference:**

1. **Context7 (if available):** Call `resolve-library-id` for "shadcn/ui" then `query-docs` for each specific component (e.g., "data table sorting filtering pagination", "checkbox controlled state", "select onValueChange"). Context7 library ID is `/shadcn-ui/ui`.

2. **ShadCN MCP (if available):** Use `mcp__shadcn__view_items_in_registries` or `mcp__shadcn__get_item_examples_from_registries` to pull component docs and usage examples.

3. **Web fetch (fallback):** Fetch `https://ui.shadcn.com/docs/components/{component-name}` for each component (e.g., `data-table`, `checkbox`, `select`, `table`, `pagination`).

**Critical patterns you will miss without the docs:**

- **Radix controls use `onCheckedChange`/`onValueChange`/`onPressedChange`** — not React's `onChange`. This applies to Checkbox, Switch, Radio Group, Select, Slider, Toggle.
- **Table vs Data Table** — shadcn has two table entries. `Table` is a normal installable component (styled `<table>`, `<thead>`, `<tr>`, `<td>` wrappers) with no built-in logic. `Data Table` is NOT an installable component — it's a documentation recipe that composes the `Table` component with TanStack Table for sorting, filtering, pagination, and row selection. If the spec shows a table with sort icons, filter input, and pagination, follow the Data Table recipe — install TanStack Table, use `useReactTable()` with `getSortedRowModel()`, `getFilteredRowModel()`, `getPaginationRowModel()`, and render into the `Table` UI component. If the spec shows a simple static table with no interactivity, the plain `Table` component is enough.
- **TooltipProvider must wrap the app** or tooltips silently fail. SidebarProvider is similarly required for Sidebar.
- **Select, Dialog, Sheet, Popover render in portals** — CSS parent selectors don't reach their content.
- **Slider value is always an array** even for single thumbs.
- **Combobox switched to Base UI** from Radix+cmdk — the API is different from older examples.
- **Toast is deprecated** — use Sonner's imperative `toast()` function instead.
- **Pagination has no built-in state** — you manage current page yourself.

### For other component libraries

If the project uses MUI, Chakra, Mantine, or another library, look up the relevant component documentation using context7, web fetch, or your training data. The same principle applies: the spec tells you what to render, the docs tell you how.

This is not optional. Every component in the build must be looked up. The 27 extra lines of code that make a component actually work come from the docs, not from the Figma spec.

## Phase 3: Build the component

Work through the spec from top to bottom, informed by the planning phase (or defaults if skipped), the color mapping from Phase 1.5, and the component documentation you just read.

**Use the project's real components.** Scan the project for available UI primitives before writing code. When the spec shows `INSTANCE: ... -> shadcn/Button`, use the real `<Button>` component. When the pattern is recognizable but not explicitly tagged (repeating list → Table, pill with text → Badge, clickable element → Button, toggle → Checkbox, dropdown → Select), use the appropriate component.

**Map colors to the project's tokens.** Use the color mapping you built in Phase 1.5:
- For CSS-variable themes: use semantic classes (`text-foreground`, `bg-background`, `border-border`). This makes the component theme-aware — it adapts to light/dark mode via CSS variables.
- For Tailwind-only projects: use the Tailwind classes from the spec directly (`text-neutral-900`, `bg-zinc-950`).
- For other design systems: use the system's theming API (e.g., MUI's `sx={{ color: 'text.primary' }}`).

**Handle assets.** Import brand SVGs from `src/assets/` where the CLI shows `Asset:` paths. For image fills with `URL:` fields, use `<img>` tags. For unresolved `Ref:` fields, use a placeholder.

**Build for reuse.** Unless the user specifically chose option C (visual only) in planning:
- Extract repeating data into a typed array and render with `.map()`
- Define a props interface or type for the component's data shape
- Wire up interactive elements per the planning decisions (or sensible defaults)
- Use `useState` for local UI state unless the user specified otherwise
- Export the component with a clear API

**Implement everything.** Walk the entire spec — every section must appear in the component. The spec is the complete representation of the Figma frame. If it's in the spec, build it.

**View the screenshot.** The `Screenshot:` URL is a rendered PNG. Reference it to understand layout and visual hierarchy that the text spec alone might not convey.

## What NOT to do

- Do not use the Figma MCP server. The CLI output replaces it.
- Do not hardcode hex colors when semantic tokens are available in the project.
- Do not recreate UI library primitives from raw HTML divs.
- Do not skip sections of the spec.
- Do not invent values — ask the user if something is ambiguous.

## Troubleshooting

- **CLI not found:** Run the installer again (`./install.sh` from the mh-figma-extract-kit repo) or manually: `cd <kit-repo>/cli && bun link`
- **Auth failure:** Ensure `FIGMA_TOKEN` is set in the environment
- **Missing details:** Check `.figma-extract.json` in the project root for config
