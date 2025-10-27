"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeSwitcher() {
  const [isReady, setIsReady] = useState(false);
  const { theme, setTheme } = useTheme();

  // Wait until the component mounts before rendering icons (fix hydration)
  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  const ICON_DIMENSION = 16;

  const renderThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun size={ICON_DIMENSION} className="text-muted-foreground" />;
      case "dark":
        return <Moon size={ICON_DIMENSION} className="text-muted-foreground" />;
      default:
        return (
          <Laptop size={ICON_DIMENSION} className="text-muted-foreground" />
        );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Toggle theme">
          {renderThemeIcon()}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-content" align="start">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value)}
        >
          <DropdownMenuRadioItem value="light" className="flex gap-2">
            <Sun size={ICON_DIMENSION} className="text-muted-foreground" />
            <span>Light</span>
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem value="dark" className="flex gap-2">
            <Moon size={ICON_DIMENSION} className="text-muted-foreground" />
            <span>Dark</span>
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem value="system" className="flex gap-2">
            <Laptop size={ICON_DIMENSION} className="text-muted-foreground" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
