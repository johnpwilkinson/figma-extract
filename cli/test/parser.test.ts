import { describe, expect, test } from "bun:test";
import { walkTree, type WalkContext } from "../src/parser/index";
import { formatTree } from "../src/formatter";
import type { FigmaFileNodesResponse } from "../src/types/figma-api";
import type { FigmaExtractConfig } from "../src/config";
import type { ParsedFrame, ParsedText, ParsedInstance, ParsedIcon, ParsedShape } from "../src/types/parsed";

// Load the fixture
import heroFixture from "./fixtures/hero-section.json";

const fixture = heroFixture as unknown as FigmaFileNodesResponse;
const nodeData = fixture.nodes["1:2"];

const testConfig: FigmaExtractConfig = {
  defaults: { font: "Inter" },
  componentMap: {},
  iconLibrary: "lucide-react",
};

const ctx: WalkContext = {
  config: testConfig,
  components: nodeData.components,
};

describe("walkTree integration", () => {
  const result = walkTree(nodeData.document, ctx);

  test("produces exactly one root node", () => {
    expect(result).toHaveLength(1);
  });

  test("root node is a FRAME named Hero Section", () => {
    const root = result[0] as ParsedFrame;
    expect(root.type).toBe("FRAME");
    expect(root.name).toBe("Hero Section");
  });

  test("root frame has vertical auto-layout", () => {
    const root = result[0] as ParsedFrame;
    expect(root.layout?.mode).toBe("vertical");
  });

  test("root frame has correct padding", () => {
    const root = result[0] as ParsedFrame;
    expect(root.paddingTw).toBeDefined();
    expect(root.paddingTw).toContain("py-12");
    expect(root.paddingTw).toContain("px-8");
  });

  test("root frame has fill color (white)", () => {
    const root = result[0] as ParsedFrame;
    expect(root.fill).toBeDefined();
    expect(root.fill!.hex).toBe("#ffffff");
    expect(root.fill!.tw.tw).toBe("bg-white");
  });

  test("root frame has corner radius", () => {
    const root = result[0] as ParsedFrame;
    expect(root.cornerRadius).toBeDefined();
    expect(root.cornerRadius!.tw).toBe("rounded-xl");
  });

  test("root frame has shadow effect", () => {
    const root = result[0] as ParsedFrame;
    expect(root.effects).toBeDefined();
    expect(root.effects).toContain("shadow-md");
  });

  test("root frame has 3 children (Heading, Subtitle, CTA Row)", () => {
    const root = result[0] as ParsedFrame;
    expect(root.children).toHaveLength(3);
  });

  test("first child is the heading TEXT", () => {
    const root = result[0] as ParsedFrame;
    const heading = root.children![0] as ParsedText;
    expect(heading.type).toBe("TEXT");
    expect(heading.name).toBe("Heading");
    expect(heading.content).toBe("Build faster with Tailwind");
    expect(heading.weight.tw).toBe("font-bold");
    expect(heading.size.tw).toBe("text-4xl");
    expect(heading.align).toBe("center");
  });

  test("heading font is flagged as default", () => {
    const root = result[0] as ParsedFrame;
    const heading = root.children![0] as ParsedText;
    expect(heading.fontIsDefault).toBe(true);
  });

  test("subtitle is the second TEXT", () => {
    const root = result[0] as ParsedFrame;
    const subtitle = root.children![1] as ParsedText;
    expect(subtitle.type).toBe("TEXT");
    expect(subtitle.content).toBe("Extract your designs to code in seconds.");
    expect(subtitle.size.tw).toBe("text-lg");
    expect(subtitle.weight.tw).toBe("font-normal");
  });

  test("CTA Row is a horizontal FRAME", () => {
    const root = result[0] as ParsedFrame;
    const ctaRow = root.children![2] as ParsedFrame;
    expect(ctaRow.type).toBe("FRAME");
    expect(ctaRow.name).toBe("CTA Row");
    expect(ctaRow.layout?.mode).toBe("horizontal");
    expect(ctaRow.layout?.gap.tw).toBe("gap-4");
  });

  test("CTA Row has 3 visible children (hidden element skipped)", () => {
    const root = result[0] as ParsedFrame;
    const ctaRow = root.children![2] as ParsedFrame;
    expect(ctaRow.children).toHaveLength(3);
  });

  test("Button is an INSTANCE mapped to shadcn/Button", () => {
    const root = result[0] as ParsedFrame;
    const ctaRow = root.children![2] as ParsedFrame;
    const button = ctaRow.children![0] as ParsedInstance;
    expect(button.type).toBe("INSTANCE");
    expect(button.componentName).toBe("Button");
    expect(button.mappedComponent).toBe("shadcn/Button");
    expect(button.isRemote).toBe(false);
  });

  test("Button has variant properties", () => {
    const root = result[0] as ParsedFrame;
    const ctaRow = root.children![2] as ParsedFrame;
    const button = ctaRow.children![0] as ParsedInstance;
    expect(button.variantProperties).toEqual({
      Size: "Medium",
      Variant: "Primary",
    });
  });

  test("Button has text child", () => {
    const root = result[0] as ParsedFrame;
    const ctaRow = root.children![2] as ParsedFrame;
    const button = ctaRow.children![0] as ParsedInstance;
    expect(button.children).toHaveLength(1);
    expect((button.children![0] as ParsedText).content).toBe("Get started");
  });

  test("Arrow Right is an ICON (small square vector)", () => {
    const root = result[0] as ParsedFrame;
    const ctaRow = root.children![2] as ParsedFrame;
    const arrow = ctaRow.children![1] as ParsedIcon;
    expect(arrow.type).toBe("ICON");
    expect(arrow.source).toBe("lucide-react/ArrowRight");
    expect(arrow.size).toEqual({ width: 20, height: 20 });
  });

  test("Divider is a SHAPE (RECTANGLE)", () => {
    const root = result[0] as ParsedFrame;
    const ctaRow = root.children![2] as ParsedFrame;
    const divider = ctaRow.children![2] as ParsedShape;
    expect(divider.type).toBe("SHAPE");
    expect(divider.shapeType).toBe("RECTANGLE");
    expect(divider.width).toBe(1);
    expect(divider.height).toBe(44);
  });
});

describe("formatTree integration", () => {
  const result = walkTree(nodeData.document, ctx);
  const output = formatTree(result[0], "Hero Section", "1:2");

  test("output contains the header", () => {
    expect(output).toContain('=== FIGMA EXTRACT: "Hero Section"');
  });

  test("output contains frame info", () => {
    expect(output).toContain("FRAME: Hero Section");
    expect(output).toContain("auto-layout vertical");
  });

  test("output contains text content", () => {
    expect(output).toContain('"Build faster with Tailwind"');
    expect(output).toContain('"Extract your designs to code in seconds."');
  });

  test("output contains Tailwind mappings", () => {
    expect(output).toContain("text-4xl");
    expect(output).toContain("font-bold");
    expect(output).toContain("bg-white");
    expect(output).toContain("shadow-md");
  });

  test("output contains component mapping", () => {
    expect(output).toContain("shadcn/Button");
  });

  test("output contains icon info", () => {
    expect(output).toContain("lucide-react/ArrowRight");
  });

  test("output does NOT contain hidden element", () => {
    expect(output).not.toContain("Hidden Element");
  });
});
