export interface TailwindResolved {
  raw: string; // e.g. "48px", "#0f172a", "600"
  tw: string; // e.g. "p-12", "bg-slate-900", "font-semibold"
  exact: boolean; // true if exact Tailwind match, false if approximate/arbitrary
}

export interface ParsedColor {
  hex: string;
  tw: TailwindResolved;
}

export type ParsedNodeType =
  | "FRAME"
  | "TEXT"
  | "INSTANCE"
  | "ICON"
  | "SHAPE"
  | "IMAGE";

export interface ParsedAnnotation {
  label?: string;
  properties: string[];
}

export interface ParsedNodeBase {
  type: ParsedNodeType;
  name: string;
  figmaId: string;
  children?: ParsedNode[];
  annotations?: ParsedAnnotation[];
}

export interface ParsedFrame extends ParsedNodeBase {
  type: "FRAME";
  layout?: {
    mode: "horizontal" | "vertical";
    padding: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    gap: TailwindResolved;
    primaryAlign: string;
    counterAlign: string;
    wrap?: boolean;
  };
  width: string; // "fill-parent" | "hug-contents" | "200px"
  height: string;
  fill?: ParsedColor;
  stroke?: ParsedColor;
  strokeWeight?: number;
  cornerRadius?: TailwindResolved;
  effects?: string[];
  opacity?: number;
  paddingTw?: string; // combined Tailwind padding string e.g. "py-12 px-16"
}

export interface ParsedText extends ParsedNodeBase {
  type: "TEXT";
  content: string;
  font: string;
  fontIsDefault?: boolean; // true if font matches config defaults.font
  weight: TailwindResolved;
  size: TailwindResolved;
  lineHeight: TailwindResolved;
  letterSpacing: TailwindResolved;
  color: ParsedColor;
  align: string;
  decoration?: string;
  textCase?: string;
}

export interface ParsedInstance extends ParsedNodeBase {
  type: "INSTANCE";
  componentName: string; // resolved original name
  mappedComponent?: string; // e.g. "shadcn/Button"
  isRemote: boolean;
  variantProperties?: Record<string, string>;
  overrides?: string[];
  // Visual properties (instances are visually frames)
  fill?: ParsedColor;
  stroke?: ParsedColor;
  strokeWeight?: number;
  cornerRadius?: TailwindResolved;
  opacity?: number;
  width?: string;
  height?: string;
  assetPath?: string;
  children?: ParsedNode[];
}

export interface ParsedIcon extends ParsedNodeBase {
  type: "ICON";
  source: string; // e.g. "lucide-react/TrendingUp"
  size: { width: number; height: number };
  color?: ParsedColor;
}

export interface ParsedShape extends ParsedNodeBase {
  type: "SHAPE";
  shapeType: string; // "RECTANGLE", "ELLIPSE", "LINE", etc.
  width: number;
  height: number;
  fill?: ParsedColor;
  stroke?: ParsedColor;
  cornerRadius?: TailwindResolved;
  effects?: string[];
}

export interface ParsedImage extends ParsedNodeBase {
  type: "IMAGE";
  width: number;
  height: number;
  imageRef?: string;
  imageUrl?: string; // resolved S3 URL from image fills endpoint
  scaleMode?: string;
  clipped?: boolean; // true if parent clips content (e.g., circular avatar)
  cornerRadius?: TailwindResolved;
}

export type ParsedNode =
  | ParsedFrame
  | ParsedText
  | ParsedInstance
  | ParsedIcon
  | ParsedShape
  | ParsedImage;
