export const fontFamilies = [
  { label: "Inter", value: "Inter", gfont: "Inter:wght@300;400;500;600;700" },
  { label: "Poppins", value: "Poppins", gfont: "Poppins:wght@300;400;500;600;700" },
  { label: "Outfit", value: "Outfit", gfont: "Outfit:wght@300;400;500;600;700" },
  { label: "Roboto", value: "Roboto", gfont: "Roboto:wght@300;400;500;700" },
  { label: "Nunito", value: "Nunito", gfont: "Nunito:wght@300;400;500;600;700" },
  { label: "Jakarta", value: "Plus Jakarta Sans", gfont: "Plus+Jakarta+Sans:wght@300;400;500;600;700" },
] as const;

export const defaultAppearanceSettings = {
  brandColor: "#3B82F6",
  fontFamily: "Inter",
  fontWeight: "500",
  buttonStyle: "rounded",
};

export function getSafeFontFamily(fontFamily?: string) {
  return fontFamilies.find((font) => font.value === fontFamily)?.value ?? defaultAppearanceSettings.fontFamily;
}

export function getSafeFontImport(fontFamily?: string) {
  return fontFamilies.find((font) => font.value === fontFamily) ?? fontFamilies[0];
}

export function getSafeFontWeight(fontWeight?: string) {
  return ["300", "400", "500", "600", "700"].includes(fontWeight || "")
    ? fontWeight!
    : defaultAppearanceSettings.fontWeight;
}

export function getSafeBrandColor(brandColor?: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(brandColor || "")
    ? brandColor!
    : defaultAppearanceSettings.brandColor;
}

export function getRadiusForButtonStyle(buttonStyle?: string) {
  return buttonStyle === "sharp" ? "0.375rem" : "1rem";
}

export function hexToHsl(hex: string): string {
  let r = 0;
  let g = 0;
  let b = 0;

  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16) / 255;
    g = parseInt(hex.slice(3, 5), 16) / 255;
    b = parseInt(hex.slice(5, 7), 16) / 255;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function settingsArrayToRecord(settings: any[]) {
  return settings.reduce<Record<string, string>>((acc, setting) => {
    if (setting?.key) acc[setting.key] = setting.value;
    return acc;
  }, {});
}
