import { useEffect, useRef, useCallback } from 'react';
import { getAnimationsEnabled } from '../utils/storage/animations';

interface ScrollRevealOptions {
    threshold?: number;
    rootMargin?: string;
    once?: boolean;
}

/**
 * Custom hook for scroll-triggered reveal animations.
 * Adds 'revealed' class when element enters viewport.
 * Respects prefers-reduced-motion and localStorage toggle.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
    options: ScrollRevealOptions = {}
) {
    const { threshold = 0.15, rootMargin = '0px 0px -50px 0px', once = true } = options;
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Check if animations are disabled
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced || !getAnimationsEnabled()) {
            el.classList.add('revealed');
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        if (once) observer.unobserve(entry.target);
                    }
                });
            },
            { threshold, rootMargin }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold, rootMargin, once]);

    return ref;
}

/**
 * Hook for stagger-animated children.
 * Observes parent, then staggers children with CSS custom property delays.
 */
export function useStaggerReveal<T extends HTMLElement = HTMLDivElement>(
    options: ScrollRevealOptions & { staggerDelay?: number } = {}
) {
    const { staggerDelay = 80, threshold = 0.1, rootMargin = '0px 0px -30px 0px', once = true } = options;
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced || !getAnimationsEnabled()) {
            el.classList.add('revealed');
            Array.from(el.children).forEach(child => {
                (child as HTMLElement).style.setProperty('--sr-delay', '0ms');
            });
            return;
        }

        // Set stagger delays on children
        Array.from(el.children).forEach((child, i) => {
            (child as HTMLElement).style.setProperty('--sr-delay', `${i * staggerDelay}ms`);
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        if (once) observer.unobserve(entry.target);
                    }
                });
            },
            { threshold, rootMargin }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [staggerDelay, threshold, rootMargin, once]);

    return ref;
}
