"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: number;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; //ms
};

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.toast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const counter = useRef(1);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = counter.current++;
    const duration = t.duration ?? 3000;
    const item: Toast = { id, ...t };
    setItems((prev) => [...prev, item]);
    window.setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), duration);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onClose={(id) => setItems((prev) => prev.filter((i) => i.id !== id))} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ items, onClose }: { items: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "min-w-[260px] max-w-[360px] rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm",
            "bg-card/80 text-foreground border-white/15",
            t.variant === "success" && "border-emerald-300/40",
            t.variant === "error" && "border-red-400/50",
            t.variant === "info" && "border-blue-300/40",
          )}
        >
          {t.title ? <div className="text-sm font-semibold leading-5">{t.title}</div> : null}
          {t.description ? (
            <div className="mt-0.5 text-xs text-foreground/80 leading-5">{t.description}</div>
          ) : null}
          <button
            aria-label="Close"
            className="absolute right-2 top-2 text-xs text-foreground/60 hover:text-foreground"
            onClick={() => onClose(t.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

