"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export const MagneticButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          variant === "primary" ? "btn-primary" : "btn-secondary",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
MagneticButton.displayName = "MagneticButton";
