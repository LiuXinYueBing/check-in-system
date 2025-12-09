import * as React from "react";
import { cn } from "@/lib/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary-600 text-white shadow-lg hover:bg-primary-700 focus-visible:ring-primary-500":
              variant === "default",
            "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500":
              variant === "secondary",
            "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-500":
              variant === "outline",
            "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500":
              variant === "ghost",
            "bg-red-600 text-white shadow-lg hover:bg-red-700 focus-visible:ring-red-500":
              variant === "destructive",
          },
          {
            "h-12 px-6 py-3": size === "default",
            "h-10 px-4 py-2": size === "sm",
            "h-14 px-8 py-4 text-base": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };