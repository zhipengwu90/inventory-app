"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

type Toast = { id: number; kind: "success" | "error"; message: string };

const ToastContext = createContext<
  (kind: Toast["kind"], message: string) => void
>(() => {});

/**
 * Shows a short message at the top of the screen, like the iOS app's toast.
 * The returned object is stable, so it's safe in effect and callback deps.
 */
export const useToast = () => {
  const show = useContext(ToastContext);
  return useMemo(
    () => ({
      success: (message: string) => show("success", message),
      error: (message: unknown) =>
        show(
          "error",
          message instanceof Error
            ? message.message
            : String(message ?? "Something went wrong"),
        ),
    }),
    [show],
  );
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const show = useCallback((kind: Toast["kind"], message: string) => {
    const id = Date.now();
    setToast({ id, kind, message });
    setTimeout(
      () => setToast((current) => (current?.id === id ? null : current)),
      kind === "error" ? 5000 : 2500,
    );
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[2000] flex justify-center px-6"
        aria-live="polite"
      >
        {toast && (
          <button
            key={toast.id}
            onClick={() => setToast(null)}
            className="pointer-events-auto flex max-w-md items-center gap-2 rounded-full bg-white/90 px-4 py-3 text-sm font-medium shadow-lg ring-1 ring-black/5 backdrop-blur animate-in fade-in slide-in-from-top-4"
          >
            {toast.kind === "error" ? (
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-brand" />
            )}
            <span className="text-left">{toast.message}</span>
          </button>
        )}
      </div>
    </ToastContext.Provider>
  );
}
