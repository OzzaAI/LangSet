"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render nothing on the server and until the theme is mounted
    return null;
  }

  return (
    <div>
      {theme === "dark" ? (
        <Button 
          variant="ghost" 
          className="hover:bg-white/10 border-zinc-900 bg-black/20 backdrop-blur-sm" 
          size="icon" 
          onClick={() => setTheme("light")}
        >
          <Sun className="w-5 h-5 text-amber-400" />
          <span className="sr-only">Switch to light mode</span>
        </Button>
      ) : (
        <Button 
          variant="ghost" 
          size="icon" 
          className="hover:bg-gray-100 border-zinc-100 bg-white/80 backdrop-blur-sm" 
          onClick={() => setTheme("dark")}
        >
          <Moon className="w-5 h-5 text-slate-600" />
          <span className="sr-only">Switch to dark mode</span>
        </Button>
      )}
    </div>
  );
}