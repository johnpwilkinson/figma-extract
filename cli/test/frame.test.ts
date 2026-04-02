import { describe, it, expect } from "bun:test";
import { extractFrame } from "../src/parser/frame";
import type { FigmaNode } from "../src/types/figma-api";

function frameNode(overrides: Partial<FigmaNode> = {}): FigmaNode {
  return {
    id: "0:1",
    name: "Container",
    type: "FRAME",
    layoutMode: "VERTICAL",
    layoutSizingHorizontal: "FILL",
    layoutSizingVertical: "HUG",
    primaryAxisAlignItems: "MIN",
    counterAxisAlignItems: "MIN",
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    itemSpacing: 8,
    absoluteBoundingBox: { x: 0, y: 0, width: 400, height: 300 },
    ...overrides,
  };
}

describe("extractFrame", () => {
  it("extracts basic frame with auto-layout", () => {
    const result = extractFrame(frameNode());
    expect(result.type).toBe("FRAME");
    expect(result.name).toBe("Container");
    expect(result.figmaId).toBe("0:1");
    expect(result.layout?.mode).toBe("vertical");
    expect(result.layout?.gap.tw).toBe("gap-2");
    expect(result.width).toBe("fill-parent");
    expect(result.height).toBe("hug-contents");
  });

  it("resolves padding to Tailwind", () => {
    const result = extractFrame(frameNode());
    expect(result.paddingTw).toBe("p-4");
  });

  it("resolves asymmetric padding", () => {
    const result = extractFrame(
      frameNode({
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 16,
        paddingRight: 16,
      }),
    );
    expect(result.paddingTw).toBe("py-2 px-4");
  });

  it("resolves horizontal layout", () => {
    const result = extractFrame(frameNode({ layoutMode: "HORIZONTAL" }));
    expect(result.layout?.mode).toBe("horizontal");
  });

  it("resolves fills", () => {
    const result = extractFrame(
      frameNode({
        fills: [
          {
            type: "SOLID",
            visible: true,
            color: { r: 1, g: 1, b: 1, a: 1 },
          },
        ],
      }),
    );
    expect(result.fill?.hex).toBe("#ffffff");
    expect(result.fill?.tw.tw).toBe("bg-white");
  });

  it("resolves corner radius", () => {
    const result = extractFrame(frameNode({ cornerRadius: 8 }));
    expect(result.cornerRadius?.tw).toBe("rounded-lg");
  });

  it("resolves opacity", () => {
    const result = extractFrame(frameNode({ opacity: 0.5 }));
    expect(result.opacity).toBe(0.5);
  });

  it("omits opacity when 1", () => {
    const result = extractFrame(frameNode({ opacity: 1 }));
    expect(result.opacity).toBeUndefined();
  });

  it("handles frame without auto-layout", () => {
    const result = extractFrame(
      frameNode({ layoutMode: "NONE" }),
    );
    expect(result.layout).toBeUndefined();
  });

  it("resolves effects", () => {
    const result = extractFrame(
      frameNode({
        effects: [
          { type: "DROP_SHADOW", visible: true, radius: 4 },
        ],
      }),
    );
    expect(result.effects).toContain("shadow-md");
  });

  it("resolves strokes", () => {
    const result = extractFrame(
      frameNode({
        strokes: [
          {
            type: "SOLID",
            visible: true,
            color: { r: 0.886, g: 0.91, b: 0.941, a: 1 },
          },
        ],
        strokeWeight: 1,
      }),
    );
    expect(result.stroke).toBeDefined();
    expect(result.strokeWeight).toBe(1);
  });

  it("resolves fixed sizing with bounding box", () => {
    const result = extractFrame(
      frameNode({
        layoutSizingHorizontal: "FIXED",
        absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 100 },
      }),
    );
    expect(result.width).toBe("200px");
  });

  it("resolves wrap", () => {
    const result = extractFrame(frameNode({ layoutWrap: "WRAP" }));
    expect(result.layout?.wrap).toBe(true);
  });

  it("maps alignment values", () => {
    const result = extractFrame(
      frameNode({
        primaryAxisAlignItems: "SPACE_BETWEEN",
        counterAxisAlignItems: "CENTER",
      }),
    );
    expect(result.layout?.primaryAlign).toBe("between");
    expect(result.layout?.counterAlign).toBe("center");
  });
});
