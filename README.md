# figma-extract

Get a component out of Figma and into your React project — accurately, every time.

This is a CLI + Claude Code skill that replaces the Figma MCP server. Instead of getting a blob of nested JSON that loses half the details, you get a flat, readable spec with every property resolved to Tailwind classes, every color mapped to your project's design tokens, and every brand asset exported as an SVG file. Then Claude builds the component from that spec using your actual shadcn components, not raw divs.

---

## What it does

You give it a Figma URL. It gives you a structured spec like this:

```
FRAME: Hero Section
  Layout: auto-layout vertical
  Padding: 48 64 48 64 → py-12 px-16
  Gap: 24px → gap-6
  Fill: #0f172a → bg-background (token: --background)

  TEXT: heading
    Content: "Welcome back"
    Font: Inter
    Weight: 600 → font-semibold
    Size: 36px → text-4xl
    Color: #171717 → text-foreground (token: --foreground)

  INSTANCE: primary-button → shadcn/Button
    Variant: default
    Size: lg
    Text: "View dashboard"
```

Every value is extracted deterministically by code — not by an LLM parsing nested JSON. Icons get named. Colors get matched to your Tailwind theme. ShadCN components get identified. Brand logos get exported as SVGs to your `src/assets/` folder.

Then the Claude Code skill (`/figma-extract`) takes that spec and builds a production React component: real shadcn primitives, semantic color tokens, TypeScript interfaces, TanStack Table for data tables, controlled inputs, functional pagination — the works.

---

## Setup (one time)

```bash
git clone git@github.com:johnpwilkinson/figma-extract.git
cd figma-extract
./install.sh
```

That's it. The installer:
- Installs [Bun](https://bun.sh) if you don't have it
- Links the `figma-extract` CLI globally
- Installs the `/figma-extract` skill into Claude Code
- Installs the `create-app` scaffold script
- Checks that your `FIGMA_TOKEN` is set

If you don't have a Figma token yet:
1. Go to **Figma → Settings → Account → Personal Access Tokens**
2. Generate a new token
3. Add it to your shell: `echo 'export FIGMA_TOKEN=figd_your_token' >> ~/.zshrc`
4. Open a new terminal

---

## Usage

### Extract a design from Figma

In your project directory, open Claude Code and run:

```
/figma-extract https://figma.com/design/abc123/MyFile?node-id=4:1337
```

Claude will:
1. Run the CLI to extract the design spec
2. Ask if you want to plan the build together (you can say yes or "just build it")
3. Look up the shadcn docs for every component it's about to use
4. Build the component with your project's real components, semantic tokens, and proper interactivity

You can also run the CLI directly to see the raw spec:

```bash
figma-extract "https://figma.com/design/abc123/MyFile?node-id=4:1337"
```

### Start a new project

```bash
create-app my-project          # Vite + React + shadcn
create-app my-project --next   # Next.js + shadcn
```

Every new project comes pre-configured with:
- All shadcn/ui components
- TanStack Table
- Zustand
- Tailwind CSS v4
- Font Awesome (Pro if you have a token, Free otherwise)
- Theme switching (light/dark/system)
- `.figma-extract.json` config (component mappings, icon library)
- `.claude/commands/figma-extract.md` (skill works immediately)

---

## How it works

The CLI makes three parallel calls to the Figma REST API:

1. **Node tree** — every frame, text node, instance, shape, and their properties
2. **Image fills** — resolves image references to real downloadable URLs
3. **Screenshot** — renders the node as a PNG for visual reference

Then it walks the tree and:
- Resolves every color to a Tailwind class (and a shadcn semantic token if your project uses shadcn)
- Resolves every spacing, font size, weight, line height, border radius, and gap to Tailwind utilities
- Maps component instances to shadcn component names via auto-detection + your config
- Detects brand/custom vector assets (PascalCase naming convention) and exports them as SVGs
- Outputs a flat, indented text spec — no nesting deeper than 2-3 levels

The skill then guides Claude through building the component:
- Scans your `src/components/ui/` for available shadcn primitives
- Reads the shadcn docs for each component (via context7, shadcn MCP, or web)
- Uses semantic color tokens (`text-foreground`, not `text-neutral-900`)
- Builds data-driven components with TypeScript types and proper state management
- Handles the Data Table recipe (TanStack Table) when the spec shows sorting/filtering/pagination

---

## Project structure

```
figma-extract/
├── cli/              The extraction CLI (Bun + TypeScript)
├── skill/            The Claude Code skill
├── scaffold/         Project scaffolding script
│   └── templates/    Config files dropped into new projects
└── install.sh        One-liner setup
```

---

## Config

Each project can have a `.figma-extract.json` in its root:

```json
{
  "componentMap": {
    "Button": "shadcn/Button",
    "Card": "shadcn/Card",
    "CustomWidget": "shadcn/Card"
  },
  "iconLibrary": "lucide-react",
  "defaults": {
    "font": "Geist Variable"
  }
}
```

- **componentMap** — maps Figma component names to your code components. Auto-detection handles standard shadcn names; use this for custom overrides.
- **iconLibrary** — prefixes icon names in the output (e.g., `lucide-react/ArrowRight`).
- **defaults.font** — suppresses the font line in the spec when it matches, reducing noise.

---

## CLI options

```bash
figma-extract "<figma-url>"              # Extract with dark mode (default)
figma-extract "<figma-url>" --light      # Extract with light mode token mapping
figma-extract "<figma-url>" --json       # Output raw parsed JSON instead of text
figma-extract --file <key> --node <id>   # Use file key + node ID instead of URL
figma-extract --help                     # Show help
```

Run the CLI **from your project directory** — it reads `components.json` and your CSS file to enable semantic token mapping and shadcn detection.

---

## FAQ

**Do I need the Figma MCP server?**
No. This replaces it entirely. The CLI calls the Figma REST API directly with your personal access token.

**What if my project doesn't use shadcn?**
The CLI still extracts every property and resolves Tailwind classes. The shadcn-specific features (semantic tokens, component mapping) only activate when it detects `components.json`. For non-shadcn projects, use the collaborative planning mode to tell Claude what stack you're on.

**What if my project doesn't use Tailwind?**
The raw values (hex colors, pixel sizes, font weights) are always in the output. The Tailwind class suggestions appear after the `→` arrow — Claude can ignore them and use whatever styling system your project uses. Just mention it in the planning step.

**The CLI shows the wrong colors / everything is the same color.**
Make sure you're running the CLI from your project directory (not from the figma-extract repo). It needs to read your `components.json` and CSS files. Also check that you're using `--dark` or `--light` to match the Figma frame's theme mode.

**A component is missing from the output.**
The CLI extracts everything the Figma API returns for the selected node. If something's missing, it might be in a sibling frame — select the parent frame in Figma and copy that URL instead.

**The scaffold script fails on Font Awesome Pro.**
Set `FONTAWESOME_NPM_AUTH_TOKEN` in your `~/.zshrc` before running `create-app`. Get the token from your [Font Awesome account](https://fontawesome.com/account/general). Without it, the script installs Font Awesome Free automatically.
