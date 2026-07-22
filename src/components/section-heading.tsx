import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, description, align = "left", className }: { eyebrow: string; title: string; description: string; align?: "left" | "center"; className?: string }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <Badge className="mb-4">{eyebrow}</Badge>
      <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl lg:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-7 text-muted-foreground text-pretty sm:text-lg">{description}</p>
    </div>
  );
}
