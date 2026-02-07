import { describe, it, expect } from "vitest";
import { isValidTheme, VALID_THEMES } from "@/lib/personalizacion/themes";
import { getSkinByValue, isValidSkin, skinOptions } from "@/lib/personalizacion/skins";
import { FEATURE_ICONS, getFeatureIconSvg, normalizeFeatureIcon } from "@/lib/personalizacion/feature-icons";

describe("personalizacion helpers", () => {
  it("valida themes conocidos y rechaza desconocidos", () => {
    expect(isValidTheme(VALID_THEMES[0])).toBe(true);
    expect(isValidTheme("no-existe")).toBe(false);
  });

  it("resuelve skins por value", () => {
    const first = skinOptions[0];
    expect(getSkinByValue(first.value)).toEqual(first);
    expect(isValidSkin(first.value)).toBe(true);
    expect(isValidSkin("no-existe")).toBe(false);
  });

  it("normaliza iconos y hace fallback a star", () => {
    const starSvg = FEATURE_ICONS.find((icon) => icon.id === "star")?.svg || "";
    expect(getFeatureIconSvg("star")).toBe(starSvg);
    expect(normalizeFeatureIcon("star")).toBe("star");
    expect(normalizeFeatureIcon("no-existe")).toBe("star");
  });
});
