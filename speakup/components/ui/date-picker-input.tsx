import React from "react";

interface DatePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function DatePickerInput({
  value,
  onChange,
  className = "",
}: DatePickerInputProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-12 px-3 rounded-lg bg-white border border-violet-200 text-neutral-900 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300 w-44 placeholder:text-neutral-500 ${className}`}
      style={{ colorScheme: 'light' }}
    />
  );
}