#!/usr/bin/env bun
/**
 * figma-extract CLI entry point.
 *
 * Usage:
 *   figma-extract <figma-url>
 *   figma-extract --file <fileKey> --node <nodeId>
 *   figma-extract --help
 */

import { loadConfig } from "./config";
import { parseFigmaUrl, parseCliArgs, fetchFigmaNodes, fetchImageFills, fetchNodeScreenshot } from "./figma-api";
import { walkTree, type WalkContext } from "./parser/index";
import { formatTree } from "./formatter";
import { detectShadcn, detectCssPath, readProjectCssVars } from "./resolvers/css-vars";
import { collectExportableAssets, exportAssets, updateNodesWithAssetPaths } from "./asset-exporter";

const HELP = `
figma-extract — Extract Figma design nodes as structured text with Tailwind mappings.

Usage:
  figma-extract <figma-url>
  figma-extract --file <fileKey> --node <nodeId>

Options:
  --help, -h    Show this help message
  --json        Output raw parsed JSON instead of formatted text

Environment:
  FIGMA_TOKEN   Figma personal access token (required)

Config:
  Place a .figma-extract.json in your project root to set defaults:
  {
    "figmaToken": "...",       // alternative to FIGMA_TOKEN env var
    "defaults": { "font": "Inter" },
    "componentMap": { "MyButton": "shadcn/Button" },
    "iconLibrary": "lucide-react"
  }
`.trim();

async function main() {
  const args = process.argv.slice(2);

  // Help
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    process.exit(args.length === 0 ? 1 : 0);
  }

  const jsonMode = args.includes("--json");
  const darkMode = args.includes("--dark") || !args.includes("--light");
  const filteredArgs = args.filter((a) => !["--json", "--dark", "--light"].includes(a));

  try {
    // Parse target
    const target = parseCliArgs(filteredArgs);

    // Load config
    const config = loadConfig();

    // Fetch from Figma API — nodes + image fills + screenshot in parallel
    const [response, imageFills, screenshotUrl] = await Promise.all([
      fetchFigmaNodes(target),
      fetchImageFills(target.fileKey),
      fetchNodeScreenshot(target),
    ]);

    const imageCount = Object.keys(imageFills).length;
    if (imageCount > 0) {
      console.error("[figma-extract] Resolved " + imageCount + " image fill URLs");
    }
    if (screenshotUrl) {
      console.error("[figma-extract] Screenshot: " + screenshotUrl);
    }

    // Get the node data
    const nodeData = response.nodes[target.nodeId];
    if (!nodeData) {
      console.error("Error: Node not found in API response");
      process.exit(1);
    }

    const rootNode = nodeData.document;

    // Detect shadcn and project CSS
    const useShadcn = detectShadcn();
    if (useShadcn) {
      console.error("[figma-extract] Detected shadcn project — using semantic token mapping");
    }

    const cssPath = detectCssPath();
    let cssInfo = "";
    if (cssPath) {
      const vars = await readProjectCssVars(cssPath);
      const mode = darkMode ? "dark" : "light";
      const varCount = Object.keys(darkMode ? vars.dark : vars.light).length;
      if (varCount > 0) {
        cssInfo = " (" + varCount + " " + mode + " CSS vars from " + cssPath + ")";
      }
    }
    if (cssInfo) {
      console.error("[figma-extract] Project CSS loaded" + cssInfo);
    }

    // Build walk context
    const ctx: WalkContext = {
      config,
      components: nodeData.components,
      isDarkMode: darkMode,
      useShadcn,
      imageFills,
    };

    // Walk the tree
    const parsed = walkTree(rootNode, ctx);

    if (parsed.length === 0) {
      console.error("Warning: No parseable nodes found in selection");
      process.exit(0);
    }

    // Export custom assets (SVGs) — logos, brand icons, etc.
    // Uses PascalCase naming + size heuristics to distinguish from standard UI icons
    const exportableAssets = collectExportableAssets(rootNode, nodeData.components);
    if (exportableAssets.length > 0) {
      console.error("[figma-extract] Exporting " + exportableAssets.length + " custom asset(s) as SVG...");
      const assetPaths = await exportAssets(target.fileKey, exportableAssets);
      const savedCount = Object.keys(assetPaths).length;
      if (savedCount > 0) {
        console.error("[figma-extract] Saved " + savedCount + " SVG(s) to src/assets/");
        updateNodesWithAssetPaths(parsed[0], assetPaths);
      }
    }

    if (jsonMode) {
      console.log(JSON.stringify(parsed, null, 2));
    } else {
      const output = formatTree(parsed[0], rootNode.name, target.nodeId, screenshotUrl);
      console.log(output);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error: " + message);
    process.exit(1);
  }
}

main();
