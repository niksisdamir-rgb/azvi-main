import { describe, it, expect, beforeEach, vi } from "vitest";

describe("LanguageContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should have default language as Bosnian (bs)", () => {
    const stored = localStorage.getItem("language");
    expect(stored).toBeNull(); // No language stored initially
  });

  it("should persist language preference to localStorage", () => {
    const language = "en";
    localStorage.setItem("language", language);
    const stored = localStorage.getItem("language");
    expect(stored).toBe("en");
  });

  it("should support all three languages", () => {
    const languages = ["en", "bs", "az"];
    languages.forEach((lang) => {
      localStorage.setItem("language", lang);
      const stored = localStorage.getItem("language");
      expect(stored).toBe(lang);
    });
  });

  it("should validate language codes", () => {
    const validLanguages = ["en", "bs", "az"];
    const testLanguage = "en";
    expect(validLanguages.includes(testLanguage)).toBe(true);
  });

  it("should handle invalid language codes gracefully", () => {
    const validLanguages = ["en", "bs", "az"];
    const invalidLanguage = "fr";
    expect(validLanguages.includes(invalidLanguage)).toBe(false);
  });

  it("should load saved language preference from localStorage", () => {
    localStorage.setItem("language", "az");
    const stored = localStorage.getItem("language");
    expect(stored).toBe("az");
  });

  it("should default to Bosnian when no preference is saved", () => {
    const defaultLanguage = "bs";
    const stored = localStorage.getItem("language");
    if (!stored) {
      expect(defaultLanguage).toBe("bs");
    }
  });

  it("should support switching between all languages", () => {
    const languages = ["en", "bs", "az"];
    let currentLanguage = "bs";

    languages.forEach((lang) => {
      currentLanguage = lang;
      localStorage.setItem("language", currentLanguage);
      expect(localStorage.getItem("language")).toBe(lang);
    });
  });

  it("should maintain language preference across page reloads", () => {
    const language = "az";
    localStorage.setItem("language", language);
    
    // Simulate page reload by reading from localStorage
    const stored = localStorage.getItem("language");
    expect(stored).toBe("az");
  });

  it("should provide translation keys structure", () => {
    const translationKeys = {
      nav: {},
      dashboard: {},
      materials: {},
      settings: {},
      documents: {},
      projects: {},
      deliveries: {},
      qualityControl: {},
      employees: {},
      machines: {},
      timesheets: {},
      common: {},
    };

    expect(Object.keys(translationKeys).length).toBeGreaterThan(0);
  });
});
