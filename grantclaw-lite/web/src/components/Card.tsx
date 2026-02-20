import { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/60 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur ${className}`.trim()}
    >
      {children}
    </div>
  );
}
