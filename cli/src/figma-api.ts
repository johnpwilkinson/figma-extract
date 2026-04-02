import type { FigmaFileNodesResponse } from "./types/figma-api";

export interface FigmaTarget {
  fileKey: string;
  nodeId: string;
}

export function parseFigmaUrl(input: string): FigmaTarget {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid URL: " + input);
  }

  if (!url.hostname.endsWith("figma.com")) {
    throw new Error("Not a Figma URL: " + input);
  }

  // Path: /design/{fileKey}/{fileName} or /file/{fileKey}/{fileName}
  const pathParts = url.pathname.split("/").filter(Boolean);
  if (
    pathParts.length < 2 ||
    !["design", "file"].includes(pathParts[0])
  ) {
    throw new Error("Unrecognized Figma URL format: " + input);
  }

  const fileKey = pathParts[1];

  const nodeIdParam = url.searchParams.get("node-id");
  if (!nodeIdParam) {
    throw new Error("URL missing node-id query parameter: " + input);
  }

  // Figma URLs use hyphens in node-id param, API uses colons
  // Must use replaceAll — node IDs can have multiple segments (e.g., "123-456-789")
  const nodeId = nodeIdParam.replaceAll("-", ":");

  return { fileKey, nodeId };
}

export function parseCliArgs(args: string[]): FigmaTarget {
  // If first positional arg looks like a URL, parse it
  if (args[0]?.startsWith("http")) {
    return parseFigmaUrl(args[0]);
  }

  // Otherwise look for --file and --node flags
  let fileKey: string | undefined;
  let nodeId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && args[i + 1]) {
      fileKey = args[i + 1];
      i++;
    } else if (args[i] === "--node" && args[i + 1]) {
      nodeId = args[i + 1];
      i++;
    }
  }

  if (!fileKey) throw new Error("Missing --file argument");
  if (!nodeId) throw new Error("Missing --node argument");

  return { fileKey, nodeId };
}

const FIGMA_API_BASE = "https://api.figma.com/v1";

export async function fetchFigmaNodes(
  target: FigmaTarget
): Promise<FigmaFileNodesResponse> {
  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    throw new Error(
      "Missing FIGMA_TOKEN environment variable.\n" +
        "Generate one at: Figma > Settings > Account > Personal Access Tokens\n" +
        "Then: export FIGMA_TOKEN=your_token_here"
    );
  }

  const nodeIdEncoded = encodeURIComponent(target.nodeId);
  const url =
    FIGMA_API_BASE +
    "/files/" +
    target.fileKey +
    "/nodes?ids=" +
    nodeIdEncoded +
    "&geometry=paths&plugin_data=shared";

  const response = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });

  if (response.status === 401) {
    throw new Error(
      "Figma API: Invalid or expired token. Check your FIGMA_TOKEN."
    );
  }
  if (response.status === 404) {
    throw new Error(
      "Figma API: File or node not found. File: " +
        target.fileKey +
        ", Node: " +
        target.nodeId
    );
  }
  if (response.status === 429) {
    throw new Error(
      "Figma API: Rate limited. Wait a moment and try again."
    );
  }
  if (!response.ok) {
    throw new Error(
      "Figma API error: " + response.status + " " + response.statusText
    );
  }

  const data = (await response.json()) as FigmaFileNodesResponse;

  if (data.err) {
    throw new Error("Figma API returned error: " + data.err);
  }

  const nodeData = data.nodes[target.nodeId];
  if (!nodeData) {
    throw new Error(
      "Node " +
        target.nodeId +
        " not found in response. Available: " +
        Object.keys(data.nodes).join(", ")
    );
  }

  return data;
}

function getToken(): string {
  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    throw new Error(
      "Missing FIGMA_TOKEN environment variable.\n" +
        "Generate one at: Figma > Settings > Account > Personal Access Tokens\n" +
        "Then: export FIGMA_TOKEN=your_token_here"
    );
  }
  return token;
}

async function figmaGet(path: string): Promise<any> {
  const response = await fetch(FIGMA_API_BASE + path, {
    headers: { "X-Figma-Token": getToken() },
  });
  if (!response.ok) return null;
  return response.json();
}

/**
 * Resolve all image fill refs in a file to downloadable S3 URLs.
 * Returns a map: imageRef hash → URL string.
 */
export async function fetchImageFills(
  fileKey: string,
): Promise<Record<string, string>> {
  const data = await figmaGet("/files/" + fileKey + "/images");
  if (!data?.meta?.images) return {};
  return data.meta.images as Record<string, string>;
}

/**
 * Render a specific node as a PNG and return the image URL.
 */
export async function fetchNodeScreenshot(
  target: FigmaTarget,
): Promise<string | undefined> {
  const nodeIdEncoded = encodeURIComponent(target.nodeId);
  const data = await figmaGet(
    "/images/" + target.fileKey + "?ids=" + nodeIdEncoded + "&format=png&scale=2"
  );
  if (!data?.images) return undefined;
  return data.images[target.nodeId] ?? undefined;
}

/**
 * Export multiple nodes as SVG files and return a map of nodeId → SVG URL.
 */
export async function fetchSvgExports(
  fileKey: string,
  nodeIds: string[],
): Promise<Record<string, string>> {
  if (nodeIds.length === 0) return {};
  const ids = nodeIds.map((id) => encodeURIComponent(id)).join(",");
  const data = await figmaGet(
    "/images/" + fileKey + "?ids=" + ids + "&format=svg"
  );
  if (!data?.images) return {};
  return data.images as Record<string, string>;
}

/**
 * Download a file from a URL and save it to disk.
 */
export async function downloadFile(
  url: string,
  destPath: string,
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) return;
  const buffer = await response.arrayBuffer();
  await Bun.write(destPath, buffer);
}
