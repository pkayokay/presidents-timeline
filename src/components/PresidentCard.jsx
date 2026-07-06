import { motion } from 'framer-motion'
import { partyColor, termLabel } from '../party.js'
import './PresidentCard.css'

export default function PresidentCard({ president, onSelect, hidden }) {
  const accent = partyColor(president.party)
  return (
    <motion.button
      type="button"
      id={`pc-${president.number}`}
      className="pres-card"
      onClick={() => onSelect(president)}
      // hide the source card while its detail overlay is open so the shared
      // layout element doesn't appear twice
      style={{ visibility: hidden ? 'hidden' : 'visible', '--accent': accent }}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      aria-label={`${president.name}, president number ${president.number}`}
    >
      <div className="pres-card__inner">
        <div className="pres-card__ordinal">
          <span>{president.number}</span>
        </div>
        <motion.div className="pres-card__frame" layoutId={`frame-${president.number}`}>
          <img
            className="pres-card__img"
            src={`/portraits/${president.portrait}`}
            alt={`Portrait of ${president.name}`}
            loading="lazy"
            draggable={false}
          />
        </motion.div>
        <div className="pres-card__plate">
          <h3 className="pres-card__name">{president.name}</h3>
          <div className="pres-card__years">{termLabel(president)}</div>
          <div className="pres-card__party">{president.party}</div>
        </div>
      </div>
    </motion.button>
  )
}
