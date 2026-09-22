import { Link } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";

const links = [
  { to: "/investigate", label: "Globe" },
  { to: "/cases", label: "Detective Cases" },
  { to: "/detective-mode", label: "Detective Mode" },
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Globe2 className="size-4 text-primary" />
          <span className="text-display text-sm tracking-wide">
            Living Earth<span className="text-muted-foreground"> / Trend Detective</span>
          </span>
        </Link>
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
