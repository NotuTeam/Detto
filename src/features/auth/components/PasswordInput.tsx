"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  label?: string;
  name: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  minLength?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PasswordInput({ label, name, placeholder, error, required, minLength, value, onChange }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[0.6rem] font-semibold text-[var(--text-on-accent)] tracking-[0.06em] uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          value={value}
          onChange={onChange}
          className={cn(
            "w-full rounded-[var(--radius-md)] bg-[var(--input-bg)] border-[1.5px] border-transparent text-[var(--text-primary)] text-[0.9rem] font-medium py-[13px] px-4 pr-12 outline-none transition-all duration-200",
            "placeholder:text-[var(--text-secondary)] placeholder:font-normal focus:border-[var(--accent)]",
            error && "border-red-500 focus:border-red-500"
          )}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="text-[0.7rem] text-red-500">{error}</p>}
    </div>
  );
}
