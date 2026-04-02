/**
 * Extracts a Figma VECTOR / BOOLEAN_OPERATION / STAR / LINE / REGULAR_POLYGON node.
 * Determines if the vector is likely an icon and produces ParsedIcon or ParsedShape.
 */

import type { FigmaNode } from "../types/figma-api";
import type { ParsedIcon, ParsedShape } from "../types/parsed";
import { isLikelyIcon } from "../resolvers/component-map";
import { resolveFirstSolidFill } from "../resolvers/tailwind";
import { resolveBorderRadius, resolveEffects } from "../resolvers/tailwind";

export interface VectorExtractOptions {
  iconLibrary: string; // e.g. "lucide-react"
}

/** Convert a Figma name to a PascalCase icon name guess (e.g. "trending-up" → "TrendingUp") */
function toIconName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

export function extractVector(
  node: FigmaNode,
  options: VectorExtractOptions,
): ParsedIcon | ParsedShape {
  const bb = node.absoluteBoundingBox;
  const width = bb?.width ?? node.size?.x ?? 0;
  const height = bb?.height ?? node.size?.y ?? 0;

  if (isLikelyIcon(node.name, width, height)) {
    const icon: ParsedIcon = {
      type: "ICON",
      name: node.name,
      figmaId: node.id,
      source: `${options.iconLibrary}/${toIconName(node.name)}`,
      size: { width: Math.round(width), height: Math.round(height) },
    };

    if (node.fills?.length) {
      const color = resolveFirstSolidFill(node.fills, "text");
      if (color) icon.color = color;
    }

    return icon;
  }

  // Fall back to shape
  const shape: ParsedShape = {
    type: "SHAPE",
    name: node.name,
    figmaId: node.id,
    shapeType: node.type,
    width: Math.round(width),
    height: Math.round(height),
  };

  if (node.fills?.length) {
    const fill = resolveFirstSolidFill(node.fills, "bg");
    if (fill) shape.fill = fill;
  }

  if (node.strokes?.length) {
    const stroke = resolveFirstSolidFill(node.strokes, "border");
    if (stroke) shape.stroke = stroke;
  }

  if (node.cornerRadius && node.cornerRadius > 0) {
    shape.cornerRadius = resolveBorderRadius(node.cornerRadius);
  }

  if (node.effects?.length) {
    const effectClasses = resolveEffects(node.effects);
    if (effectClasses.length > 0) shape.effects = effectClasses;
  }

  return shape;
}
