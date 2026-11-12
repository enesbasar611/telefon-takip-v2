"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const THEME_MODES = ["light", "dark", "system"] as const;
type ThemeMode = (typeof THEME_MODES)[number];

const THEME_META: Record<
  ThemeMode,
  { label: string; nextLabel: string; iconClassName: string }
> = {
  light: {
    label: "Açık Mod",
    nextLabel: "Koyu Moda Geç",
    iconClassName: "text-amber-500",
  },
  dark: {
    label: "Koyu Mod",
    nextLabel: "Sistem Moduna Geç",
    iconClassName: "text-indigo-400",
  },
  system: {
    label: "Sistem Modu",
    nextLabel: "Açık Moda Geç",
    iconClassName: "text-sky-500",
  },
};

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentMode: ThemeMode =
    mounted && THEME_MODES.includes(theme as ThemeMode)
      ? (theme as ThemeMode)
      : "system";

  const handleCycleTheme = () => {
    const nextIndex = (THEME_MODES.indexOf(currentMode) + 1) % THEME_MODES.length;
    setTheme(THEME_MODES[nextIndex]);
  };

  const meta = THEME_META[currentMode];
  const tooltip = `${meta.label} · Tıkla: ${meta.nextLabel}`;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleCycleTheme}
      title={tooltip}
      aria-label={tooltip}
      className="h-10 w-10 rounded-xl bg-muted/40 border-border/40 hover:border-primary/30 transition-all shrink-0"
    >
      {currentMode === "light" && (
        <Sun className={`h-[1.15rem] w-[1.15rem] ${meta.iconClassName}`} />
      )}
      {currentMode === "dark" && (
        <Moon className={`h-[1.15rem] w-[1.15rem] ${meta.iconClassName}`} />
      )}
      {currentMode === "system" && (
        <Monitor className={`h-[1.15rem] w-[1.15rem] ${meta.iconClassName}`} />
      )}
      <span className="sr-only">{tooltip}</span>
    </Button>
  );
}
