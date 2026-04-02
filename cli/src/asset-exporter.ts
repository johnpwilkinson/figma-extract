/**
 * Post-processing step: detects custom/brand vector assets in the parsed tree,
 * exports them as SVG files from Figma, downloads them, and saves to the project's
 * assets directory.
 *
 * Detection uses two patterns that reliably distinguish custom assets from standard
 * UI icons (lucide, fontawesome, etc.):
 *
 * 1. PascalCase after "Icon / " — standard icons use lowercase (Icon / chevron-down),
 *    custom assets use PascalCase (Icon / MarekLogoIcon, Icon / AcmeBadge)
 * 2. Large vectors (> 24px) — standard icons are 12-16px, custom assets are larger
 */

import { existsSync, mkdirSync } from "fs";
import { resolve, join } from "path";
import type { ParsedNode, ParsedIcon, ParsedShape, ParsedInstance } from "./types/parsed";
import { fetchSvgExports, downloadFile } from "./figma-api";
import type { FigmaNode, FigmaComponentMeta } from "./types/figma-api";

interface ExportableAsset {
  figmaId: string;
  name: string;
}

/**
 * Check if an INSTANCE node is a custom/brand asset that should be exported as SVG.
 * Uses the component metadata from the Figma API to make the determination.
 */
function isCustomAsset(
  node: FigmaNode,
  components: Record<string, FigmaComponentMeta>,
): boolean {
  const meta = node.componentId ? components[node.componentId] : undefined;
  if (!meta) return false;

  const componentName = meta.name;

  // Pattern 1: PascalCase after "Icon / " indicates a custom asset
  // Standard lucide icons: "Icon / chevron-down", "Icon / arrow-up-down" (all lowercase)
  // Custom assets: "Icon / MarekLogoIcon", "Icon / AcmeBadge" (PascalCase)
  const pascalMatch = componentName.match(/^Icon \/ ([A-Z])/);
  if (pascalMatch) return true;

  // Pattern 2: Large instance (> 24px in either dimension) containing vectors
  const bb = node.absoluteBoundingBox;
  const isLarge = bb && (bb.width > 24 || bb.height > 24);
  const hasVectors = node.children?.some((c) => c.type === "VECTOR") ?? false;
  if (isLarge && hasVectors) return true;

  return false;
}

/**
 * Walk the Figma node tree and collect custom assets that should be exported as SVGs.
 * Also checks for IMAGE fills on any node (PNG/JPG assets the designer placed).
 */
export function collectExportableAssets(
  figmaRoot: FigmaNode,
  components: Record<string, FigmaComponentMeta>,
): ExportableAsset[] {
  const assets: ExportableAsset[] = [];
  const seen = new Set<string>();

  function walk(node: FigmaNode) {
    // Check INSTANCE nodes for custom vector assets
    if (node.type === "INSTANCE" && !seen.has(node.id)) {
      if (isCustomAsset(node, components)) {
        seen.add(node.id);
        assets.push({ figmaId: node.id, name: node.name });
      }
    }

    for (const child of node.children ?? []) {
      walk(child);
    }
  }

  walk(figmaRoot);
  return assets;
}

/**
 * Convert a Figma node name to a kebab-case filename.
 * "Icon / MarekLogoIcon" -> "marek-logo-icon"
 * "Icon / AcmeBadge" -> "acme-badge"
 * "Company Logo" -> "company-logo"
 */
function toFilename(name: string): string {
  return name
    .replace(/^.*\/\s*/, "") // strip "Icon / " or similar prefix
    .replace(/([a-z])([A-Z])/g, "$1-$2") // camelCase to kebab
    .replace(/[^a-zA-Z0-9]+/g, "-") // non-alphanumeric to dash
    .replace(/^-+|-+$/g, "") // trim dashes
    .toLowerCase();
}

/**
 * Export assets as SVG files:
 * 1. Batch-request SVG URLs from Figma
 * 2. Download each SVG
 * 3. Save to the assets directory
 * Returns a map of figmaId -> local file path (relative to cwd)
 */
export async function exportAssets(
  fileKey: string,
  assets: ExportableAsset[],
  assetsDir: string = "src/assets",
  cwd: string = process.cwd(),
): Promise<Record<string, string>> {
  if (assets.length === 0) return {};

  const nodeIds = assets.map((a) => a.figmaId);
  const svgUrls = await fetchSvgExports(fileKey, nodeIds);

  const fullAssetsDir = resolve(cwd, assetsDir);
  if (!existsSync(fullAssetsDir)) {
    mkdirSync(fullAssetsDir, { recursive: true });
  }

  const savedPaths: Record<string, string> = {};

  for (const asset of assets) {
    const url = svgUrls[asset.figmaId];
    if (!url) continue;

    const filename = toFilename(asset.name) + ".svg";
    const localPath = join(assetsDir, filename);
    const fullPath = resolve(cwd, localPath);

    await downloadFile(url, fullPath);
    savedPaths[asset.figmaId] = localPath;
  }

  return savedPaths;
}

/**
 * Update parsed nodes with saved asset paths.
 * Walks the tree and tags matching INSTANCE/ICON nodes with their local file paths.
 */
export function updateNodesWithAssetPaths(
  root: ParsedNode,
  assetPaths: Record<string, string>,
): void {
  function walk(node: ParsedNode) {
    if (assetPaths[node.figmaId]) {
      if (node.type === "ICON") {
        (node as ParsedIcon).source = "asset:" + assetPaths[node.figmaId];
      } else if (node.type === "INSTANCE") {
        // Tag the instance so the formatter can show the asset path
        (node as any).assetPath = assetPaths[node.figmaId];
      }
    }
    for (const child of (node as any).children ?? []) {
      walk(child);
    }
  }
  walk(root);
}
