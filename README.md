# figma-extract

Get a component out of Figma and into your React project — accurately, every time.

This is a CLI + Claude Code skill that replaces the Figma MCP server. Instead of getting a blob of nested JSON that loses half the details, you get a flat, readable spec with every property resolved to Tailwind classes, every color as hex + nearest Tailwind class, and every brand asset exported as an SVG file. Then Claude builds the component from that spec — reading your project's actual theme, components, and design system to produce production code.

---

## Prerequisites

- **macOS or Linux** (the installer uses bash and curl)
- **[Claude Code](https://claude.ai/claude-code)** (the `/figma-extract` skill runs inside Claude Code)
- **Figma personal access token** — you'll need this before the CLI can do anything

### Get your Figma token

1. Go to **Figma > Settings > Account > Personal Access Tokens**
2. Generate a new token
3. Add it to your shell config:

```bash
echo 'export FIGMA_TOKEN=figd_your_token_here' >> ~/.zshrc
source ~/.zshrc
```

---

## Setup

```bash
git clone https://github.com/johnpwilkinson/figma-extract.git
cd figma-extract
./install.sh
```

That's it. The installer:
- Installs [Bun](https://bun.sh) if you don't have it
- Links the `figma-extract` CLI globally
- Installs the `/figma-extract` skill into Claude Code
- Installs the `create-app` scaffold script
- Verifies that your `FIGMA_TOKEN` is set

If `figma-extract` or `create-app` aren't found after install, open a new terminal.

---

## What it does

You give it a Figma URL. It gives you a structured spec like this:

```
FRAME: Hero Section
  Layout: auto-layout vertical
  Padding: 48 64 48 64 → py-12 px-16
  Gap: 24px → gap-6
  Fill: #0f172a → bg-slate-900

  TEXT: heading
    Content: "Welcome back"
    Font: Inter
    Weight: 600 → font-semibold
    Size: 36px → text-4xl
    Color: #171717 → text-neutral-900

  INSTANCE: primary-button → shadcn/Button
    Variant: default
    Size: lg
    Text: "View dashboard"
```

Every value is extracted deterministically by code — not by an LLM parsing nested JSON. Icons get named. Colors get resolved to the nearest Tailwind class. ShadCN components get identified. Brand logos get exported as SVGs to your `src/assets/` folder.

Then the Claude Code skill (`/figma-extract`) takes that spec and builds a production React component. During the build, Claude reads your project's actual CSS, theme config, and component library to map the extracted colors to your real design tokens — whether that's shadcn semantic variables, MUI theme tokens, or plain Tailwind classes. The result: real components, correct tokens, proper interactivity.

**Works with any stack.** The CLI extracts raw design data. Claude adapts it to whatever your project uses — shadcn, MUI, Chakra, Tailwind-only, CSS modules, styled-components. If the project uses semantic color tokens, Claude maps the extracted colors to them. If it doesn't, the Tailwind classes from the spec work directly.

---

## Usage

### Extract a design from Figma

In your project directory, open Claude Code and run:

```
/figma-extract https://figma.com/design/abc123/MyFile?node-id=4:1337
```

Claude will:
1. Run the CLI to extract the design spec
2. Read your project's theme/CSS to understand your design system
3. Ask if you want to plan the build together (you can say yes or "just build it")
4. Look up the component docs for every library component it's about to use
5. Build the component with your project's real components, correct tokens, and proper interactivity

You can also run the CLI directly to see the raw spec:

```bash
figma-extract "https://figma.com/design/abc123/MyFile?node-id=4:1337"
```

---

## How it works

The CLI makes three parallel calls to the Figma REST API:

1. **Node tree** — every frame, text node, instance, shape, and their properties
2. **Image fills** — resolves image references to real downloadable URLs
3. **Screenshot** — renders the node as a PNG for visual reference

Then it walks the tree and:
- Resolves every color to a hex value and the nearest Tailwind class
- Resolves every spacing, font size, weight, line height, border radius, and gap to Tailwind utilities
- Maps component instances to shadcn component names via auto-detection + your config
- Detects brand/custom vector assets (PascalCase naming convention) and exports them as SVGs
- Outputs a flat, indented text spec — no nesting deeper than 2-3 levels

The skill then guides Claude through building the component:
- Reads your project's CSS, theme config, and `package.json` to understand your design system
- Maps extracted colors to your project's actual tokens (CSS variables, theme values, or raw Tailwind)
- Scans your project for available UI components
- Reads the component docs for each library component (via context7, shadcn MCP, or web)
- Builds data-driven components with TypeScript types and proper state management

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
- **iconLibrary** — prefixes icon names in the output (e.g., `lucide-react/ArrowRight`). Defaults to `lucide-react` if not set.
- **defaults.font** — suppresses the font line in the spec when it matches, reducing noise.

---

## CLI options

```bash
figma-extract "<figma-url>"              # Extract the design
figma-extract "<figma-url>" --json       # Output raw parsed JSON instead of text
figma-extract --file <key> --node <id>   # Use file key + node ID instead of URL
figma-extract --help                     # Show help
```

Run the CLI **from your project directory** — it reads `.figma-extract.json` for component mapping and default font config.

---

## Starting a new project

If you don't have a project yet, the included scaffold sets one up:

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

## FAQ

**Do I need the Figma MCP server?**
No. This replaces it entirely. The CLI calls the Figma REST API directly with your personal access token.

**What if my project doesn't use shadcn or Tailwind?**
The CLI extracts every raw value (hex colors, pixel sizes, font weights) and resolves Tailwind classes as a reference. When Claude builds the component, it reads your actual project to understand your styling approach and uses the right system — MUI theme tokens, CSS modules, styled-components, whatever you're on. Use the collaborative planning mode to tell Claude about your stack.

**A component is missing from the output.**
The CLI extracts everything the Figma API returns for the selected node. If something's missing, it might be in a sibling frame — select the parent frame in Figma and copy that URL instead.

**The scaffold script fails on Font Awesome Pro.**
Set `FONTAWESOME_NPM_AUTH_TOKEN` in your `~/.zshrc` before running `create-app`. Get the token from your [Font Awesome account](https://fontawesome.com/account/general). Without it, the script installs Font Awesome Free automatically.

---

## Uninstall

To remove everything:

```bash
# Remove the global CLI link
cd figma-extract/cli && bun unlink

# Remove the Claude Code skill
rm ~/.claude/commands/figma-extract.md

# Remove the scaffold script
rm ~/bin/create-app

# Remove the repo
cd .. && rm -rf figma-extract
```
