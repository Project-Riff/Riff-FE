"use client";

import { useEffect } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getScrollableParent(element: Element | null) {
  let current = element;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const canScroll =
      /(auto|scroll)/.test(style.overflowY) &&
      current.scrollHeight > current.clientHeight;

    if (canScroll) return current;

    current = current.parentElement;
  }

  return null;
}

export default function SmoothPageScroll() {
  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!media.matches || reducedMotion.matches) return;

    let frame = 0;
    let targetY = window.scrollY;
    let isAnimating = false;

    const root = document.documentElement;
    const body = document.body;
    const previousRootBehavior = root.style.scrollBehavior;
    const previousBodyBehavior = body.style.scrollBehavior;

    root.style.scrollBehavior = "auto";
    body.style.scrollBehavior = "auto";

    const getMaxScroll = () =>
      Math.max(root.scrollHeight - window.innerHeight, 0);

    const animate = () => {
      const currentY = window.scrollY;
      const distance = targetY - currentY;

      if (Math.abs(distance) < 0.6) {
        window.scrollTo(0, targetY);
        frame = 0;
        isAnimating = false;
        return;
      }

      window.scrollTo(0, currentY + distance * 0.13);
      frame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (frame) return;

      isAnimating = true;
      frame = window.requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }

      isAnimating = false;
      targetY = window.scrollY;
    };

    const getWheelDelta = (event: WheelEvent) => {
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        return event.deltaY * 36;
      }

      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        return event.deltaY * window.innerHeight;
      }

      return event.deltaY;
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey) return;

      const target = event.target instanceof Element ? event.target : null;

      if (
        target?.closest(
          "textarea, select, input, [contenteditable='true'], [data-native-scroll]",
        )
      ) {
        return;
      }

      if (getScrollableParent(target)) return;

      event.preventDefault();

      targetY = clamp(targetY + getWheelDelta(event) * 0.92, 0, getMaxScroll());
      startAnimation();
    };

    const syncTarget = () => {
      if (!isAnimating) {
        targetY = window.scrollY;
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", syncTarget, { passive: true });
    window.addEventListener("resize", syncTarget);
    window.addEventListener("ryff:snap-scroll", stopAnimation);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      root.style.scrollBehavior = previousRootBehavior;
      body.style.scrollBehavior = previousBodyBehavior;
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", syncTarget);
      window.removeEventListener("resize", syncTarget);
      window.removeEventListener("ryff:snap-scroll", stopAnimation);
    };
  }, []);

  return null;
}
