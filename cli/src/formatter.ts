import type {
  ParsedNode,
  ParsedFrame,
  ParsedText,
  ParsedInstance,
  ParsedIcon,
  ParsedShape,
  ParsedImage,
  TailwindResolved,
  ParsedColor,
} from "./types/parsed";

const INDENT = "  ";

function ind(level: number): string {
  return INDENT.repeat(level);
}

function tw(resolved: TailwindResolved): string {
  return resolved.raw + " → " + resolved.tw;
}

function colorStr(color: ParsedColor, prefix: string): string {
  let str = prefix + ": " + color.hex + " → " + color.tw.tw;
  if (color.semanticToken) {
    str += " (token: --" + color.semanticToken + ")";
  }
  if (color.cssMismatch) {
    str += " !! CSS mismatch — update project CSS";
  }
  return str;
}

function formatText(node: ParsedText, level: number): string {
  const i = ind(level);
  const p = ind(level + 1);
  const lines: string[] = [];

  lines.push(i + "TEXT: " + node.name);
  lines.push(p + 'Content: "' + node.content + '"');
  if (node.fontIsDefault) {
    // Suppress default font — only note if it deviates
  } else {
    lines.push(p + "Font: " + node.font);
  }
  lines.push(p + "Weight: " + tw(node.weight));
  lines.push(p + "Size: " + tw(node.size));
  lines.push(p + "Line height: " + tw(node.lineHeight));

  if (node.letterSpacing.tw !== "tracking-normal") {
    lines.push(
      p + "Letter spacing: " + tw(node.letterSpacing)
    );
  }

  lines.push(p + colorStr(node.color, "Color"));

  if (node.align && node.align !== "left") {
    lines.push(p + "Align: " + node.align);
  }
  if (node.decoration) {
    lines.push(p + "Decoration: " + node.decoration);
  }
  if (node.textCase) {
    lines.push(p + "Text case: " + node.textCase);
  }

  return lines.join("\n");
}

function inferFrameHint(node: ParsedFrame): string {
  // Only annotate auto-generated Figma names
  if (!/^Frame \d+$/.test(node.name)) return "";

  const children = node.children ?? [];
  if (children.length === 0) return "";

  const types = children.map((c) => c.type);
  const allText = types.every((t) => t === "TEXT");
  const allSameType = types.every((t) => t === types[0]);

  if (allText && children.length <= 3) return " (text row)";
  if (allSameType && children.length > 3) return " (list — " + children.length + " items)";
  if (children.length === 2 && node.layout?.mode === "horizontal") return " (row)";
  if (children.length > 3) return " (" + children.length + " items)";

  return "";
}

function formatFrame(
  node: ParsedFrame,
  level: number
): string {
  const i = ind(level);
  const p = ind(level + 1);
  const lines: string[] = [];

  lines.push(i + "FRAME: " + node.name + inferFrameHint(node));

  if (node.layout) {
    lines.push(
      p + "Layout: auto-layout " + node.layout.mode
    );
    if (node.paddingTw) {
      const pd = node.layout.padding;
      lines.push(
        p +
          "Padding: " +
          pd.top +
          " " +
          pd.right +
          " " +
          pd.bottom +
          " " +
          pd.left +
          " → " +
          node.paddingTw
      );
    }
    lines.push(p + "Gap: " + tw(node.layout.gap));

    if (node.layout.primaryAlign !== "start") {
      lines.push(
        p +
          "Align: " +
          node.layout.primaryAlign +
          " (main-axis)"
      );
    }
    if (node.layout.counterAlign !== "start") {
      lines.push(
        p +
          "Align: " +
          node.layout.counterAlign +
          " (cross-axis)"
      );
    }
    if (node.layout.wrap) {
      lines.push(p + "Wrap: true");
    }
  }

  lines.push(p + "Width: " + node.width);
  lines.push(p + "Height: " + node.height);

  if (node.fill) lines.push(p + colorStr(node.fill, "Fill"));
  if (node.stroke) {
    lines.push(p + colorStr(node.stroke, "Stroke"));
    if (node.strokeWeight)
      lines.push(
        p + "Stroke weight: " + node.strokeWeight + "px"
      );
  }
  if (node.cornerRadius)
    lines.push(
      p + "Corner radius: " + tw(node.cornerRadius)
    );
  if (node.opacity !== undefined)
    lines.push(p + "Opacity: " + node.opacity);
  if (node.effects?.length) {
    for (const effect of node.effects) {
      lines.push(p + "Effect: " + effect);
    }
  }

  if (node.children?.length) {
    lines.push("");
    for (const child of node.children) {
      lines.push(formatNode(child, level + 1));
      lines.push("");
    }
  }

  return lines.join("\n");
}

