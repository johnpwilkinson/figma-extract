import { existsSync } from "fs";
import { resolve } from "path";

export interface FigmaExtractConfig {
  tailwindConfig?: string;
  componentMap?: Record<string, string>;
  iconLibrary?: string;
  defaults?: {
    font?: string;
  };
}

const CONFIG_FILENAME = ".figma-extract.json";

export async function loadConfig(
  cwd: string = process.cwd()
): Promise<FigmaExtractConfig> {
  const configPath = resolve(cwd, CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    return {};
  }

  const file = Bun.file(configPath);
  return (await file.json()) as FigmaExtractConfig;
}
