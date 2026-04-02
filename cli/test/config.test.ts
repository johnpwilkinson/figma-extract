import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { loadConfig } from "../src/config";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("loadConfig", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "figma-extract-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("returns empty config when no file exists", async () => {
    const config = await loadConfig(tmpDir);
    expect(config).toEqual({});
  });

  test("reads config from .figma-extract.json", async () => {
    writeFileSync(
      join(tmpDir, ".figma-extract.json"),
      JSON.stringify({
        tailwindConfig: "./tailwind.config.ts",
        componentMap: { Button: "shadcn/Button" },
        iconLibrary: "lucide-react",
        defaults: { font: "Inter" },
      }),
    );
    const config = await loadConfig(tmpDir);
    expect(config.tailwindConfig).toBe("./tailwind.config.ts");
    expect(config.componentMap).toEqual({ Button: "shadcn/Button" });
    expect(config.iconLibrary).toBe("lucide-react");
    expect(config.defaults?.font).toBe("Inter");
  });

  test("handles partial config", async () => {
    writeFileSync(
      join(tmpDir, ".figma-extract.json"),
      JSON.stringify({
        componentMap: { Card: "shadcn/Card" },
      }),
    );
    const config = await loadConfig(tmpDir);
    expect(config.componentMap).toEqual({ Card: "shadcn/Card" });
    expect(config.tailwindConfig).toBeUndefined();
    expect(config.iconLibrary).toBeUndefined();
    expect(config.defaults).toBeUndefined();
  });
});
