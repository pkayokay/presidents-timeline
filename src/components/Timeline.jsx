import { useCallback, useEffect, useRef } from 'react'
import PresidentCard from './PresidentCard.jsx'
import './Timeline.css'

export default function Timeline({ presidents, onSelect, selectedNumber }) {
  const scrollRef = useRef(null)

  const scrollByCards = useCallback((dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * 264 * 2, behavior: 'smooth' })
  }, [])

  // arrow-key navigation of the ribbon
  useEffect(() => {
    const onKey = (e) => {
      if (selectedNumber != null) return // detail view handles its own keys
      if (e.key === 'ArrowRight') {
        scrollByCards(1)
      } else if (e.key === 'ArrowLeft') {
        scrollByCards(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scrollByCards, selectedNumber])

  // Translate wheel into horizontal scroll. Snap is turned off for the
  // gesture: while it is on, the browser drops a scrollLeft write that does
  // not reach the next card, and a steady trackpad stream never moves.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let target = null
    let raf = 0
    let idle = 0
    const settle = () => {
      idle = 0
      target = null
      el.classList.remove('is-scrolling')
    }
    const flush = () => {
      raf = 0
      if (target == null) return
      el.scrollLeft = target
    }
    const onWheel = (e) => {
      if (e.ctrlKey) return // pinch-zoom
      const scale = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? el.clientWidth : 1
      const dx = e.deltaX * scale
      const dy = e.deltaY * scale
      const delta = Math.abs(dy) > Math.abs(dx) ? dy : dx
      if (!delta) return
      const max = Math.max(0, el.scrollWidth - el.clientWidth)
      const current = target == null ? el.scrollLeft : target
      const next = Math.min(max, Math.max(0, current + delta))
      if (Math.abs(next - current) < 0.5) return
      e.preventDefault()
      el.classList.add('is-scrolling')
      target = next
      if (!raf) raf = requestAnimationFrame(flush)
      clearTimeout(idle)
      idle = setTimeout(settle, 150)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (raf) cancelAnimationFrame(raf)
      clearTimeout(idle)
      el.classList.remove('is-scrolling')
    }
  }, [])

  // pointer drag-to-scroll (suppresses the click when actually dragged).
  // Listen on window so the drag keeps going after the pointer leaves the ribbon.
  const drag = useRef({
    down: false,
    pointerType: 'mouse',
    fromCard: false,
    cardNumber: null,
    axis: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    moved: false,
    target: 0,
    raf: 0,
  })
  const stopDrag = useRef(null)
  useEffect(() => () => stopDrag.current?.(), [])
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const el = scrollRef.current
    if (!el) return
    const barH = el.offsetHeight - el.clientHeight
    // Let a real scrollbar use native dragging.
    if (
      e.pointerType === 'mouse' &&
      barH > 0 &&
      e.clientY >= el.getBoundingClientRect().top + el.clientHeight
    ) {
      return
    }

    stopDrag.current?.()
    const card = e.target.closest?.('.pres-card')
    const point = drag.current
    point.down = true
    point.pointerType = e.pointerType
    point.fromCard = !!card
    point.cardNumber = card ? Number(card.dataset.president) : null
    point.axis = null
    point.startX = e.clientX
    point.startY = e.clientY
    point.startLeft = el.scrollLeft
    point.moved = false
    point.target = el.scrollLeft
    const manual = e.pointerType === 'mouse' || e.pointerType === 'pen'
    if (manual) {
      el.classList.add('is-dragging')
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        // The pointer can already be gone. Window listeners still track it.
      }
    }

    const scrollTo = (left) => {
      point.target = left
      const node = scrollRef.current
      if (node) node.classList.add('is-dragging')
      if (point.raf) return
      point.raf = requestAnimationFrame(() => {
        point.raf = 0
        const current = scrollRef.current
        if (current) current.scrollLeft = point.target
      })
    }
    const move = (ev) => {
      if (!point.down) return
      const dx = ev.clientX - point.startX
      const dy = ev.clientY - point.startY
      if (Math.hypot(dx, dy) > 6) point.moved = true
      // Touch drag-from-card is handled on touchmove, where preventDefault
      // can cancel the button's native pan. A vertical swipe stays native
      // so the page can still scroll.
      if (ev.pointerType !== 'mouse' && ev.pointerType !== 'pen') return
      scrollTo(point.startLeft - dx)
    }
    const onTouchMove = (ev) => {
      if (!point.down || !point.fromCard) return
      const t = ev.touches[0]
      if (!t) return
      const dx = t.clientX - point.startX
      const dy = t.clientY - point.startY
      if (!point.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        point.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
      }
      if (Math.hypot(dx, dy) > 6) point.moved = true
      if (point.axis !== 'x') return
      ev.preventDefault()
      scrollTo(point.startLeft - dx)
    }
    const up = (ev) => {
      const openNumber =
        ev?.type === 'pointerup' &&
        !point.moved &&
        (point.pointerType === 'mouse' || point.pointerType === 'pen')
          ? point.cardNumber
          : null
      point.down = false
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.removeEventListener('touchmove', onTouchMove)
      stopDrag.current = null
      scrollRef.current?.classList.remove('is-dragging')
      if (ev?.pointerId != null && el.hasPointerCapture?.(ev.pointerId)) {
        el.releasePointerCapture(ev.pointerId)
      }
      // Capture keeps the press on the ribbon, so the card's click never fires.
      // Open it here, and swallow the click that follows so it can't hit the
      // new backdrop and close the modal.
      if (openNumber == null) return
      const president = presidents.find((p) => p.number === openNumber)
      if (!president) return
      onSelect(president)
      const swallow = (clickEv) => {
        clickEv.preventDefault()
        clickEv.stopPropagation()
        window.removeEventListener('click', swallow, true)
      }
      window.addEventListener('click', swallow, true)
      setTimeout(() => window.removeEventListener('click', swallow, true), 400)
    }
    stopDrag.current = up
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    el.addEventListener('touchmove', onTouchMove, { passive: false })
  }
  const onSelectGuarded = (p) => {
    if (drag.current.moved) return // was a drag, not a click
    onSelect(p)
  }

  return (
    <div className="timeline">
      <button
        className="timeline__arrow timeline__arrow--left"
        onClick={() => scrollByCards(-1)}
        aria-label="Scroll to earlier presidents"
      >
        ‹
      </button>

      <div
        className="timeline-scroll"
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="timeline__ribbon">
          {presidents.map((p) => (
            <PresidentCard
              key={p.number}
              president={p}
              onSelect={onSelectGuarded}
            />
          ))}
        </div>
        <div className="timeline__rule" aria-hidden="true">
          {presidents.map((p) => (
            <div className="timeline__tick" key={p.number}>
              <span className="timeline__tick-year">{p.termStart}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        className="timeline__arrow timeline__arrow--right"
        onClick={() => scrollByCards(1)}
        aria-label="Scroll to later presidents"
      >
        ›
      </button>
    </div>
  )
}
