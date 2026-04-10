import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f0f0f] disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-[#3b82f6] text-white hover:bg-[#2563eb] focus:ring-[#3b82f6]",
      secondary: "bg-[#262626] text-[#fafafa] hover:bg-[#333333] border border-[#333333] focus:ring-[#333333]",
      ghost: "text-[#a1a1a1] hover:text-[#fafafa] hover:bg-[#262626] focus:ring-[#333333]",
      danger: "bg-[#ef4444] text-white hover:bg-[#dc2626] focus:ring-[#ef4444]",
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };