import type { FigmaNode } from "../types/figma-api";
import type { ParsedText } from "../types/parsed";
import {
  resolveFontSize,
  resolveFontWeight,
  resolveLineHeight,
  resolveLetterSpacing,
  resolveFirstSolidFill,
  resolveColor,
} from "../resolvers/tailwind";

export interface TextExtractorConfig {
  defaultFont?: string;
}

/** Extract a TEXT FigmaNode into a ParsedText. */
export function extractText(
  node: FigmaNode,
  config: TextExtractorConfig,
): ParsedText {
  const style = node.style;

  const font = style?.fontFamily ?? "Inter";
  const fontIsDefault = font === config.defaultFont;

  const weight = resolveFontWeight(style?.fontWeight ?? 400);
  const size = resolveFontSize(style?.fontSize ?? 16);
  const lineHeight = resolveLineHeight(
    Math.round(style?.lineHeightPx ?? 0),
    style?.fontSize ?? 16,
  );
  const letterSpacing = resolveLetterSpacing(
    style?.letterSpacing ?? 0,
    style?.fontSize ?? 16,
  );

  // Text color: prefer node.fills (has instance overrides) over style.fills
  const fallbackBlack = resolveColor({ r: 0, g: 0, b: 0, a: 1 }, "text");
  const nodeFills = node.fills ?? style?.fills;
  const color = nodeFills
    ? (resolveFirstSolidFill(nodeFills, "text") ?? fallbackBlack)
    : fallbackBlack;

  const align = (style?.textAlignHorizontal ?? "LEFT").toLowerCase();

  const decoration =
    style?.textDecoration && style.textDecoration !== "NONE"
      ? style.textDecoration.toLowerCase()
      : undefined;

  const textCase =
    style?.textCase && style.textCase !== "ORIGINAL"
      ? style.textCase.toLowerCase()
      : undefined;

  return {
    type: "TEXT",
    name: node.name,
    figmaId: node.id,
    content: node.characters ?? "",
    font,
    fontIsDefault,
    weight,
    size,
    lineHeight,
    letterSpacing,
    color,
    align,
    decoration,
    textCase,
  };
}
