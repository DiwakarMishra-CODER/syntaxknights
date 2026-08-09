# Landing Page — Premium Rebuild (Revised)

## Context / feedback pivot
First pass did a "full shadcn rebuild" but **over-stripped**: removed all motion and the 3D hero, and the headline type scale overflowed (`clamp(3rem,6vw,5.5rem)` + `max-w-md` on the left column) so fonts "felt big and didn't fit." User wants the **premium feel back** — animations, complete user journey, professional type — while still loading fast.

Competitor research (Final Round AI, Hello Interview, interviewing.io) shows the premium pattern is: one neutral sans with weight/size hierarchy (NOT multiple decorative display fonts), headlines **constrained to a max-width**, generous vertical rhythm, trust signals (logo/stats/testimonials/FAQ), and subtle scroll-reveal + hover motion — *not* heavy 3D everywhere.

## Locked decisions
1. **Hero = 3D again**, but **lazy-loaded** via `next/dynamic` (`ssr:false`, `loading:` skeleton) so three.js is a separate chunk and does NOT block first paint / LCP. Optionally mount only when hero is near viewport (IntersectionObserver) to skip it on mobile/low-power.
2. **Fonts: Inter (body/UI) + Geist (display).** Remove Sora + Silkscreen + JetBrains Mono. Geist via the `geist` package (self-hosted, no runtime network, no FOUT).
3. **Motion: lightweight & performant** — a `Reveal` component (IntersectionObserver + CSS transform/opacity, staggered via `transition-delay`), hover lifts, keep the live depth-ladder. No framer-motion added to the landing. All motion gated by `prefers-reduced-motion` (reveal = visible immediately).
4. **shadcn components stay** (Button, Card, Badge, Sheet, Separator) + add **Accordion** (FAQ). This satisfies "shadcn only" — animation is a separate concern, not a component lib.
5. **No Preloader** (keeps load fast). Add a subtle hero-content entrance via `Reveal`.

## Typography system (fixes "big / doesn't fit / unprofessional")
In `globals.css` `@layer utilities`, define a single consistent scale and force every landing heading onto it:
```
.font-display   { font-family: var(--font-display); }   /* Geist */
.text-hero      { font-size: clamp(2.5rem, 5vw, 4.25rem); line-height: 1.04; letter-spacing: -0.02em; }
.text-section   { font-size: clamp(2rem, 4vw, 3rem);      line-height: 1.08; letter-spacing: -0.02em; }
.text-card-title{ font-size: 1.5rem;                      line-height: 1.25; letter-spacing: -0.01em; }
.text-eyebrow   { font-size: 0.75rem; letter-spacing: 0.18em; }
```
- Body = Inter (`font-sans`), `text-[15px] sm:text-base`, `leading-relaxed`.
- Headings use `font-display text-hero|text-section|...` and a **constrained `max-w`** (hero `max-w-2xl`, section `max-w-3xl mx-auto text-center`) so long words ("AI Interviewer") wrap instead of overflowing.
- `--font-display: var(--font-geist-sans), "Geist", system-ui, sans-serif;` (GeistSans default var is `--font-geist-sans`).
- `--font-sans: var(--font-inter), Inter, system-ui, sans-serif;` (rename Inter's var to `--font-inter` to avoid clash with Geist).

## Animation system
- New `src/components/landing/Reveal.tsx` (client): wraps children, toggles `.is-visible` on intersection; accepts `delay` + `as`. CSS in `globals.css`:
```
.reveal { opacity:0; transform: translateY(24px); transition: opacity .7s var(--ease-out-expo), transform .7s var(--ease-out-expo); }
.reveal.is-visible { opacity:1; transform:none; }
@media (prefers-reduced-motion: reduce){ .reveal{opacity:1;transform:none;transition:none;} }
```
- Apply `Reveal` to each section header + card grid (stagger via `style={{transitionDelay}}`). Card hover: `hover:-translate-y-1 hover:border-primary/30 hover:shadow-...` (already present).
- Hero: re-add `<MockMateHeroScene/>` via `dynamic(() => import("@/components/three/MockMateHeroScene"), { ssr:false, loading: () => <skeleton/> })`. Fix its internal `font-pixel` usages → `font-display` (Silkscreen is being removed).
- Keep CSS ambient gradients (already present) — cheap, premium.

## Sections / user journey (complete experience)
Keep flow: Navbar → Hero(3D) → **trust strip** → AdaptiveFlow → InterviewDemo → ReadinessReport → FinalCTA → **FAQ accordion** → Footer.
- **Trust strip** (new, after hero): slim band — "31-day AI cohort · Adaptive follow-ups · Evidence-backed report · Respects reduced motion" as 3–4 stat/feature chips (shadcn `Badge`/muted text). Adds the social-proof rhythm competitors use.
- **FAQ accordion** (new, before footer): shadcn `Accordion` — 4–5 Q&As derived from the product (How is it adaptive? Is my data private? What does the report contain? Do you call the API during the demo?).

## Files
- Install: `geist`, `@radix-ui/react-accordion`.
- `src/app/layout.tsx`: swap Sora→Inter(rename var `--font-inter`) + `GeistSans`; html className includes both vars; keep `dark`.
- `src/app/globals.css`: retune `--font-display`/`--font-sans`; add type-scale utilities + `.reveal` CSS; `--font-editorial` kept for dashboard/mockmate.
- `src/components/landing/Reveal.tsx` (new).
- `src/components/landing/Hero.tsx`: dynamic 3D hero + `Reveal` + constrained headline `max-w-2xl` + `font-display text-hero`.
- `src/components/landing/AdaptiveFlow.tsx`, `InterviewDemo.tsx`, `ReadinessReport.tsx`, `FinalCTA.tsx`, `Navbar.tsx`, `Footer.tsx`: wrap headers/cards in `Reveal`; switch headings to `font-display text-section`/`text-card-title`; fix any `max-w-md`→`max-w-2xl`/`max-w-3xl`; ensure grid `items-center`.
- `src/components/landing/TrustStrip.tsx` (new), `Faq.tsx` (new).
- `src/components/three/MockMateHeroScene.tsx`: replace `font-pixel` → `font-display`; verify it works without Silkscreen.
- `src/components/ui/accordion.tsx` (new, shadcn).
- `src/app/page.tsx`: insert `<TrustStrip/>` after Hero, `<Faq/>` before Footer.

## Risks
- 3D scene still adds ~150KB+ JS when it loads; mitigated by `ssr:false` + dynamic chunk + viewport-gated mount. LCP not blocked.
- Geist var name clash with Inter's `--font-geist-sans` → rename Inter var to `--font-inter`.
- `MockMateHeroScene` references removed Silkscreen → must update to `font-display` or it falls back to default (visually off).

## Validation
- `npm run lint`, `npm run typecheck`, `npm run build` pass.
- Visual: inspect at 375 / 768 / 1280px — headlines wrap within container (no horizontal overflow), consistent Inter/Geist across sections, scroll-reveal triggers once per section, hero 3D appears after skeleton, reduced-motion shows everything immediately.
- Perf: `.next` route chunk for `/` no longer contains three.js in the *initial* HTML/JS (three loads as a lazy chunk after mount); LCP not gated by a blocking overlay.
