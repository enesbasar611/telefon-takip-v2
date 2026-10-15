"use client"

import { useEffect } from "react"

/**
 * ScrollFocusGuard
 * ----------------
 * App-wide safety net that keeps the scroll position stable while the user
 * is typing in a form field:
 *  - If a scroll container suddenly jumps to the top while a field inside it
 *    is focused (re-render, state update, keyboard open, layout shift) and the
 *    user did NOT scroll themselves, the previous position is restored.
 *  - When the mobile keyboard opens/closes (visualViewport resize), the focused
 *    field is kept in view with minimal movement (block: "nearest").
 */
const FIELD_SELECTOR = "input, textarea, select, [contenteditable='true']"
const USER_SCROLL_GRACE_MS = 400
const JUMP_THRESHOLD_PX = 80

function isField(el: Element | null): el is HTMLElement {
  return !!el && el instanceof HTMLElement && el.matches(FIELD_SELECTOR)
}

function getScrollParents(el: HTMLElement): HTMLElement[] {
  const parents: HTMLElement[] = []
  let node = el.parentElement
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      parents.push(node)
    }
    node = node.parentElement
  }
  return parents
}

export function ScrollFocusGuard() {
  useEffect(() => {
    let lastUserScroll = 0
    let tracked: { el: HTMLElement; top: number }[] = []
    let raf = 0

    const markUserScroll = () => {
      lastUserScroll = performance.now()
    }

    const snapshot = () => {
      tracked.forEach((t) => {
        t.top = t.el.scrollTop
      })
    }

    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement
      const entry = tracked.find((t) => t.el === target)
      if (!entry) return
      const active = document.activeElement
      const userInitiated = performance.now() - lastUserScroll < USER_SCROLL_GRACE_MS
      const jumpedToTop = target.scrollTop < 4 && entry.top > JUMP_THRESHOLD_PX

      if (!userInitiated && jumpedToTop && isField(active) && target.contains(active)) {
        const restoreTo = entry.top
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          target.scrollTop = restoreTo
        })
        return
      }
      entry.top = target.scrollTop
    }

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as Element
      if (!isField(target)) return
      tracked = getScrollParents(target).map((el) => ({ el, top: el.scrollTop }))
    }

    const onFocusOut = () => {
      // Defer so focus moving between fields keeps the snapshot
      setTimeout(() => {
        if (!isField(document.activeElement)) tracked = []
      }, 0)
    }

    const onViewportResize = () => {
      const active = document.activeElement
      if (!isField(active)) return
      requestAnimationFrame(() => {
        active.scrollIntoView({ block: "nearest", inline: "nearest" })
        snapshot()
      })
    }

    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("focusout", onFocusOut)
    document.addEventListener("scroll", onScroll, { capture: true, passive: true })
    window.addEventListener("wheel", markUserScroll, { passive: true })
    window.addEventListener("touchmove", markUserScroll, { passive: true })
    const onKeyDown = (e: KeyboardEvent) => {
      if (["PageUp", "PageDown", "Home", "End"].includes(e.key) && !isField(document.activeElement)) markUserScroll()
    }
    window.addEventListener("keydown", onKeyDown)
    window.visualViewport?.addEventListener("resize", onViewportResize)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("focusout", onFocusOut)
      document.removeEventListener("scroll", onScroll, { capture: true } as EventListenerOptions)
      window.removeEventListener("wheel", markUserScroll)
      window.removeEventListener("touchmove", markUserScroll)
      window.removeEventListener("keydown", onKeyDown)
      window.visualViewport?.removeEventListener("resize", onViewportResize)
    }
  }, [])

  return null
}
