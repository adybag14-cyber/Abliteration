import { useEffect, useState } from "react";
import { BookOpen, GitFork, Orbit } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { REPOSITORY_URL } from "@/lib/utils";

const navigation = [
  ["Path", "#path"],
  ["Steps", "#steps"],
  ["Compare", "#compare"],
  ["Techniques", "#techniques"],
  ["Gates", "#gates"],
];

export function SiteHeader() {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const update = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setScroll(available > 0 ? (window.scrollY / available) * 100 : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="group flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:rotate-12">
            <Orbit className="size-5" aria-hidden="true" />
          </span>
          <span className="hidden font-display text-sm font-bold tracking-tight sm:block">Abliteration <span className="text-muted-foreground">Field Guide</span></span>
        </a>

        <nav aria-label="Guide sections" className="ml-auto hidden items-center gap-1 lg:flex">
          {navigation.map(([label, href]) => (
            <Button key={href} variant="ghost" size="sm" asChild>
              <a href={href}>{label}</a>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <a href={`${REPOSITORY_URL}#readme`} aria-label="Read the full handbook on GitHub"><BookOpen aria-hidden="true" /></a>
          </Button>
          <Button variant="secondary" size="sm" className="hidden sm:inline-flex" asChild>
            <a href={REPOSITORY_URL}><GitFork aria-hidden="true" /> GitHub</a>
          </Button>
        </div>
      </div>
      <Progress value={scroll} className="h-0.5 rounded-none bg-transparent" aria-label="Page reading progress" />
      <nav aria-label="Guide sections mobile" className="scrollbar-none flex gap-1 overflow-x-auto border-t border-border/40 px-3 py-2 lg:hidden">
        {navigation.map(([label, href]) => (
          <Button key={href} variant="ghost" size="sm" asChild><a href={href}>{label}</a></Button>
        ))}
      </nav>
    </header>
  );
}