function formatInstance(
  node: ParsedInstance,
  level: number
): string {
  const i = ind(level);
  const p = ind(level + 1);
  const lines: string[] = [];

  const header = node.mappedComponent
    ? i +
      "INSTANCE: " +
      node.name +
      " → " +
      node.mappedComponent
    : i +
      "INSTANCE: " +
      node.name +
      " (" +
      node.componentName +
      ")";

  lines.push(header);

  if (node.variantProperties) {
    for (const [key, value] of Object.entries(
      node.variantProperties
    )) {
      lines.push(p + key + ": " + value);
    }
  }

  if ((node as any).assetPath) {
    lines.push(p + "Asset: " + (node as any).assetPath);
  } else if (node.isRemote) {
    lines.push(p + "Source: external library");
  }

  // Fully expand children — show everything inside the instance
  if (node.children?.length) {
    lines.push("");
    for (const child of node.children) {
      lines.push(formatNode(child, level + 1));
      lines.push("");
    }
  }

  return lines.join("\n");
}

function formatIcon(
  node: ParsedIcon,
  level: number
): string {
  const i = ind(level);
  const p = ind(level + 1);
  const lines: string[] = [];

  lines.push(i + "ICON: " + node.name);
  if (node.source.startsWith("asset:")) {
    lines.push(p + "Asset: " + node.source.replace("asset:", ""));
  } else {
    lines.push(p + "Source: " + node.source);
  }
  lines.push(
    p + "Size: " + node.size.width + "x" + node.size.height
  );
  if (node.color)
    lines.push(p + colorStr(node.color, "Color"));

  return lines.join("\n");
}

function formatShape(
  node: ParsedShape,
  level: number
): string {
  const i = ind(level);
  const p = ind(level + 1);
  const lines: string[] = [];

  lines.push(
    i + "SHAPE: " + node.name + " (" + node.shapeType + ")"
  );
  lines.push(
    p + "Size: " + node.width + "x" + node.height
  );
  if (node.fill) lines.push(p + colorStr(node.fill, "Fill"));
  if (node.stroke)
    lines.push(p + colorStr(node.stroke, "Stroke"));
  if (node.cornerRadius)
    lines.push(
      p + "Corner radius: " + tw(node.cornerRadius)
    );

  return lines.join("\n");
}

function formatImage(
  node: ParsedImage,
  level: number
): string {
  const i = ind(level);
  const p = ind(level + 1);
  const lines: string[] = [];

  lines.push(i + "IMAGE: " + node.name);
  lines.push(p + "Size: " + node.width + "x" + node.height);
  if (node.scaleMode) lines.push(p + "Scale: " + node.scaleMode.toLowerCase());
  if (node.clipped) lines.push(p + "Shape: circle (clipped)");
  if (node.cornerRadius) lines.push(p + "Corner radius: " + tw(node.cornerRadius));
  if (node.imageUrl) {
    lines.push(p + "URL: " + node.imageUrl);
  } else if (node.imageRef) {
    lines.push(p + "Ref: " + node.imageRef);
  }

  return lines.join("\n");
}

export function formatNode(
  node: ParsedNode,
  level: number = 0
): string {
  switch (node.type) {
    case "TEXT":
      return formatText(node, level);
    case "FRAME":
      return formatFrame(node, level);
    case "INSTANCE":
      return formatInstance(node, level);
    case "ICON":
      return formatIcon(node, level);
    case "SHAPE":
      return formatShape(node, level);
    case "IMAGE":
      return formatImage(node, level);
    default:
      return ind(level) + "UNKNOWN: " + (node as ParsedNode).name;
  }
}

export function formatTree(
  root: ParsedNode,
  nodeName: string,
  nodeId: string,
  screenshotUrl?: string,
): string {
  const header =
    '=== FIGMA EXTRACT: "' +
    nodeName +
    '" (node ' +
    nodeId +
    ") ===\n";
  const screenshot = screenshotUrl
    ? "Screenshot: " + screenshotUrl + "\n"
    : "";
  return header + screenshot + "\n" + formatNode(root, 0) + "\n";
}
