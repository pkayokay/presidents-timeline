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

  // keep the selected president's (hidden) source card centered so the
  // shared-layout zoom morph originates and returns to a sensible spot
  useEffect(() => {
    if (selectedNumber == null) return
    const el = document.getElementById(`pc-${selectedNumber}`)
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selectedNumber])

  // translate vertical wheel into horizontal scroll for mouse users.
  // Coalesce deltas and apply once per animation frame so fast wheeling
  // doesn't thrash the main thread with a scroll write on every event.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let pending = 0
    let raf = 0
    const flush = () => {
      raf = 0
      el.scrollLeft += pending
      pending = 0
    }
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        pending += e.deltaY
        if (!raf) raf = requestAnimationFrame(flush)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // pointer drag-to-scroll (suppresses the click when actually dragged).
  // The scrollLeft write is batched into an animation frame so flinging the
  // ribbon quickly stays smooth.
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false, target: 0, raf: 0 })
  const applyDrag = () => {
    const el = scrollRef.current
    drag.current.raf = 0
    if (el) el.scrollLeft = drag.current.target
  }
  const onPointerDown = (e) => {
    const el = scrollRef.current
    if (!el) return
    drag.current = {
      down: true,
      startX: e.clientX,
      startLeft: el.scrollLeft,
      moved: false,
      target: el.scrollLeft,
      raf: drag.current.raf,
    }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d.down) return
    const dx = e.clientX - d.startX
    if (Math.abs(dx) > 6) d.moved = true
    d.target = d.startLeft - dx
    if (!d.raf) d.raf = requestAnimationFrame(applyDrag)
  }
  const endDrag = () => {
    drag.current.down = false
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
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <div className="timeline__ribbon">
          {presidents.map((p) => (
            <PresidentCard
              key={p.number}
              president={p}
              onSelect={onSelectGuarded}
              hidden={selectedNumber === p.number}
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
