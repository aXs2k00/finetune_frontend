import { HTMLAttributes, forwardRef } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-[#262626] text-[#a1a1a1]",
      success: "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20",
      warning: "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20",
      error: "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20",
      info: "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20",
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
export type { BadgeProps };