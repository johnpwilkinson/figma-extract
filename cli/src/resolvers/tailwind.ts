/**
 * Resolves raw numeric design values (px, weight, etc.) to Tailwind classes.
 * Delegates color resolution to ./color.ts.
 */

import type { TailwindResolved } from "../types/parsed";
import type { FigmaEffect } from "../types/figma-api";
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHT_RATIO,
  LETTER_SPACING,
  BORDER_RADIUS,
  OPACITY,
} from "./tailwind-config";

// Re-export color utilities so callers can import everything from one place
export {
  resolveColor,
  resolveFirstSolidFill,
  hexToTailwind,
  figmaColorToHex,
} from "./color";

/**
 * Generic scale lookup. Finds the closest value in a scale map.
 * Returns exact=true only if the value matches a key exactly (within tolerance).
 */
function lookupScale(
  value: number,
  scale: Record<number, string>,
  prefix: string,
  unit: string = "px",
  tolerance: number = 0.5,
): TailwindResolved {
  const raw = `${value}${unit}`;
  const keys = Object.keys(scale).map(Number);

  // Exact match (within tolerance)
  for (const k of keys) {
    if (Math.abs(value - k) <= tolerance) {
      return { raw, tw: `${prefix}-${scale[k]}`, exact: true };
    }
  }

  // Nearest match — only use if within 15% of the value
  let bestKey = keys[0];
  let bestDist = Math.abs(value - bestKey);
  for (const k of keys) {
    const d = Math.abs(value - k);
    if (d < bestDist) {
      bestDist = d;
      bestKey = k;
    }
  }
  const threshold = Math.max(value * 0.15, 1);
  if (bestDist <= threshold) {
    return { raw, tw: `${prefix}-${scale[bestKey]}`, exact: false };
  }

  // Arbitrary value
  return { raw, tw: `${prefix}-[${value}${unit}]`, exact: false };
}

/** Resolve a spacing value (px) to a Tailwind class. */
export function resolveSpacing(px: number, prefix: string): TailwindResolved {
  if (px === 0) return { raw: "0px", tw: `${prefix}-0`, exact: true };
  return lookupScale(px, SPACING, prefix, "px");
}

/** Resolve a font size (px) to a Tailwind text-* class. */
export function resolveFontSize(px: number): TailwindResolved {
  return lookupScale(px, FONT_SIZE, "text", "px");
}

/** Resolve a font weight to a Tailwind font-* class. */
export function resolveFontWeight(weight: number): TailwindResolved {
  const raw = String(weight);
  const suffix = FONT_WEIGHT[weight];
  if (suffix) {
    return { raw, tw: `font-${suffix}`, exact: true };
  }
  // Font weights are always one of the standard values, so closest match
  const keys = Object.keys(FONT_WEIGHT).map(Number);
  let best = keys[0];
  for (const k of keys) {
    if (Math.abs(weight - k) < Math.abs(weight - best)) best = k;
  }
  return { raw, tw: `font-${FONT_WEIGHT[best]}`, exact: false };
}

/**
 * Resolve line height from Figma (lineHeightPx + fontSize) to Tailwind leading-*.
 * Uses the ratio (lineHeightPx / fontSize) to find the Tailwind token.
 */
export function resolveLineHeight(lineHeightPx: number, fontSize: number): TailwindResolved {
  const raw = `${lineHeightPx}px`;
  if (fontSize <= 0) {
    return { raw, tw: `leading-[${lineHeightPx}px]`, exact: false };
  }

  const ratio = Math.round((lineHeightPx / fontSize) * 100);
  const suffix = LINE_HEIGHT_RATIO[ratio];
  if (suffix) {
    return { raw, tw: `leading-${suffix}`, exact: true };
  }

  // Nearest ratio
  const keys = Object.keys(LINE_HEIGHT_RATIO).map(Number);
  let best = keys[0];
  let bestDist = Math.abs(ratio - best);
  for (const k of keys) {
    const d = Math.abs(ratio - k);
    if (d < bestDist) {
      bestDist = d;
      best = k;
    }
  }
  if (bestDist <= 5) {
    return { raw, tw: `leading-${LINE_HEIGHT_RATIO[best]}`, exact: false };
  }

  // Arbitrary — use the numeric value (Tailwind supports leading-[20px])
  return { raw, tw: `leading-[${lineHeightPx}px]`, exact: false };
}

/**
 * Resolve letter spacing from Figma (px value + fontSize) to Tailwind tracking-*.
 * Figma gives letterSpacing in px; Tailwind uses em-based values.
 */
