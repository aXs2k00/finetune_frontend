import { InputHTMLAttributes, forwardRef } from "react";

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  showValue?: boolean;
  minLabel?: string;
  maxLabel?: string;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className = "", label, showValue = true, minLabel, maxLabel, value, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && <label className="text-sm text-[#a1a1a1]">{label}</label>}
            {showValue && (
              <span className="text-sm text-[#fafafa] font-mono">
                {typeof value === "number" ? value.toFixed(props.step || 0.1 < 1 ? 2 : 0) : value}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-3">
          {minLabel && <span className="text-xs text-[#737373]">{minLabel}</span>}
          <input
            ref={ref}
            type="range"
            value={value}
            className={`flex-1 h-2 bg-[#262626] rounded-full appearance-none cursor-pointer accent-[#3b82f6] ${className}`}
            {...props}
          />
          {maxLabel && <span className="text-xs text-[#737373]">{maxLabel}</span>}
        </div>
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
export type { SliderProps };