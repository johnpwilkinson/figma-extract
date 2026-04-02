// Figma REST API response types
// Endpoint: GET /v1/files/{key}/nodes?ids={nodeId}&geometry=paths&plugin_data=shared

export interface FigmaColor {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a: number; // 0-1
}

export interface FigmaPaint {
  type:
    | "SOLID"
    | "GRADIENT_LINEAR"
    | "GRADIENT_RADIAL"
    | "GRADIENT_ANGULAR"
    | "GRADIENT_DIAMOND"
    | "IMAGE"
    | "EMOJI"
    | "VIDEO"
    | "PATTERN";
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  imageRef?: string;
  scaleMode?: "FILL" | "FIT" | "TILE" | "STRETCH";
}

export interface FigmaEffect {
  type: "INNER_SHADOW" | "DROP_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  visible: boolean;
  radius: number;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  spread?: number;
}

export interface FigmaTypeStyle {
  fontFamily: string;
  fontPostScriptName: string;
  fontWeight: number;
  fontSize: number;
  textAlignHorizontal: "LEFT" | "RIGHT" | "CENTER" | "JUSTIFIED";
  textAlignVertical: "TOP" | "CENTER" | "BOTTOM";
  letterSpacing: number;
  lineHeightPx: number;
  lineHeightUnit: "PIXELS" | "FONT_SIZE_%" | "INTRINSIC_%";
  lineHeightPercentFontSize?: number;
  textDecoration: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
  textCase:
    | "ORIGINAL"
    | "UPPER"
    | "LOWER"
    | "TITLE"
    | "SMALL_CAPS"
    | "SMALL_CAPS_FORCED";
  fills: FigmaPaint[];
}

export interface FigmaComponentProperty {
  type: "BOOLEAN" | "INSTANCE_SWAP" | "TEXT" | "VARIANT";
  value: string | boolean;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  children?: FigmaNode[];

  // Layout (FRAME, COMPONENT, INSTANCE)
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL";
  layoutSizingVertical?: "FIXED" | "HUG" | "FILL";
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "BASELINE";
  layoutWrap?: "NO_WRAP" | "WRAP";
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  counterAxisSpacing?: number;

  // Sizing
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  size?: { x: number; y: number };
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  // Visual
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  strokeAlign?: "INSIDE" | "OUTSIDE" | "CENTER";
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  effects?: FigmaEffect[];
  opacity?: number;
  clipsContent?: boolean;

  // Text
  characters?: string;
  style?: FigmaTypeStyle;
  characterStyleOverrides?: number[];
  styleOverrideTable?: Record<string, Partial<FigmaTypeStyle>>;

  // Instance
  componentId?: string;
  componentProperties?: Record<string, FigmaComponentProperty>;
  overrides?: Array<{ id: string; overriddenFields: string[] }>;

  // Vector geometry
  fillGeometry?: Array<{ path: string; windingRule: string }>;

  // Styles applied
  styles?: Record<string, string>;
}

export interface FigmaComponentMeta {
  key: string;
  name: string;
  description: string;
  componentSetId: string | null;
  remote: boolean;
  documentationLinks: Array<{ uri: string }>;
}

export interface FigmaComponentSetMeta {
  key: string;
  name: string;
  description: string;
  remote: boolean;
}

export interface FigmaStyleMeta {
  key: string;
  name: string;
  description: string;
  remote: boolean;
  styleType: "FILL" | "TEXT" | "EFFECT" | "GRID";
}

export interface FigmaFileNodesResponse {
  name: string;
  lastModified: string;
  err: string | null;
  nodes: Record<
    string,
    {
      document: FigmaNode;
      components: Record<string, FigmaComponentMeta>;
      componentSets: Record<string, FigmaComponentSetMeta>;
      styles: Record<string, FigmaStyleMeta>;
    }
  >;
}
