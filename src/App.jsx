import { useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import presidents from './data/presidents.js'
import Timeline from './components/Timeline.jsx'
import PresidentDetail from './components/PresidentDetail.jsx'
import './App.css'

export default function App() {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const selected = selectedIndex == null ? null : presidents[selectedIndex]

  const select = useCallback((p) => {
    setSelectedIndex(presidents.findIndex((x) => x.number === p.number))
  }, [])
  const close = useCallback(() => setSelectedIndex(null), [])
  const prev = useCallback(() => setSelectedIndex((i) => (i > 0 ? i - 1 : i)), [])
  const next = useCallback(
    () => setSelectedIndex((i) => (i < presidents.length - 1 ? i + 1 : i)),
    [],
  )

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead__ornament">✦ ✦ ✦</div>
        <h1 className="masthead__title">Presidents of the United States</h1>
        <div className="masthead__subtitle">An Illustrated Archive · 1789 – Present</div>
        <div className="masthead__rule" />
        <p className="masthead__hint">
          Scroll the timeline — drag, use the arrows, or the ← → keys — then select a portrait to
          study it closely.
        </p>
      </header>

      <main className="stage">
        <Timeline
          presidents={presidents}
          onSelect={select}
          selectedNumber={selected?.number ?? null}
        />
      </main>

      <footer className="colophon">
        {presidents.length} presidencies · Portraits from public-domain works · No. 1 George
        Washington to No. {presidents[presidents.length - 1].number}{' '}
        {presidents[presidents.length - 1].name}
      </footer>

      <AnimatePresence>
        {selected && (
          <PresidentDetail
            key="detail"
            president={selected}
            onClose={close}
            onPrev={prev}
            onNext={next}
            hasPrev={selectedIndex > 0}
            hasNext={selectedIndex < presidents.length - 1}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
