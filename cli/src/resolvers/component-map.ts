// Known ShadCN component names for auto-detection
const SHADCN_COMPONENTS = new Set([
  "Accordion", "Alert", "AlertDialog", "AspectRatio", "Avatar",
  "Badge", "Breadcrumb", "Button",
  "Calendar", "Card", "Carousel", "Chart", "Checkbox", "Collapsible",
  "Command", "ContextMenu",
  "DataTable", "DatePicker", "Dialog", "Drawer", "DropdownMenu",
  "Form",
  "HoverCard",
  "Input", "InputOTP",
  "Label",
  "Menubar",
  "NavigationMenu",
  "Pagination", "Popover", "Progress",
  "RadioGroup", "Resizable",
  "ScrollArea", "Select", "Separator", "Sheet", "Sidebar", "Skeleton",
  "Slider", "Sonner", "Switch",
  "Table", "Tabs", "Textarea", "Toast", "Toggle", "ToggleGroup",
  "Tooltip",
]);

export interface ComponentResolution {
  original: string;
  mapped?: string;
  isRemote: boolean;
}

interface ResolveOptions {
  remote: boolean;
  configMap?: Record<string, string>;
}

export function resolveComponent(
  componentName: string,
  options: ResolveOptions
): ComponentResolution {
  const { remote, configMap } = options;

  // Config override takes precedence
  if (configMap?.[componentName]) {
    return {
      original: componentName,
      mapped: configMap[componentName],
      isRemote: remote,
    };
  }

  // Auto-detect: check if the component name matches a known ShadCN component
  const baseName = componentName.split("/").pop() || componentName;
  const cleanName = baseName.split(",")[0].trim();

  if (SHADCN_COMPONENTS.has(cleanName)) {
    return {
      original: componentName,
      mapped: "shadcn/" + cleanName,
      isRemote: remote,
    };
  }

  // No match
  return { original: componentName, isRemote: remote };
}

// Parse Figma's variant component name format: "Size=Medium, State=Default"
export function parseVariantName(
  name: string
): Record<string, string> {
  if (!name.includes("=")) return {};

  const result: Record<string, string> = {};
  const pairs = name.split(",").map((s) => s.trim());

  for (const pair of pairs) {
    const [key, value] = pair.split("=").map((s) => s.trim());
    if (key && value) {
      result[key] = value;
    }
  }

  return result;
}

// Parse instance componentProperties (which have #id suffixes on keys)
export function parseComponentProperties(
  props: Record<string, { type: string; value: string | boolean }>
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [rawKey, prop] of Object.entries(props)) {
    if (prop.type !== "VARIANT") continue;
    // Strip the #uniqueId suffix: "Size#1:0" becomes "Size"
    const cleanKey = rawKey.replace(/#[\d:]+$/, "");
    result[cleanKey] = String(prop.value);
  }

  return result;
}

// Detect if a vector node is likely an icon based on size and name
export function isLikelyIcon(
  name: string,
  width: number,
  height: number
): boolean {
  // Small square-ish vectors are likely icons
  if (width <= 48 && height <= 48 && Math.abs(width - height) <= 4) {
    return true;
  }
  // Name-based heuristics
  const lowerName = name.toLowerCase();
  return (
    lowerName.includes("icon") ||
    lowerName.includes("arrow") ||
    lowerName.includes("chevron") ||
    lowerName.includes("check") ||
    lowerName.includes("close") ||
    lowerName.includes("menu") ||
    lowerName.includes("search") ||
    lowerName.includes("plus") ||
    lowerName.includes("minus")
  );
}