export function resolveLetterSpacing(letterSpacingPx: number, fontSize: number): TailwindResolved {
  const raw = `${letterSpacingPx}px`;
  if (fontSize <= 0) {
    return { raw, tw: `tracking-[${letterSpacingPx}px]`, exact: false };
  }

  // Convert px → em percentage (×100)
  const emPct = Math.round((letterSpacingPx / fontSize) * 100);

  const suffix = LETTER_SPACING[emPct];
  if (suffix) {
    return { raw, tw: `tracking-${suffix}`, exact: true };
  }

  // Nearest
  const keys = Object.keys(LETTER_SPACING).map(Number);
  let best = keys[0];
  let bestDist = Math.abs(emPct - best);
  for (const k of keys) {
    const d = Math.abs(emPct - k);
    if (d < bestDist) {
      bestDist = d;
      best = k;
    }
  }
  if (bestDist <= 2) {
    return { raw, tw: `tracking-${LETTER_SPACING[best]}`, exact: false };
  }

  return { raw, tw: `tracking-[${letterSpacingPx}px]`, exact: false };
}

/** Resolve a border radius (px) to a Tailwind rounded-* class. */
export function resolveBorderRadius(px: number): TailwindResolved {
  if (px >= 9999) {
    return { raw: `${px}px`, tw: "rounded-full", exact: true };
  }

  const result = lookupScale(px, BORDER_RADIUS, "rounded", "px");

  // "rounded-DEFAULT" → "rounded"
  if (result.tw === "rounded-DEFAULT") {
    return { ...result, tw: "rounded" };
  }
  return result;
}

/** Resolve opacity (Figma 0-1) to a Tailwind opacity-* class. */
export function resolveOpacity(opacity: number): TailwindResolved {
  const pct = Math.round(opacity * 100);
  const raw = String(opacity);
  const suffix = OPACITY[pct];
  if (suffix) {
    return { raw, tw: `opacity-${suffix}`, exact: true };
  }
  return { raw, tw: `opacity-[${pct}%]`, exact: false };
}

/**
 * Resolve Figma effects (shadows, blurs) to Tailwind class strings.
 * Returns an array of class strings like "shadow-md", "blur-sm".
 */
export function resolveEffects(effects: FigmaEffect[]): string[] {
  const classes: string[] = [];

  for (const effect of effects) {
    if (!effect.visible) continue;

    switch (effect.type) {
      case "DROP_SHADOW": {
        const r = effect.radius;
        if (r === 0) classes.push("shadow-sm");
        else if (r <= 3) classes.push("shadow");
        else if (r <= 6) classes.push("shadow-md");
        else if (r <= 10) classes.push("shadow-lg");
        else if (r <= 15) classes.push("shadow-xl");
        else classes.push("shadow-2xl");
        break;
      }
      case "INNER_SHADOW":
        classes.push("shadow-inner");
        break;
      case "LAYER_BLUR": {
        const r = effect.radius;
        if (r <= 4) classes.push("blur-sm");
        else if (r <= 8) classes.push("blur");
        else if (r <= 12) classes.push("blur-md");
        else if (r <= 16) classes.push("blur-lg");
        else if (r <= 24) classes.push("blur-xl");
        else if (r <= 40) classes.push("blur-2xl");
        else classes.push("blur-3xl");
        break;
      }
      case "BACKGROUND_BLUR":
        classes.push("backdrop-blur");
        break;
    }
  }

  return classes;
}

/**
 * Resolve combined padding values to a concise Tailwind padding string.
 * Collapses identical values (e.g. all-same → "p-4", vertical+horizontal → "py-2 px-4").
 */
export function resolvePadding(top: number, right: number, bottom: number, left: number): string {
  if (top === right && right === bottom && bottom === left) {
    if (top === 0) return "";
    return resolveSpacing(top, "p").tw;
  }

  const parts: string[] = [];

  // Vertical
  if (top === bottom) {
    if (top > 0) parts.push(resolveSpacing(top, "py").tw);
  } else {
    if (top > 0) parts.push(resolveSpacing(top, "pt").tw);
    if (bottom > 0) parts.push(resolveSpacing(bottom, "pb").tw);
  }

  // Horizontal
  if (left === right) {
    if (left > 0) parts.push(resolveSpacing(left, "px").tw);
  } else {
    if (left > 0) parts.push(resolveSpacing(left, "pl").tw);
    if (right > 0) parts.push(resolveSpacing(right, "pr").tw);
  }

  return parts.join(" ");
}
