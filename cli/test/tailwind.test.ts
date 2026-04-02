import { describe, expect, test } from "bun:test";
import {
  resolveSpacing,
  resolveFontSize,
  resolveFontWeight,
  resolveLineHeight,
  resolveLetterSpacing,
  resolveBorderRadius,
  resolveOpacity,
  resolveEffects,
  resolvePadding,
} from "../src/resolvers/tailwind";
import type { FigmaEffect } from "../src/types/figma-api";

describe("resolveSpacing", () => {
  test("exact match for 0", () => {
    expect(resolveSpacing(0, "p")).toEqual({ raw: "0px", tw: "p-0", exact: true });
  });

  test("exact match for 16px → p-4", () => {
    expect(resolveSpacing(16, "gap")).toEqual({ raw: "16px", tw: "gap-4", exact: true });
  });

  test("exact match for 1px → m-px", () => {
    expect(resolveSpacing(1, "m")).toEqual({ raw: "1px", tw: "m-px", exact: true });
  });

  test("exact match for 8px → gap-2", () => {
    expect(resolveSpacing(8, "gap")).toEqual({ raw: "8px", tw: "gap-2", exact: true });
  });

  test("approximate match for near-scale value", () => {
    const result = resolveSpacing(13, "p");
    expect(result.exact).toBe(false);
    expect(result.tw).toBe("p-3"); // 13px ≈ 12px → "3"
  });

  test("arbitrary value for far-off spacing", () => {
    const result = resolveSpacing(500, "p");
    expect(result.exact).toBe(false);
    expect(result.tw).toBe("p-[500px]");
  });
});

describe("resolveFontSize", () => {
  test("12px → text-xs", () => {
    expect(resolveFontSize(12)).toEqual({ raw: "12px", tw: "text-xs", exact: true });
  });

  test("16px → text-base", () => {
    expect(resolveFontSize(16)).toEqual({ raw: "16px", tw: "text-base", exact: true });
  });

  test("24px → text-2xl", () => {
    expect(resolveFontSize(24)).toEqual({ raw: "24px", tw: "text-2xl", exact: true });
  });

  test("arbitrary for non-standard size", () => {
    const result = resolveFontSize(15);
    expect(result.exact).toBe(false);
  });
});

describe("resolveFontWeight", () => {
  test("400 → font-normal", () => {
    expect(resolveFontWeight(400)).toEqual({ raw: "400", tw: "font-normal", exact: true });
  });

  test("700 → font-bold", () => {
    expect(resolveFontWeight(700)).toEqual({ raw: "700", tw: "font-bold", exact: true });
  });

  test("600 → font-semibold", () => {
    expect(resolveFontWeight(600)).toEqual({ raw: "600", tw: "font-semibold", exact: true });
  });

  test("nearest match for 450", () => {
    const result = resolveFontWeight(450);
    expect(result.exact).toBe(false);
    expect(result.tw).toBe("font-normal");
  });
});

describe("resolveLineHeight", () => {
  test("20px / 16px = 1.25 → leading-tight", () => {
    expect(resolveLineHeight(20, 16)).toEqual({ raw: "20px", tw: "leading-tight", exact: true });
  });

  test("24px / 16px = 1.5 → leading-normal", () => {
    expect(resolveLineHeight(24, 16)).toEqual({ raw: "24px", tw: "leading-normal", exact: true });
  });

  test("arbitrary for unusual ratio", () => {
    const result = resolveLineHeight(28, 16); // ratio = 1.75
    expect(result.exact).toBe(false);
    expect(result.tw).toContain("[28px]");
  });

  test("handles zero fontSize gracefully", () => {
    const result = resolveLineHeight(20, 0);
    expect(result.tw).toContain("[20px]");
  });
});

describe("resolveLetterSpacing", () => {
  test("0px → tracking-normal", () => {
    expect(resolveLetterSpacing(0, 16)).toEqual({ raw: "0px", tw: "tracking-normal", exact: true });
  });

  test("arbitrary for large values", () => {
    const result = resolveLetterSpacing(5, 16);
    expect(result.exact).toBe(false);
  });

  test("handles zero fontSize", () => {
    const result = resolveLetterSpacing(1, 0);
    expect(result.tw).toContain("[1px]");
  });
});

