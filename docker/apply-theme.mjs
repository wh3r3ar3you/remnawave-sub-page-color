import fs from "node:fs";
import path from "node:path";

const assetsDir = "/opt/app/frontend/assets";
const jsFile = fs
  .readdirSync(assetsDir)
  .find((file) => /^index-.*\.js$/.test(file));

if (!jsFile) {
  console.error("Theme patch failed: frontend bundle was not found");
  process.exit(1);
}

const rawThemeColor = cleanValue(process.env.THEME_COLOR || "purple").toLowerCase();

function cleanValue(value) {
  return String(value || "").trim().replace(/^"|"$/g, "");
}

function parseHexColor(value) {
  const cleaned = cleanValue(value).replace(/^#/, "");

  if (/^[0-9a-f]{3}$/i.test(cleaned)) {
    return `#${cleaned.split("").map((part) => part + part).join("")}`.toLowerCase();
  }

  if (/^[0-9a-f]{6}$/i.test(cleaned)) {
    return `#${cleaned}`.toLowerCase();
  }

  return null;
}

function hexToRgb(hex) {
  const normalized = parseHexColor(hex);

  if (!normalized) {
    return null;
  }

  const value = Number.parseInt(normalized.slice(1), 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function rgbString(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : null;
}

function channelToHex(value) {
  return Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, "0");
}

function mixHex(fromHex, toHex, weight) {
  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);

  if (!from || !to) {
    return fromHex;
  }

  return `#${channelToHex(from.r + (to.r - from.r) * weight)}${channelToHex(
    from.g + (to.g - from.g) * weight
  )}${channelToHex(from.b + (to.b - from.b) * weight)}`;
}

function luminance(hex) {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return 0;
  }

  const linear = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function rgbaFromHex(hex, alpha) {
  const rgb = rgbString(hex);
  return rgb ? `rgba(${rgb}, ${alpha})` : `rgba(139, 92, 246, ${alpha})`;
}

function envHex(name) {
  return parseHexColor(process.env[name]);
}

function buildHexTheme(accentHex) {
  const isDarkAccent = luminance(accentHex) < 0.18;
  const primaryFilled = isDarkAccent ? mixHex(accentHex, "#ffffff", 0.18) : accentHex;
  const primaryFilledHover = isDarkAccent
    ? mixHex(accentHex, "#ffffff", 0.28)
    : mixHex(accentHex, "#000000", 0.12);
  const accentSoftHex = envHex("THEME_SOFT_COLOR") || mixHex(accentHex, "#ffffff", isDarkAccent ? 0.58 : 0.42);
  const accent2Hex = envHex("THEME_ACCENT_2_COLOR") || mixHex(accentHex, "#ec4899", 0.42);
  const textAccent = luminance(accentHex) < 0.28 ? mixHex(accentHex, "#ffffff", 0.68) : mixHex(accentHex, "#ffffff", 0.28);
  const backgroundHex = envHex("THEME_BACKGROUND_COLOR");
  const headerHex = envHex("THEME_HEADER_COLOR");
  const mainHex = envHex("THEME_MAIN_COLOR");

  return {
    mantine: "violet",
    primaryFilled,
    primaryFilledHover,
    primaryLight: rgbaFromHex(accentHex, 0.16),
    primaryLightHover: rgbaFromHex(accentHex, 0.24),
    primaryLightColor: textAccent,
    accentRgb: rgbString(accentHex),
    accentSoftRgb: rgbString(accentSoftHex),
    accent2Rgb: rgbString(accent2Hex),
    textAccent,
    bodyGradient: backgroundHex
      ? `linear-gradient(145deg, ${mixHex(backgroundHex, "#000000", 0.25)} 0%, ${backgroundHex} 52%, ${mixHex(
          backgroundHex,
          accentHex,
          0.18
        )} 100%)`
      : `linear-gradient(145deg, ${mixHex(accentHex, "#000000", 0.82)} 0%, ${mixHex(
          accentHex,
          "#000000",
          0.74
        )} 48%, ${mixHex(accentHex, "#000000", 0.66)} 100%)`,
    mainSurfaceTop: mainHex ? rgbaFromHex(mainHex, 0.72) : rgbaFromHex(mixHex(accentHex, "#000000", 0.78), 0.72),
    mainSurfaceBottom: mainHex ? rgbaFromHex(mixHex(mainHex, "#000000", 0.12), 0.8) : rgbaFromHex(mixHex(accentHex, "#000000", 0.84), 0.8),
    headerSurface: headerHex ? rgbaFromHex(headerHex, 0.5) : rgbaFromHex(mixHex(accentHex, "#000000", 0.78), 0.5)
  };
}

const themes = {
  white: {
    mantine: "gray",
    primaryFilled: "#f3f4f6",
    primaryFilledHover: "#ffffff",
    primaryLight: "rgba(255, 255, 255, 0.14)",
    primaryLightHover: "rgba(255, 255, 255, 0.22)",
    primaryLightColor: "#f9fafb",
    accentRgb: "255, 255, 255",
    accentSoftRgb: "226, 232, 240",
    accent2Rgb: "203, 213, 225",
    textAccent: "#ffffff",
    bodyGradient: "linear-gradient(145deg, #05070b 0%, #111827 52%, #1f2937 100%)",
    mainSurfaceTop: "rgba(10, 14, 24, 0.74)",
    mainSurfaceBottom: "rgba(7, 10, 18, 0.8)",
    headerSurface: "rgba(7, 10, 18, 0.52)"
  },
  red: {
    mantine: "red",
    primaryFilled: "#ef4444",
    primaryFilledHover: "#dc2626",
    primaryLight: "rgba(239, 68, 68, 0.16)",
    primaryLightHover: "rgba(239, 68, 68, 0.24)",
    primaryLightColor: "#fecaca",
    accentRgb: "239, 68, 68",
    accentSoftRgb: "251, 113, 133",
    accent2Rgb: "251, 146, 60",
    textAccent: "#fda4af",
    bodyGradient: "linear-gradient(145deg, #120507 0%, #1f0a10 45%, #2b0f14 100%)",
    mainSurfaceTop: "rgba(24, 8, 12, 0.72)",
    mainSurfaceBottom: "rgba(18, 6, 10, 0.8)",
    headerSurface: "rgba(20, 8, 12, 0.5)"
  },
  orange: {
    mantine: "orange",
    primaryFilled: "#f97316",
    primaryFilledHover: "#ea580c",
    primaryLight: "rgba(249, 115, 22, 0.16)",
    primaryLightHover: "rgba(249, 115, 22, 0.24)",
    primaryLightColor: "#fed7aa",
    accentRgb: "249, 115, 22",
    accentSoftRgb: "251, 146, 60",
    accent2Rgb: "250, 204, 21",
    textAccent: "#fdba74",
    bodyGradient: "linear-gradient(145deg, #140803 0%, #221006 48%, #2a1807 100%)",
    mainSurfaceTop: "rgba(26, 11, 5, 0.72)",
    mainSurfaceBottom: "rgba(18, 8, 4, 0.8)",
    headerSurface: "rgba(23, 11, 5, 0.5)"
  },
  yellow: {
    mantine: "yellow",
    primaryFilled: "#eab308",
    primaryFilledHover: "#ca8a04",
    primaryLight: "rgba(234, 179, 8, 0.16)",
    primaryLightHover: "rgba(234, 179, 8, 0.24)",
    primaryLightColor: "#fde68a",
    accentRgb: "234, 179, 8",
    accentSoftRgb: "250, 204, 21",
    accent2Rgb: "245, 158, 11",
    textAccent: "#fde047",
    bodyGradient: "linear-gradient(145deg, #120f03 0%, #1d1806 48%, #2a2208 100%)",
    mainSurfaceTop: "rgba(24, 19, 5, 0.7)",
    mainSurfaceBottom: "rgba(17, 14, 4, 0.78)",
    headerSurface: "rgba(22, 18, 5, 0.5)"
  },
  green: {
    mantine: "green",
    primaryFilled: "#22c55e",
    primaryFilledHover: "#16a34a",
    primaryLight: "rgba(34, 197, 94, 0.16)",
    primaryLightHover: "rgba(34, 197, 94, 0.24)",
    primaryLightColor: "#bbf7d0",
    accentRgb: "34, 197, 94",
    accentSoftRgb: "52, 211, 153",
    accent2Rgb: "45, 212, 191",
    textAccent: "#86efac",
    bodyGradient: "linear-gradient(145deg, #03120a 0%, #072016 48%, #0a2b1d 100%)",
    mainSurfaceTop: "rgba(5, 22, 13, 0.72)",
    mainSurfaceBottom: "rgba(4, 17, 11, 0.8)",
    headerSurface: "rgba(5, 20, 12, 0.5)"
  },
  cyan: {
    mantine: "cyan",
    primaryFilled: "#06b6d4",
    primaryFilledHover: "#0891b2",
    primaryLight: "rgba(6, 182, 212, 0.16)",
    primaryLightHover: "rgba(6, 182, 212, 0.24)",
    primaryLightColor: "#a5f3fc",
    accentRgb: "34, 211, 238",
    accentSoftRgb: "6, 182, 212",
    accent2Rgb: "59, 130, 246",
    textAccent: "#67e8f9",
    bodyGradient: "linear-gradient(145deg, #031018 0%, #071b28 48%, #0a2432 100%)",
    mainSurfaceTop: "rgba(5, 18, 27, 0.72)",
    mainSurfaceBottom: "rgba(4, 14, 21, 0.8)",
    headerSurface: "rgba(5, 16, 24, 0.5)"
  },
  blue: {
    mantine: "blue",
    primaryFilled: "#3b82f6",
    primaryFilledHover: "#2563eb",
    primaryLight: "rgba(59, 130, 246, 0.16)",
    primaryLightHover: "rgba(59, 130, 246, 0.24)",
    primaryLightColor: "#bfdbfe",
    accentRgb: "59, 130, 246",
    accentSoftRgb: "96, 165, 250",
    accent2Rgb: "99, 102, 241",
    textAccent: "#93c5fd",
    bodyGradient: "linear-gradient(145deg, #050a16 0%, #091428 48%, #0c1e36 100%)",
    mainSurfaceTop: "rgba(7, 14, 28, 0.72)",
    mainSurfaceBottom: "rgba(5, 11, 21, 0.8)",
    headerSurface: "rgba(7, 13, 25, 0.5)"
  },
  purple: {
    mantine: "violet",
    primaryFilled: "#8b5cf6",
    primaryFilledHover: "#7c3aed",
    primaryLight: "rgba(139, 92, 246, 0.16)",
    primaryLightHover: "rgba(139, 92, 246, 0.24)",
    primaryLightColor: "#ddd6fe",
    accentRgb: "168, 85, 247",
    accentSoftRgb: "196, 181, 253",
    accent2Rgb: "236, 72, 153",
    textAccent: "#c4b5fd",
    bodyGradient: "linear-gradient(145deg, #070312 0%, #10051f 45%, #160a2d 100%)",
    mainSurfaceTop: "rgba(10, 6, 23, 0.72)",
    mainSurfaceBottom: "rgba(8, 5, 18, 0.8)",
    headerSurface: "rgba(11, 7, 24, 0.5)"
  },
  pink: {
    mantine: "pink",
    primaryFilled: "#ec4899",
    primaryFilledHover: "#db2777",
    primaryLight: "rgba(236, 72, 153, 0.16)",
    primaryLightHover: "rgba(236, 72, 153, 0.24)",
    primaryLightColor: "#fbcfe8",
    accentRgb: "236, 72, 153",
    accentSoftRgb: "244, 114, 182",
    accent2Rgb: "168, 85, 247",
    textAccent: "#f9a8d4",
    bodyGradient: "linear-gradient(145deg, #14040d 0%, #220818 48%, #2a0b1f 100%)",
    mainSurfaceTop: "rgba(28, 7, 18, 0.72)",
    mainSurfaceBottom: "rgba(20, 5, 13, 0.8)",
    headerSurface: "rgba(24, 7, 16, 0.5)"
  }
};

const namedTheme = themes[rawThemeColor];
const accentHex = envHex("THEME_ACCENT_COLOR") || parseHexColor(rawThemeColor);
const theme = accentHex ? buildHexTheme(accentHex) : namedTheme || themes.purple;
const appliedThemeName = accentHex ? accentHex : namedTheme ? rawThemeColor : "purple";

const css = `:root,
:host {
  --mantine-primary-color-filled: ${theme.primaryFilled};
  --mantine-primary-color-filled-hover: ${theme.primaryFilledHover};
  --mantine-primary-color-light: ${theme.primaryLight};
  --mantine-primary-color-light-hover: ${theme.primaryLightHover};
  --mantine-primary-color-light-color: ${theme.primaryLightColor};
}

html,
body {
  background:
    radial-gradient(circle at 20% 20%, rgba(${theme.accentRgb}, 0.14), transparent 30%),
    radial-gradient(circle at 80% 18%, rgba(${theme.accent2Rgb}, 0.1), transparent 28%),
    radial-gradient(circle at 72% 78%, rgba(${theme.accentSoftRgb}, 0.08), transparent 26%),
    ${theme.bodyGradient};
  background-attachment: fixed;
}

.animated-background {
  background:
    radial-gradient(ellipse 58% 38% at 18% 22%, rgba(${theme.accentRgb}, 0.16), transparent 50%),
    radial-gradient(ellipse 42% 34% at 82% 18%, rgba(${theme.accent2Rgb}, 0.11), transparent 48%),
    radial-gradient(ellipse 48% 40% at 76% 78%, rgba(${theme.accentSoftRgb}, 0.09), transparent 50%);
  filter: saturate(1.05) blur(2px);
}

.logo-text-highlight {
  color: ${theme.textAccent};
}

img[alt="logo"] {
  width: 44px !important;
  height: 44px !important;
  min-width: 44px;
  min-height: 44px;
  object-fit: contain;
}

.header-wrapper,
._modalContent_1arri_1,
._modalContent_1qevm_1 {
  background: ${theme.headerSurface};
  border-color: rgba(${theme.accentSoftRgb}, 0.16);
}

.header-wrapper {
  position: sticky;
  overflow: hidden;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 10px 30px rgba(3, 2, 10, 0.22);
}

.header-wrapper::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 12% 50%, rgba(${theme.accentRgb}, 0.16), transparent 30%),
    linear-gradient(90deg, rgba(${theme.accentSoftRgb}, 0.1), rgba(${theme.accentRgb}, 0.04) 42%, rgba(${theme.accent2Rgb}, 0.08) 100%);
  opacity: 0.9;
}

.header-wrapper::after {
  content: "";
  position: absolute;
  left: 1rem;
  right: 1rem;
  top: 0;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(${theme.accentSoftRgb}, 0.55), transparent);
  box-shadow: 0 0 14px rgba(${theme.accentRgb}, 0.16);
}

._content_ygasm_7 {
  position: relative;
  z-index: 1;
}

._main_ygasm_13 {
  position: relative;
  padding: 1.25rem;
  border-radius: 1.5rem;
  background: linear-gradient(180deg, ${theme.mainSurfaceTop}, ${theme.mainSurfaceBottom});
  border: 1px solid rgba(${theme.accentSoftRgb}, 0.14);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

._main_ygasm_13::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 20%),
    radial-gradient(circle at top left, rgba(${theme.accentRgb}, 0.08), transparent 28%);
}

._root_xtro1_1 {
  background: rgba(255, 255, 255, 0.035);
  border-color: rgba(${theme.accentSoftRgb}, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

._root_xtro1_1:hover,
._accordionItem_w29pm_1[data-active] {
  border-color: rgba(${theme.accentSoftRgb}, 0.32);
}

._accordionItem_w29pm_1 {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(${theme.accentSoftRgb}, 0.1);
}

._timelineRoot_1viu6_2 {
  --tl-line-color: rgba(${theme.accentSoftRgb}, 0.26);
}

._timelineItemBullet_1viu6_10 {
  filter: drop-shadow(0 0 8px rgba(${theme.accentRgb}, 0.18));
}

._appButton_19ebt_8 {
  background: rgba(255, 255, 255, 0.045);
  border-color: rgba(${theme.accentSoftRgb}, 0.12);
  border-left-color: rgba(${theme.accentSoftRgb}, 0.18);
}

._appButton_19ebt_8:hover {
  background: rgba(255, 255, 255, 0.075);
  border-left-color: rgba(${theme.accentSoftRgb}, 0.32);
}

._appButtonActive_19ebt_34,
._appButtonActive_19ebt_34:hover {
  background: linear-gradient(90deg, rgba(${theme.accentRgb}, 0.18), rgba(${theme.accent2Rgb}, 0.08));
  border-color: rgba(${theme.accentRgb}, 0.28);
  border-left-color: ${theme.primaryFilled};
  box-shadow:
    inset 4px 0 12px -4px rgba(${theme.accentRgb}, 0.4),
    0 0 18px rgba(${theme.accentRgb}, 0.12);
}

._appButtonActive_19ebt_34 ._appName_19ebt_44 {
  color: ${theme.primaryLightColor};
}

._appButton_19ebt_8 ._bgIcon_19ebt_30,
._appButton_19ebt_8 ._bgIcon_19ebt_30 svg,
._appButton_19ebt_8 ._bgIcon_19ebt_30 svg path {
  color: rgba(${theme.accentSoftRgb}, 0.36);
  fill: currentColor;
}

.info-card-cyan,
._iconCyan_11dhi_15,
._cyan_1oql7_11 {
  background: linear-gradient(135deg, rgba(${theme.accentRgb}, 0.18), rgba(${theme.accent2Rgb}, 0.08));
  border-color: rgba(${theme.accentRgb}, 0.24);
}
`;

const cssPath = path.join(assetsDir, "theme-overrides.css");
fs.writeFileSync(cssPath, css, "utf8");

const bundlePath = path.join(assetsDir, jsFile);
const bundle = fs.readFileSync(bundlePath, "utf8");
const nextBundle = bundle.replace(/primaryColor:"[^"]+"/g, `primaryColor:"${theme.mantine}"`);

if (bundle !== nextBundle) {
  fs.writeFileSync(bundlePath, nextBundle, "utf8");
}

console.log(`Applied theme color: ${appliedThemeName} -> ${theme.mantine}`);
