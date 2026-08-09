export function Footer() {
  const links = [
    { href: "#comparison", label: "The divergence" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#playground", label: "Playground" },
    { href: "#report", label: "Report" },
  ];

  return (
    <footer className="relative z-10 border-t border-border bg-background py-14 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 sm:flex-row sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-secondary font-display text-sm font-bold text-foreground shadow-sm">
            M
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-semibold tracking-wide text-foreground">
              MockMate
            </span>
            <span className="text-[10px] font-light text-muted-foreground">
              An interviewer that thinks.
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-muted-foreground/60">
          © {new Date().getFullYear()} MockMate Inc.
        </div>
      </div>
    </footer>
  );
}
