"use client";

import * as React from "react";
import { ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "#comparison", label: "Comparison" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#playground", label: "Live Demo" },
  { href: "#report", label: "Readiness Report" },
];

interface NavbarProps {
  onOpenStartModal: () => void;
}

export function Navbar({ onOpenStartModal }: NavbarProps) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 px-4 py-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        <nav
          className={`flex items-center justify-between rounded-2xl px-5 py-3 transition-all duration-500 md:px-6 ${
            scrolled
              ? "border border-primary/10 bg-background/90 shadow-2xl backdrop-blur-xl"
              : "border border-transparent bg-transparent"
          }`}
        >
          {/* Left: MockMate Logo */}
          <a href="#" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-secondary font-display text-sm font-bold text-foreground shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-primary/40 group-hover:shadow-[0_0_16px_rgba(31,209,106,0.15)]">
              M
            </div>
            <span className="font-display text-base font-semibold tracking-tight text-foreground">
              MockMate
            </span>
          </a>

          {/* Center: Essential Nav Links */}
          <ul className="hidden items-center gap-8 text-[13px] tracking-wide text-muted-foreground md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="relative py-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          {/* Right: Start Interview CTA */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Button size="sm" onClick={onOpenStartModal}>
              Start Practice
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Mobile Toggle */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-border bg-background">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-6">
                {NAV_LINKS.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <a
                      href={link.href}
                      className="rounded-lg px-2 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <div className="mt-3 flex w-full items-center justify-between rounded-lg border border-border px-2 py-3">
                    <span className="text-sm text-muted-foreground">Theme</span>
                    <ThemeToggle />
                  </div>
                </SheetClose>
                <SheetClose asChild>
                  <Button className="mt-3 w-full" onClick={onOpenStartModal}>
                    Start Practice
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}
