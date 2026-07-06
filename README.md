# Presidents of the United States — An Illustrated Archive

An interactive, historical-styled archive of all **47 U.S. presidencies**, from
George Washington (1789) to the present. Scroll a parchment-and-gold timeline of
framed portraits, then click any president to zoom into a detail card with a short
biography, term, party, and lifespan.

Built with **React + Vite** and **Framer Motion**. Everything runs locally — no
backend and no runtime network calls. Portraits (public-domain works from Wikimedia)
and fonts are bundled in the repo.

## Features

- **Horizontal timeline ribbon** with an era ruler — scroll by dragging, mouse wheel,
  the on-screen `‹ ›` arrows, or the `←` / `→` keys.
- **Click to zoom** — a shared-layout morph expands the selected portrait into a full
  detail card. Walk the roster with **Predecessor / Successor** buttons or arrow keys;
  close with **✕**, **Esc**, or a click outside.
- **Aged-parchment aesthetic** — sepia-toned portraits in ornate gold frames, self-hosted
  Playfair Display + EB Garamond, textured parchment background.
- **All 47 presidencies**, including Grover Cleveland (#22 & #24) and Donald Trump
  (#45 & #47) as separate non-consecutive terms.
- **Smooth performance** — off-screen cards use `content-visibility`, and scroll writes
  are batched per animation frame.

## Prerequisites

- **Node.js 18+** (uses the built-in `fetch` in the portrait script) and npm.

## Setup & running

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open the URL Vite prints (default **http://localhost:5173/**).

That's it — the portraits and fonts are already committed to the repo, so the app
works immediately and offline. There is no separate download or build step required
to develop.

## Production build

```bash
npm run build      # outputs static files to dist/
npm run preview    # serve the built site locally to check it
```

The contents of `dist/` are fully static and can be hosted on any static file host.

## Refreshing portraits & fonts (optional)

The portraits in `public/portraits/` and fonts in `public/fonts/` are already included.
If you ever want to re-download them (e.g. to update an image), run:

```bash
npm run fetch:portraits
```

This resolves each portrait through the Wikipedia `pageimages` API and downloads a
~700px-wide thumbnail, plus the self-hosted font files. It is idempotent — files that
already exist are skipped, so it is safe to re-run.

## Project structure

```
presidents/
├─ index.html                     # Vite entry
├─ vite.config.js
├─ scripts/
│  └─ fetch-portraits.mjs         # downloads portraits + fonts into public/
├─ public/
│  ├─ portraits/*.jpg             # bundled public-domain portraits
│  └─ fonts/*                     # self-hosted woff2 + fonts.css
└─ src/
   ├─ main.jsx
   ├─ App.jsx / App.css           # layout, masthead, selection state
   ├─ index.css                   # parchment theme, CSS variables, fonts
   ├─ party.js                    # party colors + term label helper
   ├─ data/presidents.js          # the 47 entries + bios
   └─ components/
      ├─ Timeline.jsx / .css       # scrollable ribbon + ruler
      ├─ PresidentCard.jsx / .css  # framed portrait card
      └─ PresidentDetail.jsx / .css# zoomed detail overlay
```

## Editing the data

All content lives in [`src/data/presidents.js`](src/data/presidents.js). Each entry has
`number`, `name`, `party`, `termStart`, `termEnd`, `lifespan`, `wiki` (Wikipedia page
title used by the fetch script), `portrait` (filename in `public/portraits/`), and `bio`.
Add or edit entries there; party accent colors are defined in
[`src/party.js`](src/party.js).

## Tech

- [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- [Framer Motion](https://www.framer.com/motion/) for the shared-layout zoom animation
- Fonts: Playfair Display & EB Garamond (self-hosted, SIL Open Font License)
- Portraits: public-domain works via [Wikimedia Commons](https://commons.wikimedia.org/)
