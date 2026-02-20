import { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/60 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur transition-colors dark:border-slate-700/70 dark:bg-slate-900/75 dark:shadow-[0_16px_48px_rgba(2,6,23,0.45)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