describe("resolveBorderRadius", () => {
  test("0 → rounded-none", () => {
    expect(resolveBorderRadius(0)).toEqual({ raw: "0px", tw: "rounded-none", exact: true });
  });

  test("4px → rounded", () => {
    const result = resolveBorderRadius(4);
    expect(result.tw).toBe("rounded");
    expect(result.exact).toBe(true);
  });

  test("8px → rounded-lg", () => {
    expect(resolveBorderRadius(8)).toEqual({ raw: "8px", tw: "rounded-lg", exact: true });
  });

  test("9999px → rounded-full", () => {
    const result = resolveBorderRadius(9999);
    expect(result.tw).toBe("rounded-full");
    expect(result.exact).toBe(true);
  });

  test("large value → rounded-full", () => {
    const result = resolveBorderRadius(10000);
    expect(result.tw).toBe("rounded-full");
  });

  test("arbitrary value", () => {
    const result = resolveBorderRadius(10);
    expect(result.exact).toBe(false);
  });
});

describe("resolveOpacity", () => {
  test("1.0 → opacity-100", () => {
    expect(resolveOpacity(1)).toEqual({ raw: "1", tw: "opacity-100", exact: true });
  });

  test("0.5 → opacity-50", () => {
    expect(resolveOpacity(0.5)).toEqual({ raw: "0.5", tw: "opacity-50", exact: true });
  });

  test("0 → opacity-0", () => {
    expect(resolveOpacity(0)).toEqual({ raw: "0", tw: "opacity-0", exact: true });
  });

  test("arbitrary for 0.33", () => {
    const result = resolveOpacity(0.33);
    expect(result.exact).toBe(false);
    expect(result.tw).toBe("opacity-[33%]");
  });
});

describe("resolveEffects", () => {
  test("drop shadow small → shadow-sm", () => {
    const effects: FigmaEffect[] = [
      { type: "DROP_SHADOW", visible: true, radius: 0, color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 1 } },
    ];
    expect(resolveEffects(effects)).toEqual(["shadow-sm"]);
  });

  test("drop shadow medium → shadow-md", () => {
    const effects: FigmaEffect[] = [
      { type: "DROP_SHADOW", visible: true, radius: 6, color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 } },
    ];
    expect(resolveEffects(effects)).toEqual(["shadow-md"]);
  });

  test("inner shadow → shadow-inner", () => {
    const effects: FigmaEffect[] = [
      { type: "INNER_SHADOW", visible: true, radius: 4, color: { r: 0, g: 0, b: 0, a: 0.06 }, offset: { x: 0, y: 2 } },
    ];
    expect(resolveEffects(effects)).toEqual(["shadow-inner"]);
  });

  test("layer blur → blur-*", () => {
    const effects: FigmaEffect[] = [
      { type: "LAYER_BLUR", visible: true, radius: 8 },
    ];
    expect(resolveEffects(effects)).toEqual(["blur"]);
  });

  test("background blur → backdrop-blur", () => {
    const effects: FigmaEffect[] = [
      { type: "BACKGROUND_BLUR", visible: true, radius: 10 },
    ];
    expect(resolveEffects(effects)).toEqual(["backdrop-blur"]);
  });

  test("skips invisible effects", () => {
    const effects: FigmaEffect[] = [
      { type: "DROP_SHADOW", visible: false, radius: 10 },
    ];
    expect(resolveEffects(effects)).toEqual([]);
  });

  test("multiple effects", () => {
    const effects: FigmaEffect[] = [
      { type: "DROP_SHADOW", visible: true, radius: 3, color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 1 } },
      { type: "LAYER_BLUR", visible: true, radius: 4 },
    ];
    expect(resolveEffects(effects)).toEqual(["shadow", "blur-sm"]);
  });
});

describe("resolvePadding", () => {
  test("all same → p-4", () => {
    expect(resolvePadding(16, 16, 16, 16)).toBe("p-4");
  });

  test("all zero → empty string", () => {
    expect(resolvePadding(0, 0, 0, 0)).toBe("");
  });

  test("vertical + horizontal → py-* px-*", () => {
    expect(resolvePadding(8, 16, 8, 16)).toBe("py-2 px-4");
  });

  test("all different → individual sides", () => {
    const result = resolvePadding(8, 16, 24, 32);
    expect(result).toContain("pt-2");
    expect(result).toContain("pb-6");
    expect(result).toContain("pl-8");
    expect(result).toContain("pr-4");
  });

  test("only vertical padding", () => {
    expect(resolvePadding(16, 0, 16, 0)).toBe("py-4");
  });

  test("only horizontal padding", () => {
    expect(resolvePadding(0, 16, 0, 16)).toBe("px-4");
  });
});
