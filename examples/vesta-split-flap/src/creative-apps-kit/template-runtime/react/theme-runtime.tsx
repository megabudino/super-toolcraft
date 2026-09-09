"use client";

import * as React from "react";
import {
  PortalLayerContainerProvider,
  TooltipProvider,
} from "@/creative-apps-kit/ui/components/primitives";

export const EFFECTS_EDITOR_THEME_PREFERENCE_STORAGE_KEY = "appearance.theme.v1" as const;
export const EFFECTS_EDITOR_DEFAULT_THEME_PREFERENCE = "dark" as const;

export type CreativeAppsKitThemePreference = "dark" | "light" | "system";
export type CreativeAppsKitResolvedTheme = "dark" | "light";

export type CreativeAppsKitThemeContextValue = {
  initialized: boolean;
  resolvedTheme: CreativeAppsKitResolvedTheme;
  setThemePreference: (themePreference: CreativeAppsKitThemePreference) => void;
  themePreference: CreativeAppsKitThemePreference;
  toggleResolvedTheme: () => void;
};

const colorSchemeMediaQuery = "(prefers-color-scheme: dark)";

const CreativeAppsKitThemeContext = React.createContext<CreativeAppsKitThemeContextValue | null>(null);

function isCreativeAppsKitThemePreference(
  value: unknown,
): value is CreativeAppsKitThemePreference {
  return value === "dark" || value === "light" || value === "system";
}

function getSystemResolvedTheme(): CreativeAppsKitResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return EFFECTS_EDITOR_DEFAULT_THEME_PREFERENCE;
  }

  return window.matchMedia(colorSchemeMediaQuery).matches ? "dark" : "light";
}

function resolveThemePreference(
  themePreference: CreativeAppsKitThemePreference,
): CreativeAppsKitResolvedTheme {
  return themePreference === "system" ? getSystemResolvedTheme() : themePreference;
}

function readStoredThemePreference(): CreativeAppsKitThemePreference | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(EFFECTS_EDITOR_THEME_PREFERENCE_STORAGE_KEY);

    return isCreativeAppsKitThemePreference(rawValue) ? rawValue : null;
  } catch {
    return null;
  }
}

function writeStoredThemePreference(themePreference: CreativeAppsKitThemePreference): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EFFECTS_EDITOR_THEME_PREFERENCE_STORAGE_KEY, themePreference);
  } catch {
    // Keep the active theme in memory if storage is unavailable.
  }
}

function getInitialThemePreference(): CreativeAppsKitThemePreference {
  return readStoredThemePreference() ?? EFFECTS_EDITOR_DEFAULT_THEME_PREFERENCE;
}

export function CreativeAppsKitThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [initialized, setInitialized] = React.useState(false);
  const [themePreference, setThemePreferenceState] =
    React.useState<CreativeAppsKitThemePreference>(getInitialThemePreference);
  const [resolvedTheme, setResolvedTheme] = React.useState<CreativeAppsKitResolvedTheme>(() =>
    resolveThemePreference(getInitialThemePreference()),
  );

  const setThemePreference = React.useCallback(
    (nextThemePreference: CreativeAppsKitThemePreference): void => {
      const nextResolvedTheme = resolveThemePreference(nextThemePreference);

      writeStoredThemePreference(nextThemePreference);
      setThemePreferenceState(nextThemePreference);
      setResolvedTheme(nextResolvedTheme);
      setInitialized(true);
    },
    [],
  );

  const toggleResolvedTheme = React.useCallback((): void => {
    setThemePreference(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setThemePreference]);

  React.useEffect(() => {
    setThemePreference(themePreference);
  }, [setThemePreference, themePreference]);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(colorSchemeMediaQuery);
    const handleChange = (): void => {
      if (themePreference !== "system") {
        return;
      }

      const nextResolvedTheme = getSystemResolvedTheme();

      setResolvedTheme(nextResolvedTheme);
    };

    mediaQueryList.addEventListener("change", handleChange);

    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, [themePreference]);

  const value = React.useMemo(
    () => ({
      initialized,
      resolvedTheme,
      setThemePreference,
      themePreference,
      toggleResolvedTheme,
    }),
    [initialized, resolvedTheme, setThemePreference, themePreference, toggleResolvedTheme],
  );

  const portalRootRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <CreativeAppsKitThemeContext.Provider value={value}>
      <div
        data-creative-apps-kit-theme={resolvedTheme}
        data-creative-apps-kit-theme-scope=""
        style={{
          colorScheme: resolvedTheme,
          display: "contents",
        }}
      >
        <PortalLayerContainerProvider container={portalRootRef}>
          <TooltipProvider>{children}</TooltipProvider>
        </PortalLayerContainerProvider>
        <div
          aria-hidden="true"
          data-creative-apps-kit-portal-root=""
          ref={portalRootRef}
          style={{ display: "contents" }}
        />
      </div>
    </CreativeAppsKitThemeContext.Provider>
  );
}

export function useCreativeAppsKitTheme(): CreativeAppsKitThemeContextValue {
  const context = React.useContext(CreativeAppsKitThemeContext);

  if (!context) {
    throw new Error("useCreativeAppsKitTheme must be used within CreativeAppsKitThemeProvider");
  }

  return context;
}
