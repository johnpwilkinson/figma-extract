/**
 * Extracts a Figma FRAME / COMPONENT / SECTION node into a ParsedFrame.
 * Handles auto-layout, padding, fills, strokes, border radius, effects, and opacity.
 */

import type { FigmaNode } from "../types/figma-api";
import type { ParsedFrame, ParsedColor } from "../types/parsed";
import {
  resolveSpacing,
  resolveBorderRadius,
  resolveEffects,
  resolveOpacity,
  resolvePadding,
  resolveFirstSolidFill,
} from "../resolvers/tailwind";
import {
  matchHexToSemanticRole,
  semanticTokenToTailwind,
} from "../resolvers/semantic-tokens";

export interface FrameExtractorConfig {
  isDarkMode?: boolean;
  useShadcn?: boolean;
}

function enrichColorWithSemantic(
  color: ParsedColor | undefined,
  prefix: string,
  config: FrameExtractorConfig,
): ParsedColor | undefined {
  if (!color || !config.useShadcn) return color;
  const semantic = matchHexToSemanticRole(color.hex, config.isDarkMode ?? true);
  if (semantic) {
    color.semanticToken = semantic.token;
    color.tw.tw = semanticTokenToTailwind(semantic.token, prefix);
    color.tw.exact = true;
  }
  return color;
}

/** Map Figma primary-axis alignment → CSS-style keyword */
function mapPrimaryAlign(v?: string): string {
  switch (v) {
    case "MIN": return "start";
    case "CENTER": return "center";
    case "MAX": return "end";
    case "SPACE_BETWEEN": return "between";
    default: return "start";
  }
}

/** Map Figma counter-axis alignment → CSS-style keyword */
function mapCounterAlign(v?: string): string {
  switch (v) {
    case "MIN": return "start";
    case "CENTER": return "center";
    case "MAX": return "end";
    case "BASELINE": return "baseline";
    default: return "start";
  }
}

/** Resolve horizontal sizing to a human-readable string */
function resolveSizing(
  mode?: "FIXED" | "HUG" | "FILL",
  boundingBox?: { width: number; height: number },
  dimension: "width" | "height" = "width",
): string {
  switch (mode) {
    case "FILL": return "fill-parent";
    case "HUG": return "hug-contents";
    case "FIXED":
    default: {
      const px = boundingBox
        ? dimension === "width"
          ? boundingBox.width
          : boundingBox.height
        : 0;
      return px ? `${Math.round(px)}px` : "auto";
    }
  }
}

export function extractFrame(node: FigmaNode, config?: FrameExtractorConfig): ParsedFrame {
  const cfg = config ?? {};
  const hasAutoLayout = node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL";

  const top = node.paddingTop ?? 0;
  const right = node.paddingRight ?? 0;
  const bottom = node.paddingBottom ?? 0;
  const left = node.paddingLeft ?? 0;
  const paddingTw = resolvePadding(top, right, bottom, left);

  const frame: ParsedFrame = {
    type: "FRAME",
    name: node.name,
    figmaId: node.id,
    width: resolveSizing(node.layoutSizingHorizontal, node.absoluteBoundingBox, "width"),
    height: resolveSizing(node.layoutSizingVertical, node.absoluteBoundingBox, "height"),
  };

  // Auto-layout
  if (hasAutoLayout) {
    frame.layout = {
      mode: node.layoutMode === "HORIZONTAL" ? "horizontal" : "vertical",
      padding: { top, right, bottom, left },
      gap: resolveSpacing(node.itemSpacing ?? 0, "gap"),
      primaryAlign: mapPrimaryAlign(node.primaryAxisAlignItems),
      counterAlign: mapCounterAlign(node.counterAxisAlignItems),
      wrap: node.layoutWrap === "WRAP" ? true : undefined,
    };
  }

  // Padding Tailwind string (even without auto-layout, frames can have padding)
  if (paddingTw) {
    frame.paddingTw = paddingTw;
  }

  // Fills
  if (node.fills?.length) {
    const fill = enrichColorWithSemantic(
      resolveFirstSolidFill(node.fills, "bg"), "bg", cfg
    );
    if (fill) frame.fill = fill;
  }

  // Strokes
  if (node.strokes?.length) {
    const stroke = enrichColorWithSemantic(
      resolveFirstSolidFill(node.strokes, "border"), "border", cfg
    );
    if (stroke) frame.stroke = stroke;
    if (node.strokeWeight) frame.strokeWeight = node.strokeWeight;
  }

  // Corner radius
  if (node.cornerRadius && node.cornerRadius > 0) {
    frame.cornerRadius = resolveBorderRadius(node.cornerRadius);
  }

  // Effects
  if (node.effects?.length) {
    const effectClasses = resolveEffects(node.effects);
    if (effectClasses.length > 0) {
      frame.effects = effectClasses;
    }
  }

  // Opacity
  if (node.opacity !== undefined && node.opacity < 1) {
    frame.opacity = node.opacity;
  }

  return frame;
}
