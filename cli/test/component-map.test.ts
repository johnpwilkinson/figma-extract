import { describe, expect, test } from "bun:test";
import {
  resolveComponent,
  parseVariantName,
} from "../src/resolvers/component-map";

describe("resolveComponent", () => {
  test("auto-detects Button as shadcn/Button", () => {
    const result = resolveComponent("Button", { remote: true });
    expect(result.mapped).toBe("shadcn/Button");
  });

  test("auto-detects Card as shadcn/Card", () => {
    const result = resolveComponent("Card", { remote: true });
    expect(result.mapped).toBe("shadcn/Card");
  });

  test("config override takes precedence", () => {
    const result = resolveComponent("Custom CTA", {
      remote: true,
      configMap: { "Custom CTA": "shadcn/Button" },
    });
    expect(result.mapped).toBe("shadcn/Button");
  });

  test("unknown component returns original name", () => {
    const result = resolveComponent("MyCustomThing", {
      remote: true,
    });
    expect(result.mapped).toBeUndefined();
    expect(result.original).toBe("MyCustomThing");
  });

  test("local component still auto-detects", () => {
    const result = resolveComponent("Badge", { remote: false });
    expect(result.mapped).toBe("shadcn/Badge");
  });
});

describe("parseVariantName", () => {
  test("parses Figma variant name format", () => {
    const result = parseVariantName("Size=Medium, State=Default");
    expect(result).toEqual({ Size: "Medium", State: "Default" });
  });

  test("handles single variant", () => {
    const result = parseVariantName("Variant=Outline");
    expect(result).toEqual({ Variant: "Outline" });
  });

  test("returns empty for non-variant name", () => {
    const result = parseVariantName("Regular Button");
    expect(result).toEqual({});
  });
});
