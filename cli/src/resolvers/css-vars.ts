/**
 * Reads a project's global CSS file to extract CSS variable definitions.
 * Parses :root and .dark sections for shadcn-style CSS variables.
 * Used to compare Figma colors against the project's actual theme.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

export interface ProjectCssVars {
  light: Record<string, string>; // var name to value (from :root)
  dark: Record<string, string>;  // var name to value (from .dark)
}

/**
 * Read a CSS file and extract CSS variable definitions from :root and .dark blocks.
 */
export async function readProjectCssVars(
  cssPath: string,
  cwd: string = process.cwd(),
): Promise<ProjectCssVars> {
  const fullPath = resolve(cwd, cssPath);
  if (!existsSync(fullPath)) return { light: {}, dark: {} };

  const content = await Bun.file(fullPath).text();

  return {
    light: extractVarsFromBlock(content, ":root"),
    dark: extractVarsFromBlock(content, ".dark"),
  };
}

/**
 * Extract CSS variable definitions from a specific selector block.
 */
function extractVarsFromBlock(
  css: string,
  selector: string,
): Record<string, string> {
  const vars: Record<string, string> = {};

  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRegex = new RegExp(
    escapedSelector + "\\s*\\{([^}]+)\\}",
    "g",
  );

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(css)) !== null) {
    const blockContent = match[1];
    const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
    let varMatch: RegExpExecArray | null;
    while ((varMatch = varRegex.exec(blockContent)) !== null) {
      const name = varMatch[1].trim();
      const value = varMatch[2].trim();
      vars[name] = value;
    }
  }

  return vars;
}

/**
 * Convert an oklch CSS value to an approximate hex color for comparison.
 */
export function oklchToApproxHex(oklch: string): string | undefined {
  const match = oklch.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/,
  );
  if (!match) return undefined;

  const L = parseFloat(match[1]);
  const C = parseFloat(match[2]);
  const H = parseFloat(match[3]);

  // For achromatic colors (C ~ 0), L maps directly to grayscale
  if (C < 0.01) {
    const gray = Math.round(L * 255);
    const hex = gray.toString(16).padStart(2, "0");
    return "#" + hex + hex + hex;
  }

  // Simplified oklch to sRGB for chromatic colors
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const gamma = (x: number) => {
    x = Math.max(0, Math.min(1, x));
    return x <= 0.0031308
      ? 12.92 * x
      : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };

  r = Math.max(0, Math.min(255, Math.round(gamma(r) * 255)));
  g = Math.max(0, Math.min(255, Math.round(gamma(g) * 255)));
  bl = Math.max(0, Math.min(255, Math.round(gamma(bl) * 255)));

  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    bl.toString(16).padStart(2, "0")
  );
}

/**
 * Look up a semantic token in the project's CSS vars and return its hex value.
 */
export function getProjectCssColor(
  vars: ProjectCssVars,
  token: string,
  isDark: boolean = true,
): string | undefined {
  const map = isDark ? vars.dark : vars.light;
  const value = map[token];
  if (!value) return undefined;

  if (value.startsWith("#")) return value.toLowerCase();
  if (value.startsWith("oklch")) return oklchToApproxHex(value);

  return undefined;
}

/**
 * Auto-detect the project's CSS file path.
 */
export function detectCssPath(cwd: string = process.cwd()): string | undefined {
  const candidates = [
    "src/index.css",
    "src/globals.css",
    "src/app/globals.css",
    "app/globals.css",
    "styles/globals.css",
  ];
  for (const candidate of candidates) {
    if (existsSync(resolve(cwd, candidate))) return candidate;
  }
  return undefined;
}

/**
 * Detect if a project uses shadcn by checking for components.json.
 */
export function detectShadcn(cwd: string = process.cwd()): boolean {
  if (existsSync(resolve(cwd, "components.json"))) return true;

  const cssPath = detectCssPath(cwd);
  if (!cssPath) return false;

  try {
    const css = readFileSync(resolve(cwd, cssPath), "utf-8");
    return css.includes("shadcn") || css.includes("@theme inline");
  } catch {
    return false;
  }
}
