#!/bin/bash
# install.sh - One-liner setup for the Marek Figma Extract Kit
# Run this once after cloning the repo. Sets up:
#   1. Bun runtime (if needed)
#   2. figma-extract CLI (globally linked)
#   3. Claude Code skill (global + available per-project via scaffold)
#   4. create-app scaffold script (in ~/bin/)
#   5. FIGMA_TOKEN check

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$SCRIPT_DIR/cli"
SKILL_DIR="$SCRIPT_DIR/skill"
SCAFFOLD_DIR="$SCRIPT_DIR/scaffold"

echo ""
echo "Marek Figma Extract Kit — Setup"
echo "================================"
echo ""

# ===== 1. BUN =====

if command -v bun &> /dev/null; then
  echo "[1/5] Bun found: $(bun --version)"
else
  echo "[1/5] Bun not found. Installing..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
  echo "      Installed: $(bun --version)"
fi

# ===== 2. CLI =====

echo "[2/5] Installing figma-extract CLI..."
cd "$CLI_DIR"
bun install --silent
bun link --silent 2>/dev/null || bun link
echo "      Linked globally: $(which figma-extract 2>/dev/null || echo 'will be available in new shell')"

# ===== 3. SKILL =====

echo "[3/5] Installing Claude Code skill..."
mkdir -p "$HOME/.claude/commands"
cp "$SKILL_DIR/figma-extract.md" "$HOME/.claude/commands/figma-extract.md"
echo "      Installed to ~/.claude/commands/figma-extract.md"

# ===== 4. SCAFFOLD =====

echo "[4/5] Installing create-app scaffold..."
mkdir -p "$HOME/bin"
ln -sf "$SCAFFOLD_DIR/create-app" "$HOME/bin/create-app"

# Ensure ~/bin is in PATH
if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
  SHELL_RC="$HOME/.zshrc"
  [ -f "$HOME/.bashrc" ] && [ ! -f "$HOME/.zshrc" ] && SHELL_RC="$HOME/.bashrc"
  if ! grep -q 'export PATH="$HOME/bin:$PATH"' "$SHELL_RC" 2>/dev/null; then
    echo 'export PATH="$HOME/bin:$PATH"' >> "$SHELL_RC"
    echo "      Added ~/bin to PATH in $SHELL_RC"
  fi
fi
echo "      Installed to ~/bin/create-app"

# ===== 5. FIGMA TOKEN =====

echo "[5/5] Checking FIGMA_TOKEN..."
if [ -n "$FIGMA_TOKEN" ]; then
  echo "      FIGMA_TOKEN is set"
elif grep -q "FIGMA_TOKEN" "$HOME/.zshrc" 2>/dev/null || grep -q "FIGMA_TOKEN" "$HOME/.bashrc" 2>/dev/null; then
  echo "      FIGMA_TOKEN found in shell config (restart shell to activate)"
else
  echo ""
  echo "      FIGMA_TOKEN is not set. To configure:"
  echo "      1. Go to Figma > Settings > Account > Personal Access Tokens"
  echo "      2. Generate a new token"
  echo "      3. Add to your shell config:"
  echo "         echo 'export FIGMA_TOKEN=figd_your_token_here' >> ~/.zshrc"
  echo ""
fi

# ===== VERIFY =====

echo ""
echo "================================"
echo "Setup complete!"
echo ""
echo "Available commands:"
echo "  figma-extract <url>           Extract Figma design data"
echo "  create-app <name>             Scaffold Vite + React + shadcn project"
echo "  create-app <name> --next      Scaffold Next.js + shadcn project"
echo "  /figma-extract <url>          Claude Code skill (in any session)"
echo ""
echo "If 'figma-extract' or 'create-app' aren't found, open a new terminal."
echo ""
