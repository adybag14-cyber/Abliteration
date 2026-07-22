import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]", {
  variants: {
    variant: {
      default: "border-primary/15 bg-primary/10 text-primary",
      secondary: "border-border bg-muted text-muted-foreground",
      success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
  },
  defaultVariants: { variant: "default" },
});

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
