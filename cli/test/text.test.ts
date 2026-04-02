import { describe, it, expect } from "bun:test";
import { extractText, type TextExtractorConfig } from "../src/parser/text";
import type { FigmaNode } from "../src/types/figma-api";

const config: TextExtractorConfig = { defaultFont: "Inter" };

function textNode(overrides: Partial<FigmaNode> = {}): FigmaNode {
  return {
    id: "1:1",
    name: "Label",
    type: "TEXT",
    characters: "Hello World",
    style: {
      fontFamily: "Inter",
      fontPostScriptName: "Inter-Regular",
      fontWeight: 400,
      fontSize: 16,
      textAlignHorizontal: "LEFT",
      textAlignVertical: "TOP",
      letterSpacing: 0,
      lineHeightPx: 24,
      lineHeightUnit: "PIXELS",
      textDecoration: "NONE",
      textCase: "ORIGINAL",
      fills: [
        { type: "SOLID", visible: true, color: { r: 0, g: 0, b: 0, a: 1 } },
      ],
    },
    ...overrides,
  };
}

describe("extractText", () => {
  it("extracts basic text node", () => {
    const result = extractText(textNode(), config);
    expect(result.type).toBe("TEXT");
    expect(result.name).toBe("Label");
    expect(result.figmaId).toBe("1:1");
    expect(result.content).toBe("Hello World");
    expect(result.font).toBe("Inter");
    expect(result.fontIsDefault).toBe(true);
    expect(result.align).toBe("left");
  });

  it("resolves font weight", () => {
    const result = extractText(
      textNode({ style: { ...textNode().style!, fontWeight: 700 } }),
      config,
    );
    expect(result.weight.tw).toBe("font-bold");
    expect(result.weight.exact).toBe(true);
  });

  it("resolves font size", () => {
    const result = extractText(
      textNode({ style: { ...textNode().style!, fontSize: 24 } }),
      config,
    );
    expect(result.size.tw).toBe("text-2xl");
    expect(result.size.exact).toBe(true);
  });

  it("resolves line height", () => {
    // 24px line height / 16px font = 1.5 → leading-normal
    const result = extractText(textNode(), config);
    expect(result.lineHeight.tw).toBe("leading-normal");
    expect(result.lineHeight.exact).toBe(true);
  });

  it("resolves letter spacing", () => {
    const result = extractText(textNode(), config);
    // 0px letter spacing → tracking-normal
    expect(result.letterSpacing.tw).toBe("tracking-normal");
    expect(result.letterSpacing.exact).toBe(true);
  });

  it("resolves text color from fills", () => {
    const result = extractText(textNode(), config);
    expect(result.color.hex).toBe("#000000");
    expect(result.color.tw.tw).toBe("text-black");
  });

  it("resolves colored text", () => {
    const result = extractText(
      textNode({
        style: {
          ...textNode().style!,
          fills: [
            {
              type: "SOLID",
              visible: true,
              color: { r: 0.231, g: 0.51, b: 0.965, a: 1 },
            },
          ],
        },
      }),
      config,
    );
    expect(result.color.hex).toBe("#3b82f6");
    expect(result.color.tw.tw).toBe("text-blue-500");
  });

  it("sets fontIsDefault false for non-default font", () => {
    const result = extractText(
      textNode({
        style: { ...textNode().style!, fontFamily: "Roboto" },
      }),
      { defaultFont: "Inter" },
    );
    expect(result.font).toBe("Roboto");
    expect(result.fontIsDefault).toBe(false);
  });

  it("extracts text decoration", () => {
    const result = extractText(
      textNode({
        style: { ...textNode().style!, textDecoration: "UNDERLINE" },
      }),
      config,
    );
    expect(result.decoration).toBe("underline");
  });

  it("omits decoration when NONE", () => {
    const result = extractText(textNode(), config);
    expect(result.decoration).toBeUndefined();
  });

  it("extracts text case", () => {
    const result = extractText(
      textNode({
        style: { ...textNode().style!, textCase: "UPPER" },
      }),
      config,
    );
    expect(result.textCase).toBe("upper");
  });

  it("omits textCase when ORIGINAL", () => {
    const result = extractText(textNode(), config);
    expect(result.textCase).toBeUndefined();
  });

  it("falls back to defaults for missing style", () => {
    const node: FigmaNode = {
      id: "2:1",
      name: "Bare Text",
      type: "TEXT",
      characters: "No style",
    };
    const result = extractText(node, config);
    expect(result.content).toBe("No style");
    expect(result.font).toBe("Inter");
    expect(result.weight.tw).toBe("font-normal");
    expect(result.size.tw).toBe("text-base");
    expect(result.color.hex).toBe("#000000");
  });

  it("handles center alignment", () => {
    const result = extractText(
      textNode({
        style: { ...textNode().style!, textAlignHorizontal: "CENTER" },
      }),
      config,
    );
    expect(result.align).toBe("center");
  });

  it("skips invisible fills and uses visible one", () => {
    const result = extractText(
      textNode({
        style: {
          ...textNode().style!,
          fills: [
            {
              type: "SOLID",
              visible: false,
              color: { r: 1, g: 0, b: 0, a: 1 },
            },
            {
              type: "SOLID",
              visible: true,
              color: { r: 1, g: 1, b: 1, a: 1 },
            },
          ],
        },
      }),
      config,
    );
    expect(result.color.hex).toBe("#ffffff");
    expect(result.color.tw.tw).toBe("text-white");
  });
});
