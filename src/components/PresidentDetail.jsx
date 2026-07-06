import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { partyColor, termLabel } from '../party.js'
import './PresidentDetail.css'

export default function PresidentDetail({ president, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const accent = partyColor(president.party)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft' && hasPrev) onPrev()
      else if (e.key === 'ArrowRight' && hasNext) onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext, hasPrev, hasNext])

  return (
    <motion.div
      className="detail-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.article
        className="detail-card"
        style={{ '--accent': accent }}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      >
        <button className="detail-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="detail-grid">
          <motion.div className="detail-frame" layoutId={`frame-${president.number}`}>
            <img
              className="detail-img"
              src={`/portraits/${president.portrait}`}
              alt={`Portrait of ${president.name}`}
              draggable={false}
            />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              className="detail-body"
              key={president.number}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28 }}
            >
              <div className="detail-ordinal">
                {ordinal(president.number)} President of the United States
              </div>
              <h2 className="detail-name">{president.name}</h2>
              <div className="detail-rule" />
              <dl className="detail-facts">
                <div>
                  <dt>Term</dt>
                  <dd>{termLabel(president)}</dd>
                </div>
                <div>
                  <dt>Party</dt>
                  <dd>
                    <span className="detail-party">{president.party}</span>
                  </dd>
                </div>
                <div>
                  <dt>Lifespan</dt>
                  <dd>{president.lifespan}</dd>
                </div>
              </dl>
              <p className="detail-bio">{president.bio}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <nav className="detail-nav">
          <button onClick={onPrev} disabled={!hasPrev} aria-label="Previous president">
            ‹ Predecessor
          </button>
          <span className="detail-nav__seal">★</span>
          <button onClick={onNext} disabled={!hasNext} aria-label="Next president">
            Successor ›
          </button>
        </nav>
      </motion.article>
    </motion.div>
  )
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
