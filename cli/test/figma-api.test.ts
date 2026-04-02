import { describe, expect, test } from "bun:test";
import { parseFigmaUrl, parseCliArgs } from "../src/figma-api";

describe("parseFigmaUrl", () => {
  test("parses full design URL with node-id", () => {
    const result = parseFigmaUrl(
      "https://figma.com/design/abc123def/MyFile?node-id=4:1337"
    );
    expect(result).toEqual({ fileKey: "abc123def", nodeId: "4:1337" });
  });

  test("parses URL with encoded node-id (hyphen format)", () => {
    const result = parseFigmaUrl(
      "https://figma.com/design/abc123def/MyFile?node-id=4-1337"
    );
    expect(result).toEqual({ fileKey: "abc123def", nodeId: "4:1337" });
  });

  test("parses URL with www prefix", () => {
    const result = parseFigmaUrl(
      "https://www.figma.com/design/abc123def/MyFile?node-id=4:1337"
    );
    expect(result).toEqual({ fileKey: "abc123def", nodeId: "4:1337" });
  });

  test("parses old /file/ format URL", () => {
    const result = parseFigmaUrl(
      "https://figma.com/file/abc123def/MyFile?node-id=4:1337"
    );
    expect(result).toEqual({ fileKey: "abc123def", nodeId: "4:1337" });
  });

  test("throws on URL without node-id", () => {
    expect(() =>
      parseFigmaUrl("https://figma.com/design/abc123def/MyFile")
    ).toThrow("node-id");
  });

  test("parses URL with multi-segment node-id", () => {
    const result = parseFigmaUrl(
      "https://figma.com/design/abc123def/MyFile?node-id=123-456-789"
    );
    expect(result).toEqual({ fileKey: "abc123def", nodeId: "123:456:789" });
  });

  test("throws on non-Figma URL", () => {
    expect(() =>
      parseFigmaUrl("https://google.com/design/abc")
    ).toThrow();
  });
});

describe("parseCliArgs", () => {
  test("parses URL as first positional arg", () => {
    const result = parseCliArgs([
      "https://figma.com/design/abc/File?node-id=4:1337",
    ]);
    expect(result).toEqual({ fileKey: "abc", nodeId: "4:1337" });
  });

  test("parses --file and --node flags", () => {
    const result = parseCliArgs([
      "--file", "abc123", "--node", "4:1337",
    ]);
    expect(result).toEqual({ fileKey: "abc123", nodeId: "4:1337" });
  });

  test("throws on missing --file", () => {
    expect(() => parseCliArgs(["--node", "4:1337"])).toThrow(
      "--file"
    );
  });

  test("throws on missing --node", () => {
    expect(() => parseCliArgs(["--file", "abc"])).toThrow(
      "--node"
    );
  });
});
