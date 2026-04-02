/**
 * Tree walker: recursively traverses a Figma node tree and produces ParsedNode[].
 * Dispatches each node to the appropriate extractor based on its type.
 */

import type { FigmaNode, FigmaComponentMeta } from "../types/figma-api";
import type { ParsedNode } from "../types/parsed";
import type { FigmaExtractConfig } from "../config";
import { extractFrame } from "./frame";
import { extractText, type TextExtractorConfig } from "./text";
import { extractInstance, type InstanceExtractOptions } from "./instance";
import { extractVector, type VectorExtractOptions } from "./vector";
import { extractShape } from "./shape";

export interface WalkContext {
  config: FigmaExtractConfig;
  components: Record<string, FigmaComponentMeta>;
  isDarkMode?: boolean;
  useShadcn?: boolean;
  imageFills?: Record<string, string>; // imageRef hash → URL
}

/** Node types that act like frames (have children and auto-layout) */
const FRAME_TYPES = new Set([
  "FRAME",
  "COMPONENT",
  "COMPONENT_SET",
  "SECTION",
  "GROUP",
]);

/** Node types handled as vectors (may become icons or shapes) */
const VECTOR_TYPES = new Set([
  "VECTOR",
  "BOOLEAN_OPERATION",
  "STAR",
  "LINE",
  "REGULAR_POLYGON",
]);

/** Node types handled as basic shapes */
const SHAPE_TYPES = new Set([
  "RECTANGLE",
  "ELLIPSE",
]);

/**
 * Walk a single Figma node and return its parsed representation.
 * Skips invisible nodes (returns undefined).
 */
function walkNode(
  node: FigmaNode,
  ctx: WalkContext,
): ParsedNode | undefined {
  // Skip invisible nodes
  if (node.visible === false) return undefined;

  if (node.type === "TEXT") {
    const textConfig: TextExtractorConfig = {
      defaultFont: ctx.config.defaults?.font,
      isDarkMode: ctx.isDarkMode,
      useShadcn: ctx.useShadcn,
    };
    return extractText(node, textConfig);
  }

  if (node.type === "INSTANCE") {
    const instanceOpts: InstanceExtractOptions = {
      components: ctx.components,
      configComponentMap: ctx.config.componentMap,
    };
    const instance = extractInstance(node, instanceOpts);

    // Recursively walk instance children for overrides
    if (node.children?.length) {
      const children = walkChildren(node.children, ctx);
      if (children.length > 0) {
        instance.children = children;
      }
    }

    return instance;
  }

  if (VECTOR_TYPES.has(node.type)) {
    const vectorOpts: VectorExtractOptions = {
      iconLibrary: ctx.config.iconLibrary,
    };
    return extractVector(node, vectorOpts);
  }

  if (SHAPE_TYPES.has(node.type)) {
    return extractShape(node, ctx.imageFills);
  }

  if (FRAME_TYPES.has(node.type)) {
    const frame = extractFrame(node, { isDarkMode: ctx.isDarkMode, useShadcn: ctx.useShadcn });

    // Recursively walk children
    if (node.children?.length) {
      const children = walkChildren(node.children, ctx);
      if (children.length > 0) {
        frame.children = children;
      }
    }

    return frame;
  }

  // Unknown node type — if it has children, treat as a frame
  if (node.children?.length) {
    const frame = extractFrame(node, { isDarkMode: ctx.isDarkMode, useShadcn: ctx.useShadcn });
    const children = walkChildren(node.children, ctx);
    if (children.length > 0) {
      frame.children = children;
    }
    return frame;
  }

  // Leaf node of unknown type — skip
  return undefined;
}

/** Walk an array of children, filtering out undefined results. */
function walkChildren(
  children: FigmaNode[],
  ctx: WalkContext,
): ParsedNode[] {
  const result: ParsedNode[] = [];
  for (const child of children) {
    const parsed = walkNode(child, ctx);
    if (parsed) result.push(parsed);
  }
  return result;
}

/**
 * Walk an entire Figma document node tree and produce a flat array of ParsedNode[].
 * The top-level node is typically the FRAME selected by the user.
 */
export function walkTree(
  rootNode: FigmaNode,
  ctx: WalkContext,
): ParsedNode[] {
  const root = walkNode(rootNode, ctx);
  if (!root) return [];
  return [root];
}
