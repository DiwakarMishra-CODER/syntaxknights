"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Fade-up reveal triggered by scroll. */
export function useScrollReveal<T extends HTMLElement>(
  options?: { delay?: number; y?: number; duration?: number; stagger?: number }
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ctx = gsap.context(() => {
      // If the element has children with [data-reveal], stagger them
      const children = el.querySelectorAll("[data-reveal]");
      const targets = children.length > 0 ? children : el;

      gsap.fromTo(
        targets,
        {
          y: options?.y ?? 50,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: options?.duration ?? 0.9,
          delay: options?.delay ?? 0,
          stagger: options?.stagger ?? 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "bottom 20%",
            toggleActions: "play none none none",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [options?.delay, options?.y, options?.duration, options?.stagger]);

  return ref;
}

/** Scale-up reveal for cards/images. */
export function useScrollScale<T extends HTMLElement>(options?: {
  delay?: number;
  scale?: number;
  duration?: number;
}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scale: options?.scale ?? 0.9, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: options?.duration ?? 1,
          delay: options?.delay ?? 0,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [options?.delay, options?.scale, options?.duration]);

  return ref;
}

/** Horizontal text split reveal. */
export function useTextReveal<T extends HTMLElement>(options?: {
  delay?: number;
}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          clipPath: "inset(0 100% 0 0)",
          opacity: 0,
        },
        {
          clipPath: "inset(0 0% 0 0)",
          opacity: 1,
          duration: 1.2,
          delay: options?.delay ?? 0,
          ease: "power4.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [options?.delay]);

  return ref;
}

/** Parallax vertical shift on scroll. */
export function useParallax<T extends HTMLElement>(speed: number = 0.15) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: speed * 100,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [speed]);

  return ref;
}
