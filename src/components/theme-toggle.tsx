import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("abliteration-theme", dark ? "dark" : "light");
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", dark ? "#101114" : "#f7f7f4");
  }, [dark]);

  return (
    <Button variant="ghost" size="icon" onClick={() => setDark((value) => !value)} aria-label={dark ? "Use light theme" : "Use dark theme"}>
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
