// Downloads real public-domain presidential portraits and self-hosted fonts into
// public/ so the running site is fully local (no runtime network calls).
//
//   node scripts/fetch-portraits.mjs
//
// Portraits are resolved through the Wikipedia pageimages API (guessed direct
// upload.wikimedia.org URLs are unreliable). Files already present are skipped.

import { mkdir, writeFile, access, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const portraitsDir = join(root, 'public', 'portraits')
const fontsDir = join(root, 'public', 'fonts')

// Wikimedia asks bots to send a descriptive User-Agent (generic browser UAs get
// aggressively rate-limited). https://meta.wikimedia.org/wiki/User-Agent_policy
const UA = 'PresidentsArchive/1.0 (local educational project; +https://example.com) Node.js'

// how wide the downloaded portrait should be (thumbnails keep files small)
const THUMB_WIDTH = 700

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function exists(path) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

// --- load president list without importing the ESM data module's default styling ---
async function loadPresidents() {
  const mod = await import(join(root, 'src', 'data', 'presidents.js'))
  return mod.default
}

// fetch with automatic retry/backoff on 429 (rate limit) / 503
async function politeFetch(url) {
  let delay = 1200
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.status !== 429 && res.status !== 503) return res
    await sleep(delay)
    delay *= 2
  }
  return fetch(url, { headers: { 'User-Agent': UA } })
}

async function resolvePortraitUrl(wiki) {
  // request a thumbnail of a fixed width to keep files small; fall back to original
  const api =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages' +
    `&piprop=thumbnail|original&pithumbsize=${THUMB_WIDTH}&titles=` +
    encodeURIComponent(wiki)
  const res = await politeFetch(api)
  if (!res.ok) throw new Error(`API ${res.status} for ${wiki}`)
  const data = await res.json()
  const pages = data?.query?.pages ?? {}
  const page = Object.values(pages)[0]
  const src = page?.thumbnail?.source || page?.original?.source
  if (!src) throw new Error(`no image for ${wiki}`)
  return src
}

async function download(url, dest) {
  const res = await politeFetch(url)
  if (!res.ok) throw new Error(`download ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buf)
  return buf.length
}

async function fetchPortraits() {
  await mkdir(portraitsDir, { recursive: true })
  const presidents = await loadPresidents()
  // dedupe by portrait filename (Cleveland/Trump share files)
  const seen = new Set()
  let ok = 0
  let skip = 0
  for (const p of presidents) {
    if (seen.has(p.portrait)) continue
    seen.add(p.portrait)
    const dest = join(portraitsDir, p.portrait)
    if (await exists(dest)) {
      console.log(`  skip  ${p.portrait} (exists)`)
      skip++
      continue
    }
    try {
      const url = await resolvePortraitUrl(p.wiki)
      const bytes = await download(url, dest)
      console.log(`  ok    ${p.portrait}  (${(bytes / 1024).toFixed(0)} KB)`)
      ok++
    } catch (err) {
      console.error(`  FAIL  ${p.portrait}: ${err.message}`)
    }
    await sleep(350) // be polite to Wikimedia
  }
  console.log(`\nPortraits: ${ok} downloaded, ${skip} skipped, ${seen.size} unique.`)
}

// --- fonts: pull woff2 files from Google Fonts CSS and self-host them ---
const FONT_SPECS = [
  {
    family: 'Playfair Display',
    css: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&display=swap',
  },
  {
    family: 'EB Garamond',
    css: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap',
  },
]

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Build an @font-face rule from a downloaded filename of the form
// `${familySlug}-${weight}-${style}-${i}.woff2` (weight/style/i are the last 3 segments).
function faceFromFilename(fname, familyBySlug) {
  const base = fname.replace(/\.woff2$/, '')
  const parts = base.split('-')
  parts.pop() // index
  const style = parts.pop()
  const weight = parts.pop()
  const familySlug = parts.join('-')
  const family = familyBySlug[familySlug] || familySlug
  return (
    `@font-face {\n  font-family: '${family}';\n  font-style: ${style};\n` +
    `  font-weight: ${weight};\n  font-display: swap;\n  src: url('/fonts/${fname}') format('woff2');\n}`
  )
}

async function fetchFonts() {
  await mkdir(fontsDir, { recursive: true })
  const familyBySlug = Object.fromEntries(FONT_SPECS.map((s) => [slug(s.family), s.family]))
  const faces = []

  for (const spec of FONT_SPECS) {
    const prefix = slug(spec.family) + '-'
    const existing = (await readdir(fontsDir)).filter(
      (f) => f.startsWith(prefix) && f.endsWith('.woff2'),
    )
    // if this family's woff2 files are already present, reuse them (offline / idempotent)
    if (existing.length) {
      for (const f of existing.sort()) {
        console.log(`  skip  ${f} (exists)`)
        faces.push(faceFromFilename(f, familyBySlug))
      }
      continue
    }
    // otherwise fetch the CSS and download the latin woff2 subset
    const res = await politeFetch(spec.css)
    if (!res.ok) {
      console.error(`  FAIL  css for ${spec.family}: ${res.status}`)
      continue
    }
    const css = await res.text()
    const blocks = css.split('@font-face').slice(1)
    let i = 0
    for (const block of blocks) {
      const urlMatch = block.match(/url\((https:\/\/[^)]+\.woff2)\)/)
      const weightMatch = block.match(/font-weight:\s*([^;]+);/)
      const styleMatch = block.match(/font-style:\s*([^;]+);/)
      const rangeMatch = block.match(/unicode-range:\s*([^;]+);/)
      if (!urlMatch) continue
      // only keep the primary latin subset to limit file count
      if (rangeMatch && !/U\+0000-00FF|U\+0000/.test(rangeMatch[1])) continue
      const weight = (weightMatch?.[1] || '400').trim()
      const style = (styleMatch?.[1] || 'normal').trim()
      const fname = `${slug(spec.family)}-${weight}-${style}-${i++}.woff2`
      const dest = join(fontsDir, fname)
      try {
        const bytes = await download(urlMatch[1], dest)
        console.log(`  ok    ${fname}  (${(bytes / 1024).toFixed(0)} KB)`)
      } catch (err) {
        console.error(`  FAIL  ${fname}: ${err.message}`)
        continue
      }
      faces.push(faceFromFilename(fname, familyBySlug))
    }
  }

  const out = join(fontsDir, 'fonts.css')
  if (faces.length === 0) {
    console.error('  WARN  no font faces resolved — leaving existing fonts.css untouched')
    return
  }
  await writeFile(out, faces.join('\n\n') + '\n')
  console.log(`\nFonts: wrote ${faces.length} @font-face rules to public/fonts/fonts.css`)
}

async function main() {
  console.log('Fetching portraits…')
  await fetchPortraits()
  console.log('\nFetching fonts…')
  await fetchFonts()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
