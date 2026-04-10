import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm text-[#a1a1a1]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-[#fafafa] placeholder:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-colors ${
            error ? "border-[#ef4444]" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-[#ef4444]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm text-[#a1a1a1]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-[#fafafa] placeholder:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-colors resize-none ${
            error ? "border-[#ef4444]" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-[#ef4444]">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, id, options, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm text-[#a1a1a1]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-colors ${
            error ? "border-[#ef4444]" : ""
          } ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-[#ef4444]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Input, Textarea, Select };
export type { InputProps, TextareaProps, SelectProps };