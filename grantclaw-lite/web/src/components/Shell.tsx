import { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";

const nav = [
  { to: "/generate", label: "Generate" },
  { to: "/preview", label: "Preview" },
  { to: "/submit", label: "Submit" },
  { to: "/feed", label: "Feed" }
];

export function Shell({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold">GrantClaw Lite</h1>
          <nav className="flex gap-2">
            {nav.map((item) => (
              <Link
                className={`rounded-md px-3 py-2 text-sm ${location.pathname.startsWith(item.to) ? "bg-slate-900 text-white" : "bg-slate-100"}`}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}
