"use client";
// Small building blocks shared by the Inventory, Shopping, History and Insights pages.
import React from "react";
import Dialog from "@mui/material/Dialog";
import useMediaQuery from "@mui/material/useMediaQuery";
import CircularProgress from "@mui/material/CircularProgress";
import { Minus, Plus } from "lucide-react";
import { colorFor } from "@/app/utils/types";

// MARK: Buttons

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "tinted" | "plain" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Btn({
  variant = "primary",
  size = "md",
  loading,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const variants = {
    primary: "bg-brand text-white shadow-sm hover:bg-brand-dark",
    tinted: "bg-brand/10 text-brand hover:bg-brand/15",
    plain: "text-brand hover:bg-brand/10",
    danger: "bg-red-500/10 text-red-600 hover:bg-red-500/15",
    outline: "bg-white text-gray-900 ring-1 ring-black/10 hover:bg-gray-50",
  };
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-[15px]",
    lg: "h-12 px-6 text-base",
  };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? <CircularProgress size={18} color="inherit" /> : children}
    </button>
  );
}

// MARK: Sheet

/** Dialog with a header bar; full screen on phones, a rounded card on desktop. */
export function Sheet({
  open,
  onClose,
  title,
  left,
  right,
  footer,
  children,
  maxWidth = "sm",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md";
}) {
  const phone = useMediaQuery("(max-width:767px)");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={phone}
      fullWidth
      maxWidth={maxWidth}
      PaperProps={{
        sx: {
          borderRadius: phone ? 0 : "22px",
          bgcolor: "#F2F2F7",
          backgroundImage: "none",
        },
      }}
    >
      <header className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-black/5 bg-[#F2F2F7]/90 px-3 py-2.5 backdrop-blur">
        <div className="justify-self-start">
          {left ?? (
            <Btn variant="plain" size="sm" onClick={onClose}>
              Close
            </Btn>
          )}
        </div>
        <h2 className="truncate text-center text-[17px] font-semibold">
          {title}
        </h2>
        <div className="justify-self-end">{right}</div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      {footer && (
        <div className="sticky bottom-0 border-t border-black/5 bg-[#F2F2F7]/90 px-4 py-3 backdrop-blur">
          {footer}
        </div>
      )}
    </Dialog>
  );
}

/** Small yes/no dialog. */
export function Confirm({
  open,
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onClose,
  extra,
  showCancel = true,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  extra?: React.ReactNode;
  /** Hide when the confirm button already means "stay". */
  showCancel?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: "22px" } }}
    >
      <div className="p-5 text-center">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        <div className="mt-5 flex flex-col gap-2">
          <Btn
            variant={destructive ? "danger" : "primary"}
            onClick={() => {
              onClose();
              onConfirm();
            }}
          >
            {confirmLabel}
          </Btn>
          {extra}
          {showCancel && (
            <Btn variant="plain" onClick={onClose}>
              Cancel
            </Btn>
          )}
        </div>
      </div>
    </Dialog>
  );
}

// MARK: Content

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`rounded-2xl bg-white ${className}`}>{children}</div>;
}

/** iOS-style grouped list: white rounded card with hairline dividers. */
export function Group({
  header,
  footer,
  children,
  className = "",
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {header && (
        <div className="mb-1.5 px-4 text-sm font-semibold text-gray-500">
          {header}
        </div>
      )}
      <div className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white">
        {children}
      </div>
      {footer && (
        <div className="mt-1.5 px-4 text-xs text-gray-500">{footer}</div>
      )}
    </section>
  );
}

export function StatTile({
  icon,
  value,
  label,
  tint,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tint: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className="flex flex-1 flex-col items-start gap-1 rounded-2xl bg-white p-3.5 text-left transition hover:shadow-sm"
      style={active ? { boxShadow: `inset 0 0 0 2px ${tint}` } : undefined}
    >
      <span style={{ color: tint }}>{icon}</span>
      <span className="text-2xl font-bold tabular-nums leading-tight">
        {value}
      </span>
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </Tag>
  );
}

export function Empty({
  icon,
  title,
  message,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <div className="text-gray-400">{icon}</div>
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{message}</p>
      {children && (
        <div className="mt-5 flex flex-col items-center gap-2">{children}</div>
      )}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-24">
      <CircularProgress sx={{ color: "#249E6B" }} />
    </div>
  );
}

/** Item photo with a coloured initial as the fallback. */
export function Thumb({
  name,
  url,
  category,
  size = 44,
  dim,
}: {
  name: string;
  url?: string | null;
  category?: string | null;
  size?: number;
  dim?: boolean;
}) {
  const tint = colorFor(category);
  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: `${tint}26`,
        color: tint,
        fontSize: size * 0.42,
        opacity: dim ? 0.5 : 1,
      }}
      aria-hidden
    >
      {url ? (
        // Supabase public URLs; next/image is configured unoptimized for them anyway.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        name.charAt(0).toUpperCase() || "?"
      )}
    </div>
  );
}

export function Badge({
  children,
  tint,
}: {
  children: React.ReactNode;
  tint: string;
}) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-bold"
      style={{ color: tint, background: `${tint}22` }}
    >
      {children}
    </span>
  );
}

// MARK: Steppers

/** Compact −/value/+ control. */
export function Stepper({
  value,
  onChange,
  min = 0,
  highlighted,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  highlighted?: boolean;
  label?: string;
}) {
  return (
    <div
      className={`flex items-center rounded-full p-0.5 ${highlighted ? "bg-brand/15" : "bg-black/5"}`}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-brand hover:bg-black/5 disabled:text-gray-300"
      >
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>
      <span
        className={`min-w-[2rem] text-center font-semibold tabular-nums ${highlighted ? "text-brand" : ""}`}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(value + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-brand hover:bg-black/5"
      >
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  );
}

/** Large stepper for dialogs. */
export function BigStepper({
  title,
  value,
  onChange,
  min = 0,
}: {
  title: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-sm font-medium text-gray-500">{title}</span>
      <div className="flex items-center gap-7">
        <button
          type="button"
          aria-label={`Decrease ${title}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand shadow-sm ring-1 ring-black/5 disabled:text-gray-300"
        >
          <Minus className="h-6 w-6" strokeWidth={3} />
        </button>
        <span className="min-w-[5rem] text-center text-5xl font-bold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${title}`}
          onClick={() => onChange(value + 1)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand shadow-sm ring-1 ring-black/5"
        >
          <Plus className="h-6 w-6" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

// MARK: Form fields

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-h-[48px] items-center justify-between gap-4 px-4 py-2">
      <span className="shrink-0 text-[15px]">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full min-w-0 bg-transparent text-right text-[15px] outline-none placeholder:text-gray-400";

export const selectClass =
  "min-w-0 max-w-[60%] cursor-pointer bg-transparent text-right text-[15px] text-gray-600 outline-none";
