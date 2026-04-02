/**
 * Tailwind v3 default design-token scales.
 * Maps numeric pixel/em values → Tailwind class suffixes.
 */

/** Spacing scale: px value → Tailwind suffix (used for padding, margin, gap, w, h) */
export const SPACING: Record<number, string> = {
  0: "0",
  1: "px",
  2: "0.5",
  4: "1",
  6: "1.5",
  8: "2",
  10: "2.5",
  12: "3",
  14: "3.5",
  16: "4",
  20: "5",
  24: "6",
  28: "7",
  32: "8",
  36: "9",
  40: "10",
  44: "11",
  48: "12",
  56: "14",
  64: "16",
  80: "20",
  96: "24",
  112: "28",
  128: "32",
  144: "36",
  160: "40",
  176: "44",
  192: "48",
  208: "52",
  224: "56",
  240: "60",
  256: "64",
  288: "72",
  320: "80",
  384: "96",
};

/** Font size scale: px value → Tailwind suffix */
export const FONT_SIZE: Record<number, string> = {
  12: "xs",
  14: "sm",
  16: "base",
  18: "lg",
  20: "xl",
  24: "2xl",
  30: "3xl",
  36: "4xl",
  48: "5xl",
  60: "6xl",
  72: "7xl",
  96: "8xl",
  128: "9xl",
};

/** Font weight: numeric weight → Tailwind suffix */
export const FONT_WEIGHT: Record<number, string> = {
  100: "thin",
  200: "extralight",
  300: "light",
  400: "normal",
  500: "medium",
  600: "semibold",
  700: "bold",
  800: "extrabold",
  900: "black",
};

/** Line height scale: computed ratio × 100 (integer) → Tailwind suffix
 *  e.g. lineHeightPx/fontSize = 1.25 → 125 → "tight" */
export const LINE_HEIGHT_RATIO: Record<number, string> = {
  100: "none",
  125: "tight",
  137: "snug",
  150: "normal",
  162: "relaxed",
  200: "loose",
};

/** Letter spacing: em value × 100 (integer) → Tailwind suffix */
export const LETTER_SPACING: Record<number, string> = {
  [-5]: "tighter",
  [-2]: "tight",
  0: "normal",
  2: "wide",
  5: "wider",
  10: "widest",
};

/** Border radius: px value → Tailwind suffix */
export const BORDER_RADIUS: Record<number, string> = {
  0: "none",
  2: "sm",
  4: "DEFAULT",
  6: "md",
  8: "lg",
  12: "xl",
  16: "2xl",
  24: "3xl",
  9999: "full",
};

/** Opacity: 0-100 percentage → Tailwind suffix */
export const OPACITY: Record<number, string> = {
  0: "0",
  5: "5",
  10: "10",
  15: "15",
  20: "20",
  25: "25",
  30: "30",
  35: "35",
  40: "40",
  45: "45",
  50: "50",
  55: "55",
  60: "60",
  65: "65",
  70: "70",
  75: "75",
  80: "80",
  85: "85",
  90: "90",
  95: "95",
  100: "100",
};
