/**
 * Maps ShadCN Figma UI kit variable names to shadcn CSS variable tokens.
 * Also maps known hex values to semantic roles for heuristic matching.
 *
 * This enables the CLI to output `text-foreground` instead of `text-neutral-900`
 * when it detects a ShadCN design system.
 */

// ShadCN Figma variable name → shadcn CSS variable name
// These are the standard names from the ShadCN Figma UI kit
const SHADCN_VAR_TO_CSS: Record<string, string> = {
  // Text colors
  "Text/dark": "foreground",
  "Text/light": "foreground", // in dark mode, light text IS foreground
  "Text/subtitle/light": "muted-foreground",
  "Text/subtitle/dark": "muted-foreground",
  "Text/muted": "muted-foreground",
  "Primary/dark": "foreground",
  "Primary/light": "foreground",

  // Backgrounds
  "ColorPrimary/white": "background",
  "ColorPrimary/black": "background",
  "general/background": "background",
  "general/foreground": "foreground",
  "general/muted-foreground": "muted-foreground",
  "general/muted": "muted",
  "general/primary": "primary",
  "general/primary-foreground": "primary-foreground",
  "general/secondary": "secondary",
  "general/secondary-foreground": "secondary-foreground",
  "general/accent": "accent",
  "general/accent-foreground": "accent-foreground",
  "general/destructive": "destructive",
  "general/border": "border",
  "general/input": "input",
  "general/ring": "ring",
  "general/card": "card",
  "general/card-foreground": "card-foreground",
  "general/popover": "popover",
  "general/popover-foreground": "popover-foreground",

  // Secondary
  "Secondary/Gray": "border",
  "Secondary/LightGray": "muted",
};

// Known ShadCN default color values → semantic role
// These are the standard hex values from shadcn's neutral theme
const SHADCN_HEX_TO_ROLE_LIGHT: Record<string, string> = {
  "#09090b": "background",     // zinc-950
  "#0a0a0a": "background",     // neutral-950
  "#fafafa": "foreground",     // neutral-50 (inverted in dark)
  "#f5f5f5": "secondary",
  "#a3a3a3": "muted-foreground",
  "#737373": "muted-foreground",
  "#6b7280": "muted-foreground", // gray-500
  "#171717": "foreground",     // neutral-900
  "#262626": "card",           // neutral-800
  "#404040": "border",         // neutral-700
  "#e5e5e5": "border",         // neutral-200 (light mode)
  "#d4d4d4": "border",         // neutral-300
  "#ef4444": "destructive",    // red-500
  "#dc2626": "destructive",    // red-600
  "#f87171": "destructive",    // red-400
};

const SHADCN_HEX_TO_ROLE_DARK: Record<string, string> = {
  "#000000": "background",
  "#09090b": "background",
  "#0a0a0a": "background",
  "#fafafa": "foreground",
  "#f5f5f5": "foreground",
  "#ffffff": "foreground",
  "#171717": "foreground", // neutral-900 is foreground in dark mode (ShadCN uses this for text on dark bg)
  "#0a0a0a": "foreground",
  "#a3a3a3": "muted-foreground",
  "#737373": "muted-foreground",
  "#6b7280": "muted-foreground",
  "#262626": "card",
  "#1c1917": "card",
  "#18181b": "card",
  "#404040": "border",
  "#353535": "border",
  "#ef4444": "destructive",
  "#dc2626": "destructive",
  "#f87171": "destructive",
};

export interface SemanticMatch {
  token: string;       // e.g. "foreground", "muted-foreground"
  source: "variable" | "heuristic";
}

/**
 * Try to match a Figma variable name to a shadcn CSS token.
 */
export function matchFigmaVarToToken(figmaVarName: string): string | undefined {
  // Direct match
  if (SHADCN_VAR_TO_CSS[figmaVarName]) {
    return SHADCN_VAR_TO_CSS[figmaVarName];
  }

  // Case-insensitive / partial match
  const lower = figmaVarName.toLowerCase();
  for (const [key, value] of Object.entries(SHADCN_VAR_TO_CSS)) {
    if (key.toLowerCase() === lower) return value;
  }

  // Try to infer from naming patterns
  if (lower.includes("foreground")) return "foreground";
  if (lower.includes("muted") && lower.includes("foreground")) return "muted-foreground";
  if (lower.includes("background")) return "background";
  if (lower.includes("destructive")) return "destructive";
  if (lower.includes("border")) return "border";
  if (lower.includes("primary") && lower.includes("foreground")) return "primary-foreground";
  if (lower.includes("primary")) return "primary";
  if (lower.includes("secondary")) return "secondary";
  if (lower.includes("accent")) return "accent";
  if (lower.includes("muted")) return "muted";
  if (lower.includes("card") && lower.includes("foreground")) return "card-foreground";
  if (lower.includes("card")) return "card";
  if (lower.includes("input")) return "input";
  if (lower.includes("ring")) return "ring";

  return undefined;
}

/**
 * Try to match a hex color to a shadcn semantic role via known defaults.
 * Uses heuristic matching based on standard shadcn color values.
 */
export function matchHexToSemanticRole(
  hex: string,
  isDarkMode: boolean = true,
): SemanticMatch | undefined {
  const lower = hex.toLowerCase();
  const map = isDarkMode ? SHADCN_HEX_TO_ROLE_DARK : SHADCN_HEX_TO_ROLE_LIGHT;
  const role = map[lower];
  if (role) {
    return { token: role, source: "heuristic" };
  }
  return undefined;
}

/**
 * Determine the appropriate Tailwind class for a semantic token.
 * Maps shadcn CSS variable names to Tailwind utility classes with the right prefix.
 */
export function semanticTokenToTailwind(token: string, prefix: string): string {
  // prefix: "text", "bg", "border"
  return `${prefix}-${token}`;
}
