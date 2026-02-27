"use client";

import { type ButtonHTMLAttributes } from "react";

interface BrutalistButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<NonNullable<BrutalistButtonProps["size"]>, string> = {
  sm: "px-3 py-1 text-sm",
  md: "px-5 py-2 text-base",
  lg: "px-8 py-3 text-lg",
};

const variantClasses: Record<
  NonNullable<BrutalistButtonProps["variant"]>,
  string
> = {
  primary:
    "bg-[#fe5733] text-black border-[3px] border-black shadow-[4px_4px_0_0_#000]",
  secondary:
    "bg-transparent text-[#fe5733] border-[3px] border-[#fe5733] shadow-[4px_4px_0_0_#fe5733]",
};

export default function BrutalistButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: BrutalistButtonProps) {
  return (
    <button
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        cursor-pointer rounded-none font-bold uppercase
        transition-all
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
