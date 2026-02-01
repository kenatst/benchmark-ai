import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md",
        destructive: "bg-destructive text-destructive-foreground rounded-full shadow-md hover:bg-destructive/90 hover:shadow-lg",
        outline: "border-2 border-border bg-transparent rounded-full hover:border-foreground/30 hover:bg-secondary/50",
        secondary: "bg-lavender text-lavender-foreground rounded-full shadow-sm hover:bg-lavender/80 hover:shadow-md",
        ghost: "rounded-xl hover:bg-secondary hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        coral: "bg-coral/20 text-coral-foreground border border-coral/40 rounded-full hover:bg-coral/30",
        sky: "bg-sky/20 text-sky-foreground border border-sky/40 rounded-full hover:bg-sky/30",
        mint: "bg-mint/20 text-mint-foreground border border-mint/40 rounded-full hover:bg-mint/30",
        lavender: "bg-lavender/25 text-lavender-foreground border border-lavender/50 rounded-full hover:bg-lavender/35",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-5 text-xs",
        lg: "h-14 px-10 text-base",
        xl: "h-16 px-12 text-lg",
        icon: "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
