"use client";

import { useCallback, useEffect, useState } from "react";

export interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

interface StatusBarProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export default function StatusBar({ toasts, onDismiss }: StatusBarProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const colors = {
    success: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200",
    error: "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/60 dark:text-red-200",
    info: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-200",
  };

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      } ${colors[toast.type]}`}
      role="alert"
    >
      <span className="shrink-0 text-sm font-bold mt-0.5">{icons[toast.type]}</span>
      <p className="text-sm leading-snug flex-1">{toast.message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer text-sm"
        aria-label="关闭"
      >
        ×
      </button>
    </div>
  );
}

// Toast manager hook
let toastId = 0;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
