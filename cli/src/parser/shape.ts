/**
 * Extracts a Figma shape node (RECTANGLE, ELLIPSE, LINE, REGULAR_POLYGON, STAR)
 * into a ParsedShape or ParsedImage (if the node has an IMAGE fill).
 */

import type { FigmaNode } from "../types/figma-api";
import type { ParsedShape, ParsedImage } from "../types/parsed";
import {
  resolveFirstSolidFill,
  resolveBorderRadius,
  resolveEffects,
} from "../resolvers/tailwind";

export function extractShape(node: FigmaNode, imageFills?: Record<string, string>): ParsedShape | ParsedImage {
  const bb = node.absoluteBoundingBox;
  const width = bb?.width ?? node.size?.x ?? 0;
  const height = bb?.height ?? node.size?.y ?? 0;

  // Check if this shape has an IMAGE fill — treat as image node
  const imageFill = node.fills?.find(
    (f) => f.type === "IMAGE" && f.visible !== false
  );
  if (imageFill) {
    const image: ParsedImage = {
      type: "IMAGE",
      name: node.name,
      figmaId: node.id,
      width: Math.round(width),
      height: Math.round(height),
      imageRef: imageFill.imageRef,
      imageUrl: imageFill.imageRef && imageFills?.[imageFill.imageRef],
      scaleMode: imageFill.scaleMode,
    };
    if (node.cornerRadius && node.cornerRadius >= 9999) {
      image.clipped = true;
    }
    if (node.cornerRadius && node.cornerRadius > 0) {
      image.cornerRadius = resolveBorderRadius(node.cornerRadius);
    }
    return image;
  }

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
