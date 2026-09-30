import { describe, expect, test } from "bun:test";
import { formatNode, formatTree } from "../src/formatter";
import type {
  ParsedText,
  ParsedInstance,
  ParsedFrame,
  ParsedIcon,
  ParsedShape,
} from "../src/types/parsed";

describe("formatNode", () => {
  test("formats a TEXT node", () => {
    const node: ParsedText = {
      type: "TEXT",
      name: "heading",
      figmaId: "1:2",
      content: "Hello World",
      font: "Inter",
      weight: { raw: "600", tw: "font-semibold", exact: true },
      size: { raw: "36px", tw: "text-4xl", exact: true },
      lineHeight: {
        raw: "44px",
        tw: "leading-[44px]",
        exact: false,
      },
      letterSpacing: {
        raw: "0",
        tw: "tracking-normal",
        exact: true,
      },
      color: {
        hex: "#ffffff",
        tw: { raw: "#ffffff", tw: "white", exact: true },
      },
      align: "left",
    };

    const output = formatNode(node, 0);
    expect(output).toContain("TEXT: heading");
    expect(output).toContain('Content: "Hello World"');
    expect(output).toContain("Weight: 600 → font-semibold");
    expect(output).toContain("Size: 36px → text-4xl");
    expect(output).toContain("Color: #ffffff → white");
  });

  test("formats an INSTANCE node with shadcn mapping", () => {
    const node: ParsedInstance = {
      type: "INSTANCE",
      name: "primary-button",
      figmaId: "1:3",
      componentName: "Button",
      mappedComponent: "shadcn/Button",
      isRemote: true,
      variantProperties: { Variant: "default", Size: "lg" },
    };

    const output = formatNode(node, 0);
    expect(output).toContain(
      "INSTANCE: primary-button → shadcn/Button"
    );
    expect(output).toContain("Variant: default");
    expect(output).toContain("Size: lg");
  });

  test("suppresses default font on TEXT", () => {
    const node: ParsedText = {
      type: "TEXT",
      name: "label",
      figmaId: "2:1",
      content: "Label",
      font: "Inter",
      fontIsDefault: true,
      weight: { raw: "400", tw: "font-normal", exact: true },
      size: { raw: "14px", tw: "text-sm", exact: true },
      lineHeight: { raw: "20px", tw: "leading-5", exact: true },
      letterSpacing: { raw: "0", tw: "tracking-normal", exact: true },
      color: {
        hex: "#000000",
        tw: { raw: "#000000", tw: "black", exact: true },
      },
      align: "left",
    };

    const output = formatNode(node, 0);
    expect(output).not.toContain("Font:");
  });

  test("shows non-default font on TEXT", () => {
    const node: ParsedText = {
      type: "TEXT",
      name: "label",
      figmaId: "2:2",
      content: "Label",
      font: "Roboto",
      weight: { raw: "400", tw: "font-normal", exact: true },
      size: { raw: "14px", tw: "text-sm", exact: true },
      lineHeight: { raw: "20px", tw: "leading-5", exact: true },
      letterSpacing: { raw: "0", tw: "tracking-normal", exact: true },
      color: {
        hex: "#000000",
        tw: { raw: "#000000", tw: "black", exact: true },
      },
      align: "left",
    };

    const output = formatNode(node, 0);
    expect(output).toContain("Font: Roboto");
  });

  test("formats a FRAME with layout", () => {
    const node: ParsedFrame = {
      type: "FRAME",
      name: "container",
      figmaId: "3:1",
      width: "fill-parent",
      height: "hug-contents",
      layout: {
        mode: "vertical",
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
        gap: { raw: "12px", tw: "gap-3", exact: true },
        primaryAlign: "start",
        counterAlign: "center",
      },
      paddingTw: "p-4",
      fill: {
        hex: "#ffffff",
        tw: { raw: "#ffffff", tw: "bg-white", exact: true },
      },
    };

    const output = formatNode(node, 0);
    expect(output).toContain("FRAME: container");
    expect(output).toContain("Layout: auto-layout vertical");
    expect(output).toContain("Padding: 16 16 16 16 → p-4");
    expect(output).toContain("Gap: 12px → gap-3");
    expect(output).toContain("Width: fill-parent");
    expect(output).toContain("Height: hug-contents");
    expect(output).toContain("Fill: #ffffff → bg-white");
    expect(output).toContain("Align: center (cross-axis)");
    // primaryAlign is "start" so should not appear
    expect(output).not.toContain("(main-axis)");
  });

  test("formats an ICON node", () => {
    const node: ParsedIcon = {
      type: "ICON",
      name: "TrendingUp",
      figmaId: "4:1",
      source: "lucide-react/TrendingUp",
      size: { width: 24, height: 24 },
      color: {
        hex: "#22c55e",
        tw: { raw: "#22c55e", tw: "text-green-500", exact: true },
      },
    };

    const output = formatNode(node, 0);
    expect(output).toContain("ICON: TrendingUp");
    expect(output).toContain("Source: lucide-react/TrendingUp");
    expect(output).toContain("Size: 24x24");
    expect(output).toContain("Color: #22c55e → text-green-500");
  });

  test("formats a SHAPE node", () => {
    const node: ParsedShape = {
      type: "SHAPE",
      name: "Divider",
      figmaId: "5:1",
      shapeType: "LINE",
      width: 320,
      height: 1,
      stroke: {
        hex: "#e2e8f0",
        tw: { raw: "#e2e8f0", tw: "border-slate-200", exact: true },
      },
    };

    const output = formatNode(node, 0);
    expect(output).toContain("SHAPE: Divider (LINE)");
    expect(output).toContain("Size: 320x1");
    expect(output).toContain("Stroke: #e2e8f0 → border-slate-200");
  });

  test("formats an INSTANCE without mapping", () => {
    const node: ParsedInstance = {
      type: "INSTANCE",
      name: "custom-btn",
      figmaId: "6:1",
      componentName: "CustomButton",
      isRemote: false,
    };

    const output = formatNode(node, 0);
    expect(output).toContain("INSTANCE: custom-btn (CustomButton)");
    expect(output).not.toContain("external library");
  });
});

describe("formatTree", () => {
  test("adds header with node name and ID", () => {
    const node: ParsedText = {
      type: "TEXT",
      name: "title",
      figmaId: "1:1",
      content: "Test",
      font: "Inter",
      weight: { raw: "400", tw: "font-normal", exact: true },
      size: { raw: "16px", tw: "text-base", exact: true },
      lineHeight: { raw: "24px", tw: "leading-6", exact: true },
      letterSpacing: { raw: "0", tw: "tracking-normal", exact: true },
      color: {
        hex: "#000000",
        tw: { raw: "#000000", tw: "black", exact: true },
      },
      align: "left",
    };

    const output = formatTree(node, "My Component", "123:456");
    expect(output).toContain('=== FIGMA EXTRACT: "My Component" (node 123:456) ===');
    expect(output).toContain("TEXT: title");
  });
});

describe("formatNode annotations", () => {
  test("prints annotations directly under the node header", () => {
    const node: ParsedFrame = {
      type: "FRAME",
      name: "Bar",
      figmaId: "1:2",
      width: "fill-parent",
      height: "8px",
      annotations: [
        { label: "Adjust size of bar", properties: [] },
        { properties: ["fontSize", "fills"] },
      ],
    };

    const lines = formatNode(node, 1).split("\n");

    expect(lines.slice(0, 3)).toEqual([
      "  FRAME: Bar",
      '    Annotation: "Adjust size of bar"',
      "    Annotation: (highlights: fontSize, fills)",
    ]);
  });
});
