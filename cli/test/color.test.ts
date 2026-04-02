import { describe, expect, test } from "bun:test";
import {
  figmaColorToHex,
  figmaColorToHexAlpha,
  parseHex,
  hexToTailwind,
  resolveColor,
  resolveFirstSolidFill,
} from "../src/resolvers/color";

describe("figmaColorToHex", () => {
  test("converts black", () => {
    expect(figmaColorToHex({ r: 0, g: 0, b: 0, a: 1 })).toBe("#000000");
  });

  test("converts white", () => {
    expect(figmaColorToHex({ r: 1, g: 1, b: 1, a: 1 })).toBe("#ffffff");
  });

  test("converts a mid color", () => {
    // slate-900: #0f172a → r≈0.059, g≈0.090, b≈0.165
    expect(figmaColorToHex({ r: 15 / 255, g: 23 / 255, b: 42 / 255, a: 1 })).toBe("#0f172a");
  });

  test("ignores alpha channel", () => {
    expect(figmaColorToHex({ r: 1, g: 0, b: 0, a: 0.5 })).toBe("#ff0000");
  });

  test("clamps values above 1", () => {
    expect(figmaColorToHex({ r: 1.5, g: 0, b: 0, a: 1 })).toBe("#ff0000");
  });

  test("clamps values below 0", () => {
    expect(figmaColorToHex({ r: -0.1, g: 0, b: 0, a: 1 })).toBe("#000000");
  });
});

describe("figmaColorToHexAlpha", () => {
  test("includes alpha", () => {
    expect(figmaColorToHexAlpha({ r: 1, g: 1, b: 1, a: 0.5 })).toBe("#ffffff80");
  });

  test("full alpha", () => {
    expect(figmaColorToHexAlpha({ r: 0, g: 0, b: 0, a: 1 })).toBe("#000000ff");
  });
});

describe("parseHex", () => {
  test("parses 6-digit hex", () => {
    expect(parseHex("#ff0000")).toEqual([255, 0, 0]);
  });

  test("parses 3-digit shorthand", () => {
    expect(parseHex("#f00")).toEqual([255, 0, 0]);
  });

  test("parses 8-digit hex (ignores alpha)", () => {
    expect(parseHex("#ff000080")).toEqual([255, 0, 0]);
  });

  test("returns null for invalid input", () => {
    expect(parseHex("not-a-color")).toBeNull();
    expect(parseHex("#gg0000")).toBeNull();
    expect(parseHex("")).toBeNull();
  });
});

describe("hexToTailwind", () => {
  test("exact match for black", () => {
    const result = hexToTailwind("#000000", "bg");
    expect(result).toEqual({ raw: "#000000", tw: "bg-black", exact: true });
  });

  test("exact match for white", () => {
    const result = hexToTailwind("#ffffff", "text");
    expect(result).toEqual({ raw: "#ffffff", tw: "text-white", exact: true });
  });

  test("exact match for a palette color", () => {
    const result = hexToTailwind("#3b82f6", "bg");
    expect(result).toEqual({ raw: "#3b82f6", tw: "bg-blue-500", exact: true });
  });

  test("case insensitive", () => {
    const result = hexToTailwind("#3B82F6", "bg");
    expect(result).toEqual({ raw: "#3b82f6", tw: "bg-blue-500", exact: true });
  });

  test("near-match returns approximate", () => {
    // Very close to blue-500 (#3b82f6) but not exact
    const result = hexToTailwind("#3b83f5", "bg");
    expect(result.exact).toBe(false);
    expect(result.tw).toBe("bg-blue-500"); // nearest match
  });

  test("arbitrary value for distant color", () => {
    const result = hexToTailwind("#123456", "bg");
    expect(result.exact).toBe(false);
    expect(result.tw).toContain("[#123456]");
  });

  test("uses specified prefix", () => {
    const result = hexToTailwind("#000000", "border");
    expect(result.tw).toBe("border-black");
  });
});

describe("resolveColor", () => {
  test("resolves a Figma color to ParsedColor", () => {
    const result = resolveColor({ r: 0, g: 0, b: 0, a: 1 }, "text");
    expect(result.hex).toBe("#000000");
    expect(result.tw.tw).toBe("text-black");
    expect(result.tw.exact).toBe(true);
  });

  test("defaults to bg prefix", () => {
    const result = resolveColor({ r: 1, g: 1, b: 1, a: 1 });
    expect(result.tw.tw).toBe("bg-white");
  });
});

describe("resolveFirstSolidFill", () => {
  test("returns first visible solid fill", () => {
    const fills = [
      { type: "GRADIENT_LINEAR", visible: true },
      { type: "SOLID", visible: true, color: { r: 0, g: 0, b: 0, a: 1 } },
    ];
    const result = resolveFirstSolidFill(fills, "bg");
    expect(result).toBeDefined();
    expect(result!.hex).toBe("#000000");
  });

  test("skips invisible fills", () => {
    const fills = [
      { type: "SOLID", visible: false, color: { r: 1, g: 0, b: 0, a: 1 } },
      { type: "SOLID", visible: true, color: { r: 0, g: 0, b: 0, a: 1 } },
    ];
    const result = resolveFirstSolidFill(fills, "bg");
    expect(result!.hex).toBe("#000000");
  });

  test("returns undefined when no solid fill", () => {
    const fills = [{ type: "GRADIENT_LINEAR", visible: true }];
    expect(resolveFirstSolidFill(fills, "bg")).toBeUndefined();
  });

  test("returns undefined for empty fills", () => {
    expect(resolveFirstSolidFill([], "bg")).toBeUndefined();
  });

  test("treats missing visible as visible", () => {
    const fills = [
      { type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } },
    ];
    const result = resolveFirstSolidFill(fills, "text");
    expect(result).toBeDefined();
    expect(result!.hex).toBe("#ffffff");
  });
});
