<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { graphEdges } from '../data/graph'
import { readCookie, writeCookie } from '../utils/cookies'
import MathAtlas from './MathAtlas.vue'
import DomainBar from './DomainBar.vue'
import SchoolBlock from './SchoolBlock.vue'
import SiteHeader from './SiteHeader.vue'

const { t, locale } = useI18n()

type Domain = 'philosophy' | 'science' | 'math' | 'humanities'

const ATLAS_DOMAIN_KEY = 'atlas-domain'
const ATLAS_SCROLL_X_KEY = 'atlas-scroll-x'
const ATLAS_SLOT_GEOM_KEY = 'atlas-slot-geom'
const ATLAS_SOCIOLOGY_KEY = 'atlas-sociology-layout'

type SlotGeom = {
  mathLeft: number
  mathWidth: number
  scienceLeft: number
  scienceWidth: number
  humanitiesLeft: number
  humanitiesWidth: number
  philosophyLeft: number
  philosophyWidth: number
}

function emptySlotGeom(): SlotGeom {
  return {
    mathLeft: 0,
    mathWidth: 0,
    scienceLeft: 0,
    scienceWidth: 0,
    humanitiesLeft: 0,
    humanitiesWidth: 0,
    philosophyLeft: 0,
    philosophyWidth: 0,
  }
}

function isDomain(value: string | null | undefined): value is Domain {
  return (
    value === 'philosophy' ||
    value === 'science' ||
    value === 'math' ||
    value === 'humanities'
  )
}

function loadDomain(): Domain {
  const fromCookie = readCookie(ATLAS_DOMAIN_KEY)
  return isDomain(fromCookie) ? fromCookie : 'philosophy'
}

function saveDomain(domain: Domain) {
  writeCookie(ATLAS_DOMAIN_KEY, domain)
}

function saveScrollX(x: number) {
  pendingScrollX = Math.max(0, Math.round(x))
  writeCookie(ATLAS_SCROLL_X_KEY, String(pendingScrollX))
}

function loadScrollX(): number {
  const raw = readCookie(ATLAS_SCROLL_X_KEY)
  const n = raw == null ? 0 : Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
}

let pendingScrollX = loadScrollX()

function loadSlotGeom(): SlotGeom {
  const raw = readCookie(ATLAS_SLOT_GEOM_KEY)
  if (!raw) return emptySlotGeom()
  try {
    const parsed = JSON.parse(raw) as Partial<SlotGeom>
    const next = emptySlotGeom()
    for (const key of Object.keys(next) as (keyof SlotGeom)[]) {
      const n = Number(parsed[key])
      if (Number.isFinite(n) && n >= 0) next[key] = Math.round(n)
    }
    return next
  } catch {
    return emptySlotGeom()
  }
}

function saveSlotGeom(geom: SlotGeom) {
  writeCookie(ATLAS_SLOT_GEOM_KEY, JSON.stringify(geom))
}

function loadSociologyLayout(): { indent: number; minWidth: number } {
  const raw = readCookie(ATLAS_SOCIOLOGY_KEY)
  if (!raw) return { indent: 0, minWidth: 0 }
  try {
    const parsed = JSON.parse(raw) as { indent?: unknown; minWidth?: unknown }
    const indent = Number(parsed.indent)
    const minWidth = Number(parsed.minWidth)
    return {
      indent: Number.isFinite(indent) && indent > 0 ? Math.round(indent) : 0,
      minWidth:
        Number.isFinite(minWidth) && minWidth > 0 ? Math.round(minWidth) : 0,
    }
  } catch {
    return { indent: 0, minWidth: 0 }
  }
}

function saveSociologyLayout(indent: number, minWidth: number) {
  writeCookie(
    ATLAS_SOCIOLOGY_KEY,
    JSON.stringify({
      indent: Math.max(0, Math.round(indent)),
      minWidth: Math.max(0, Math.round(minWidth)),
    }),
  )
}

const activeDomain = ref<Domain>(loadDomain())
const savedSociology = loadSociologyLayout()

function openDomain(domain: Domain) {
  if (activeDomain.value === domain) return
  const scrollLeft = viewport.value?.scrollLeft ?? 0
  const scrollTop = viewport.value?.scrollTop ?? 0
  activeDomain.value = domain
  saveDomain(domain)
  pendingScrollX = Math.max(0, Math.round(scrollLeft))

  const restoreScroll = () => {
    const el = viewport.value
    if (!el) return
    el.scrollLeft = scrollLeft
    el.scrollTop = scrollTop
    saveScrollX(scrollLeft)
  }

  void nextTick(() => {
    const rootEl = graph.value
    if (rootEl && observer) {
      rootEl.querySelectorAll('img').forEach((img) => {
        if (!img.complete) img.addEventListener('load', measure, { once: true })
      })
    }
    restoreScroll()
    measure()
    requestAnimationFrame(() => {
      measure()
      restoreScroll()
    })
  })
}

type Link = {
  id: string
  d: string
  color: string
  dashed: boolean
}

type Side = 'left' | 'right' | 'top' | 'bottom'

const graph = ref<HTMLElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const canvas = ref({ w: 0, h: 0 })
const links = ref<Link[]>([])

/** Shift whole political-science block so its Marx sits under economics Marx. */
const psIndent = ref(0)

/** Shift whole sociology block so its left (and Marx) sits under economics Marx. */
const sociologyIndent = ref(savedSociology.indent)
/** Stretch sociology box to at least economics' right edge (never shrink below content). */
const sociologyMinWidth = ref(savedSociology.minWidth)

/** Stable domain-slot geometry so expand/collapse keeps the same left edge & width. */
const slotGeom = ref<SlotGeom>(loadSlotGeom())

const slotVars = computed(() => ({
  '--math-left': `${slotGeom.value.mathLeft}px`,
  '--math-width':
    slotGeom.value.mathWidth > 0
      ? `${slotGeom.value.mathWidth}px`
      : 'max-content',
  '--science-left': `${slotGeom.value.scienceLeft}px`,
  '--science-width':
    slotGeom.value.scienceWidth > 0
      ? `${slotGeom.value.scienceWidth}px`
      : 'max-content',
  '--humanities-left': `${slotGeom.value.humanitiesLeft}px`,
  '--humanities-width':
    slotGeom.value.humanitiesWidth > 0
      ? `${slotGeom.value.humanitiesWidth}px`
      : 'max-content',
  '--philosophy-left': `${slotGeom.value.philosophyLeft}px`,
  '--philosophy-width':
    slotGeom.value.philosophyWidth > 0
      ? `${slotGeom.value.philosophyWidth}px`
      : 'max-content',
}))

function setSlotGeom(next: SlotGeom) {
  const prev = slotGeom.value
  if (
    Math.abs(prev.mathLeft - next.mathLeft) > 0.5 ||
    Math.abs(prev.mathWidth - next.mathWidth) > 0.5 ||
    Math.abs(prev.scienceLeft - next.scienceLeft) > 0.5 ||
    Math.abs(prev.scienceWidth - next.scienceWidth) > 0.5 ||
    Math.abs(prev.humanitiesLeft - next.humanitiesLeft) > 0.5 ||
    Math.abs(prev.humanitiesWidth - next.humanitiesWidth) > 0.5 ||
    Math.abs(prev.philosophyLeft - next.philosophyLeft) > 0.5 ||
    Math.abs(prev.philosophyWidth - next.philosophyWidth) > 0.5
  ) {
    slotGeom.value = next
    saveSlotGeom(next)
  }
}

function captureSlotGeom(rootEl: HTMLElement) {
  const root = rootEl.getBoundingClientRect()
  const padLeft = Number.parseFloat(getComputedStyle(rootEl).paddingLeft) || 0
  const relLeft = (el: Element) =>
    el.getBoundingClientRect().left - root.left - padLeft
  const relRight = (el: Element) =>
    el.getBoundingClientRect().right - root.left - padLeft

  /** Natural science & social science always share one fork / bar left edge. */
  const lockSciHum = (left: number) => {
    const x = Math.max(0, Math.round(left))
    return { scienceLeft: x, humanitiesLeft: x }
  }

  if (activeDomain.value === 'philosophy') {
    const modern = rootEl.querySelector('#modern')
    const tree = rootEl.querySelector('.philosophy-atlas')
    const sciBar = rootEl.querySelector('[data-node="science-bar"]')
    const mathBar = rootEl.querySelector('[data-node="math-bar"]')
    const humBar = rootEl.querySelector('[data-node="humanities-bar"]')
    if (!modern || !tree) return

    // Math co-originates with philosophy: bar starts at the tree's left edge.
    const philosophyLeft = Math.max(0, Math.round(relLeft(tree)))
    const philosophyWidth = Math.round((tree as HTMLElement).offsetWidth)
    const treeRight = Math.round(relRight(tree))
    const mathBarW = mathBar
      ? Math.round((mathBar as HTMLElement).offsetWidth)
      : 0
    const mathLeft = philosophyLeft
    const mathWidth = Math.max(mathBarW, philosophyWidth, treeRight - mathLeft)

    // Same x for natural science & social science (rationalism / modern column).
    const rationalism = rootEl.querySelector('#rationalism')
    const { scienceLeft, humanitiesLeft } = lockSciHum(
      relLeft(rationalism ?? modern),
    )
    const sciBarW = sciBar
      ? Math.round((sciBar as HTMLElement).offsetWidth)
      : 0
    const humBarW = humBar
      ? Math.round((humBar as HTMLElement).offsetWidth)
      : 0
    const scienceWidth = Math.max(sciBarW, treeRight - scienceLeft)
    const humanitiesWidth = Math.max(humBarW, treeRight - humanitiesLeft)

    setSlotGeom({
      mathLeft,
      mathWidth,
      scienceLeft,
      scienceWidth,
      humanitiesLeft,
      humanitiesWidth,
      philosophyLeft,
      philosophyWidth,
    })
    return
  }

  if (activeDomain.value === 'science') {
    const atlas = rootEl.querySelector('.science-atlas') as HTMLElement | null
    const astronomy = rootEl.querySelector('#astronomy') as HTMLElement | null
    const qft = rootEl.querySelector('#quantumFieldTheory') as HTMLElement | null
    if (!atlas || !astronomy) return

    const rawLeft =
      slotGeom.value.scienceLeft > 0
        ? slotGeom.value.scienceLeft
        : slotGeom.value.humanitiesLeft > 0
          ? slotGeom.value.humanitiesLeft
          : Math.max(0, Math.round(relLeft(astronomy)))
    const { scienceLeft, humanitiesLeft } = lockSciHum(rawLeft)
    const atlasRight = Math.round(relRight(atlas))
    const qftRight = qft ? Math.round(relRight(qft)) : atlasRight
    const bandRight = Math.max(atlasRight, qftRight)
    const scienceWidth = Math.max(
      slotGeom.value.scienceWidth,
      bandRight - scienceLeft,
    )
    const humanitiesWidth = Math.max(
      slotGeom.value.humanitiesWidth,
      bandRight - humanitiesLeft,
    )

    const philosophyLeft =
      slotGeom.value.philosophyLeft > 0
        ? slotGeom.value.philosophyLeft
        : 0
    const philosophyWidth = Math.max(0, bandRight - philosophyLeft)

    setSlotGeom({
      mathLeft: slotGeom.value.mathLeft,
      mathWidth: Math.max(slotGeom.value.mathWidth, philosophyWidth),
      scienceLeft,
      scienceWidth,
      humanitiesLeft,
      humanitiesWidth,
      philosophyLeft,
      philosophyWidth,
    })
    return
  }

  if (activeDomain.value === 'humanities') {
    const atlas = rootEl.querySelector('.humanities-atlas') as HTMLElement | null
    const economics = rootEl.querySelector('#economics') as HTMLElement | null
    const sociology = rootEl.querySelector('#sociology') as HTMLElement | null
    const politicalScience = rootEl.querySelector(
      '#politicalScience',
    ) as HTMLElement | null
    if (!atlas) return

    const rawLeft =
      slotGeom.value.scienceLeft > 0
        ? slotGeom.value.scienceLeft
        : slotGeom.value.humanitiesLeft > 0
          ? slotGeom.value.humanitiesLeft
          : Math.max(0, Math.round(relLeft(economics ?? atlas)))
    const { scienceLeft, humanitiesLeft } = lockSciHum(rawLeft)

    // Right edge of social-sciences content (sociology / political science).
    const bandRight = Math.max(
      Math.round(relRight(atlas)),
      economics ? Math.round(relRight(economics)) : 0,
      sociology ? Math.round(relRight(sociology)) : 0,
      politicalScience ? Math.round(relRight(politicalScience)) : 0,
    )

    const humanitiesWidth = Math.max(0, bandRight - humanitiesLeft)
    const scienceWidth = Math.max(
      slotGeom.value.scienceWidth,
      bandRight - scienceLeft,
    )

    const philosophyLeft =
      slotGeom.value.philosophyLeft > 0
        ? slotGeom.value.philosophyLeft
        : 0
    const philosophyWidth = Math.max(0, bandRight - philosophyLeft)

    const mathLeft =
      slotGeom.value.mathLeft > 0 ? slotGeom.value.mathLeft : philosophyLeft
    const mathWidth = Math.max(0, bandRight - mathLeft)

    setSlotGeom({
      mathLeft,
      mathWidth,
      scienceLeft,
      scienceWidth,
      humanitiesLeft,
      humanitiesWidth,
      philosophyLeft,
      philosophyWidth,
    })
    return
  }

  // Math domain: keep the philosophy band; lock sci/hum to the same left.
  const atlas = rootEl.querySelector('.math-atlas') as HTMLElement | null
  if (!atlas) return

  const mathLeft =
    slotGeom.value.mathLeft > 0
      ? slotGeom.value.mathLeft
      : Math.max(0, Math.round(relLeft(atlas)))
  const atlasRight = Math.round(relRight(atlas))
  const mathWidth = Math.max(
    slotGeom.value.mathWidth,
    slotGeom.value.philosophyWidth,
    atlasRight - mathLeft,
  )

  const philosophyLeft =
    slotGeom.value.philosophyLeft > 0
      ? slotGeom.value.philosophyLeft
      : mathLeft
  const philosophyWidth = Math.max(
    slotGeom.value.philosophyWidth,
    mathWidth,
    atlasRight - philosophyLeft,
  )

  const newtonNode = rootEl.querySelector(
    '.math-atlas [data-node="newton"]',
  ) as HTMLElement | null
  const newtonCol =
    (newtonNode?.closest('.math-col') as HTMLElement | null) ?? newtonNode
  const rawLeft =
    slotGeom.value.scienceLeft > 0
      ? slotGeom.value.scienceLeft
      : slotGeom.value.humanitiesLeft > 0
        ? slotGeom.value.humanitiesLeft
        : newtonCol
          ? Math.max(0, Math.round(relLeft(newtonCol)))
          : 0
  const { scienceLeft, humanitiesLeft } = lockSciHum(rawLeft)
  const sciBar = rootEl.querySelector('[data-node="science-bar"]')
  const sciBarW = sciBar
    ? Math.round((sciBar as HTMLElement).offsetWidth)
    : 0
  const scienceWidth = Math.max(
    sciBarW,
    atlasRight - scienceLeft,
    philosophyLeft + philosophyWidth - scienceLeft,
  )
  const humanitiesWidth = Math.max(
    slotGeom.value.humanitiesWidth,
    atlasRight - humanitiesLeft,
  )

  setSlotGeom({
    mathLeft,
    mathWidth,
    scienceLeft,
    scienceWidth,
    humanitiesLeft,
    humanitiesWidth,
    philosophyLeft,
    philosophyWidth,
  })
}

function box(el: Element, root: DOMRect) {
  const r = el.getBoundingClientRect()
  return {
    left: r.left - root.left,
    right: r.right - root.left,
    top: r.top - root.top,
    bottom: r.bottom - root.top,
    cy: r.top - root.top + r.height / 2,
    cx: r.left - root.left + r.width / 2,
  }
}

function point(
  b: ReturnType<typeof box>,
  side: Side,
): [number, number] {
  if (side === 'left') return [b.left, b.cy]
  if (side === 'right') return [b.right, b.cy]
  if (side === 'top') return [b.cx, b.top]
  return [b.cx, b.bottom]
}

function curve(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fromSide: Side = 'right',
  toSide: Side = 'left',
) {
  const dx = x2 - x1
  const dy = y2 - y1

  // Branch upward into the science lane first — even short gaps must curve
  // (philosophy-bar → science-bar sits close; a straight slash looks stiff).
  if (fromSide === 'top' && toSide === 'left') {
    // Same-row rightward from a portrait top: rise above, then into left
    if (x2 > x1 && y2 >= y1 - 40) {
      const up = Math.min(y1, y2) - 28
      return `M ${x1} ${y1} C ${x1} ${up}, ${x2} ${up}, ${x2} ${y2}`
    }
    // Birth point → left end of the rightward arrowhead: rise, then horizontal in.
    if (y2 < y1) {
      const run = Math.max(20, Math.abs(dx) * 0.55)
      if (x2 >= x1) {
        const midY = y1 + (y2 - y1) * 0.55
        return `M ${x1} ${y1} C ${x1} ${midY}, ${x2 - run} ${y2}, ${x2} ${y2}`
      }
      const elbowX = x2 - Math.min(36, Math.max(16, Math.abs(dx) * 0.35))
      return `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.45}, ${elbowX} ${y2}, ${x2} ${y2}`
    }
    const midY = y1 + (y2 - y1) * 0.55
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x1} ${y2}, ${x2} ${y2}`
  }

  if (Math.hypot(dx, dy) < 56) {
    return `M ${x1} ${y1} L ${x2} ${y2}`
  }

  const horizontalOut = fromSide === 'left' || fromSide === 'right'
  const horizontalIn = toSide === 'left' || toSide === 'right'

  if (horizontalOut && horizontalIn) {
    const mid = x1 + dx * 0.5
    return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`
  }

  if (!horizontalOut && !horizontalIn) {
    const mid = y1 + dy * 0.5
    return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`
  }

  // Drop from a school down into the political row: go down, then across, then in
  if (fromSide === 'bottom' && toSide === 'top') {
    const midY = y1 + (y2 - y1) * 0.55
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
  }

  // Approach the political box from the left
  if (fromSide === 'bottom' && toSide === 'left') {
    if (x2 > x1) {
      // Tip faces right at (x2, y2): when coming from above, never sag below y2
      // (same floor rule as philosophy → science). Same-row: arc above, not under.
      if (Math.abs(dy) < 40) {
        const up = Math.min(y1, y2) - 28
        return `M ${x1} ${y1} C ${x1} ${up}, ${x2} ${up}, ${x2} ${y2}`
      }
      if (y1 <= y2) {
        const midY = y1 + (y2 - y1) * 0.55
        const run = Math.max(28, dx * 0.4)
        return `M ${x1} ${y1} C ${x1} ${midY}, ${x2 - run} ${y2}, ${x2} ${y2}`
      }
      const run = Math.max(28, dx * 0.4)
      return `M ${x1} ${y1} C ${x1} ${y2}, ${x2 - run} ${y2}, ${x2} ${y2}`
    }
    const midY = y1 + (y2 - y1) * 0.65
    // Clamp so a descending stroke still ends on the tip line, not under it.
    const c1y = y1 <= y2 ? Math.min(midY, y2) : midY
    return `M ${x1} ${y1} C ${x1} ${c1y}, ${x1} ${y2}, ${x2} ${y2}`
  }

  // Branch upward into science from below
  if (fromSide === 'top' && toSide === 'bottom') {
    const midY = y1 + (y2 - y1) * 0.55
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
  }

  const midX = x1 + dx * 0.5
  const midY = y1 + dy * 0.5
  if (horizontalOut) {
    return `M ${x1} ${y1} C ${midX} ${y1}, ${x2} ${midY}, ${x2} ${y2}`
  }
  return `M ${x1} ${y1} C ${x1} ${midY}, ${midX} ${y2}, ${x2} ${y2}`
}

/** Align political-science Marx under economics Marx by shifting the whole row. */
function layoutPoliticalScience(rootEl: HTMLElement) {
  const politics = rootEl.querySelector(
    '#politicalScience',
  ) as HTMLElement | null
  const econMarx = rootEl.querySelector(
    '#economics [data-node="marx"]',
  ) as HTMLElement | null
  const psMarx = rootEl.querySelector(
    '#politicalScience [data-node="marx"]',
  ) as HTMLElement | null
  if (!politics || !econMarx || !psMarx) return false

  const delta =
    econMarx.getBoundingClientRect().left - psMarx.getBoundingClientRect().left
  const nextIndent = Math.round(psIndent.value + delta)
  const changed = Math.abs(nextIndent - psIndent.value) > 0.5
  if (changed) psIndent.value = nextIndent
  return changed
}

/** Align sociology: Marx under economics Marx; box at least as wide as economics to the right. */
function layoutSocialMarx(rootEl: HTMLElement) {
  const economics = rootEl.querySelector('#economics') as HTMLElement | null
  const sociology = rootEl.querySelector('#sociology') as HTMLElement | null
  const econMarx = rootEl.querySelector(
    '#economics [data-node="marx"]',
  ) as HTMLElement | null
  const socMarx = rootEl.querySelector(
    '#sociology [data-node="marx"]',
  ) as HTMLElement | null
  if (!economics || !sociology || !econMarx || !socMarx) return false

  const delta =
    econMarx.getBoundingClientRect().left - socMarx.getBoundingClientRect().left
  const nextIndent = Math.max(0, Math.round(sociologyIndent.value + delta))

  // After indent, sociology left ≈ current left + (nextIndent - sociologyIndent)
  const socLeft =
    sociology.getBoundingClientRect().left + (nextIndent - sociologyIndent.value)
  const econRight = economics.getBoundingClientRect().right
  // min-width only: content can still grow past economics so portraits stay inside.
  const nextMin = Math.max(0, Math.round(econRight - socLeft))

  const changed =
    Math.abs(nextIndent - sociologyIndent.value) > 0.5 ||
    Math.abs(nextMin - sociologyMinWidth.value) > 0.5
  if (changed) {
    sociologyIndent.value = nextIndent
    sociologyMinWidth.value = nextMin
    saveSociologyLayout(nextIndent, nextMin)
  }
  return changed
}

function measureLinks() {
  const rootEl = graph.value
  if (!rootEl) return
  const root = rootEl.getBoundingClientRect()
  canvas.value = { w: rootEl.offsetWidth, h: rootEl.offsetHeight }

  // Marker tip sits to the right of the path end (refX = arrow base / left end).
  const arrowTip = 7

  links.value = graphEdges.flatMap((edge) => {
    const a = rootEl.querySelector(`[data-node="${edge.from}"]`)
    const b = rootEl.querySelector(`[data-node="${edge.to}"]`)
    if (!a || !b) return []
    const from = box(a, root)
    const to = box(b, root)
    const fromSide = edge.fromSide ?? 'right'
    const toSide = edge.toSide ?? 'left'
    const start = point(from, fromSide)
    const end = point(to, toSide)
    const forkNudge = 28
    // Shared abscissa for natural-science & social-science domain bars.
    const sharedDomainLeft =
      slotGeom.value.scienceLeft > 0
        ? slotGeom.value.scienceLeft
        : slotGeom.value.humanitiesLeft
    const padLeft =
      Number.parseFloat(getComputedStyle(rootEl).paddingLeft) || 0
    // Political-science left: natural science forks at the same period when both show.
    const psNode = rootEl.querySelector('#politicalScience')
    const psForkX = psNode
      ? box(psNode, root).left - forkNudge
      : null
    if (edge.from === 'philosophy-bar' && edge.to === 'astronomy') {
      start[0] = end[0] - forkNudge
    }
    if (edge.from === 'philosophy-bar' && edge.to === 'science-bar') {
      if (psForkX != null) {
        // Same period as political-science arrow when social sciences is open.
        start[0] = psForkX
      } else if (sharedDomainLeft > 0) {
        end[0] = sharedDomainLeft + padLeft
        start[0] = end[0] - 52
      } else {
        start[0] = end[0] - 52
      }
    }
    if (edge.from === 'philosophy-bar' && edge.to === 'humanities-bar') {
      if (sharedDomainLeft > 0) {
        end[0] = sharedDomainLeft + padLeft
      }
      start[0] = end[0] - 52
    }
    if (edge.from === 'philosophy-bar' && edge.to === 'politicalScience') {
      // Early fork — same period as natural-science bar when both are visible.
      start[0] = end[0] - forkNudge
    }
    if (
      edge.from === 'greece' &&
      (edge.to === 'science-bar' || edge.to === 'humanities-bar')
    ) {
      start[0] = from.cx // middle of Greek triad — same birth x for both
      if (sharedDomainLeft > 0) {
        end[0] = sharedDomainLeft + padLeft
      }
    }
    if (edge.from === 'philosophy-bar' && edge.to === 'economics') {
      start[0] = end[0] - 52
    }
    if (edge.from === 'philosophy-bar' && edge.to === 'sociology') {
      // Sociology box starts under economics Marx — fork later than economics.
      start[0] = end[0] - 52
    }
    if (
      edge.from === 'philosophy-bar' &&
      (edge.to === 'quantitativeChemistry' || edge.to === 'physiology')
    ) {
      const chem = rootEl.querySelector('[data-node="quantitativeChemistry"]')
      const physio = rootEl.querySelector('[data-node="physiology"]')
      if (chem && physio) {
        const edgeLeft = Math.min(box(chem, root).left, box(physio, root).left)
        start[0] = edgeLeft - forkNudge
        end[0] = edgeLeft
      } else {
        start[0] = end[0] - forkNudge
      }
    }
    if (edge.from === 'philosophy-bar' && edge.to === 'evolution') {
      start[0] = end[0] - forkNudge
    }
    if (edge.viaCluster) {
      const cluster = rootEl.querySelector(`[data-node="${edge.viaCluster}"]`)
      if (cluster) start[0] = box(cluster, root).right
    }
    // Curve ends at the left end of the rightward arrow; tip reaches the target.
    if (toSide === 'left') {
      end[0] -= arrowTip
    }
    return [
      {
        id: `${edge.from}-${edge.to}`,
        d: curve(start[0], start[1], end[0], end[1], fromSide, toSide),
        color: edge.color,
        dashed: Boolean(edge.dashed),
      },
    ]
  })
}

function measure() {
  const rootEl = graph.value
  if (!rootEl) return
  if (activeDomain.value === 'humanities') {
    const movedSocial = layoutSocialMarx(rootEl)
    const movedPs = layoutPoliticalScience(rootEl)
    captureSlotGeom(rootEl)
    canvas.value = { w: rootEl.offsetWidth, h: rootEl.offsetHeight }
    if (movedSocial || movedPs) {
      void nextTick(() => {
        layoutSocialMarx(rootEl)
        layoutPoliticalScience(rootEl)
        captureSlotGeom(rootEl)
        canvas.value = { w: rootEl.offsetWidth, h: rootEl.offsetHeight }
        measureLinks()
        if (scrollRestoreActive) scheduleScrollRestore()
      })
      return
    }
    measureLinks()
    return
  }
  if (activeDomain.value === 'science' || activeDomain.value === 'math') {
    captureSlotGeom(rootEl)
    canvas.value = { w: rootEl.offsetWidth, h: rootEl.offsetHeight }
    measureLinks()
    return
  }
  captureSlotGeom(rootEl)
  measureLinks()
}

let observer: ResizeObserver | null = null
let scrollSaveTimer: ReturnType<typeof setTimeout> | null = null
/** Only pin scroll while the first paint is still settling. */
let scrollRestoreActive = false
let scrollRestoreTimer: ReturnType<typeof setTimeout> | null = null

function onViewportScroll() {
  const x = viewport.value?.scrollLeft ?? 0
  pendingScrollX = Math.max(0, Math.round(x))
  if (scrollSaveTimer) clearTimeout(scrollSaveTimer)
  scrollSaveTimer = setTimeout(() => {
    saveScrollX(pendingScrollX)
    scrollSaveTimer = null
  }, 120)
}

function restoreSavedScroll() {
  const el = viewport.value
  if (!el) return
  if (pendingScrollX > 0) el.scrollLeft = pendingScrollX
}

/** Re-apply scroll after layout width settles (fonts / images / indent). */
function scheduleScrollRestore() {
  restoreSavedScroll()
  requestAnimationFrame(() => {
    restoreSavedScroll()
    requestAnimationFrame(restoreSavedScroll)
  })
}

function measureAndRestoreScroll() {
  measure()
  scheduleScrollRestore()
}

function beginScrollRestoreWindow(ms = 1000) {
  scrollRestoreActive = true
  if (scrollRestoreTimer) clearTimeout(scrollRestoreTimer)
  scrollRestoreTimer = setTimeout(() => {
    scrollRestoreActive = false
    scrollRestoreTimer = null
    restoreSavedScroll()
  }, ms)
}

onMounted(() => {
  beginScrollRestoreWindow()
  observer = new ResizeObserver(() => {
    measure()
    if (scrollRestoreActive) scheduleScrollRestore()
  })
  if (graph.value) {
    observer.observe(graph.value)
    graph.value.querySelectorAll('img').forEach((img) => {
      if (!img.complete) {
        img.addEventListener(
          'load',
          () => {
            measure()
            if (scrollRestoreActive) scheduleScrollRestore()
          },
          { once: true },
        )
      }
    })
  }
  viewport.value?.addEventListener('scroll', onViewportScroll, { passive: true })
  saveDomain(activeDomain.value)
  void nextTick(() => {
    measureAndRestoreScroll()
    void document.fonts?.ready.then(() => {
      if (!scrollRestoreActive) return
      measureAndRestoreScroll()
    })
  })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  viewport.value?.removeEventListener('scroll', onViewportScroll)
  if (scrollSaveTimer) clearTimeout(scrollSaveTimer)
  if (scrollRestoreTimer) clearTimeout(scrollRestoreTimer)
})

watch(locale, () => {
  beginScrollRestoreWindow()
  void nextTick(measureAndRestoreScroll)
})
watch(activeDomain, (domain) => {
  sociologyIndent.value = 0
  sociologyMinWidth.value = 0
  saveSociologyLayout(0, 0)
  if (domain !== 'humanities') psIndent.value = 0
  saveDomain(domain)
  void nextTick(measure)
})
</script>

<template>
  <div class="shell">
    <SiteHeader />
    <div
      ref="viewport"
      class="viewport"
      :class="`viewport-${activeDomain}`"
    >
      <main
        id="top"
        ref="graph"
        class="graph"
        :class="`domain-${activeDomain}`"
        :style="slotVars"
      >
        <svg
          class="wires"
          :viewBox="`0 0 ${canvas.w} ${canvas.h}`"
          :width="canvas.w"
          :height="canvas.h"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="1.6"
              refY="5"
              markerWidth="9"
              markerHeight="9"
              markerUnits="userSpaceOnUse"
              orient="0"
            >
              <path d="M 1.6 2 L 8.4 5 L 1.6 8 Z" fill="context-stroke" />
            </marker>
          </defs>
          <path
            v-for="link in links"
            :key="link.id"
            :d="link.d"
            fill="none"
            :stroke="link.color"
            :stroke-dasharray="link.dashed ? '6 5' : 'none'"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            marker-end="url(#arrow)"
          />
        </svg>

        <template v-if="activeDomain === 'philosophy'">
          <div class="philosophy-atlas">
            <p class="epoch epoch-onto">{{ t('epoch.ontology') }}</p>
            <p class="epoch epoch-epist">{{ t('epoch.epistemology') }}</p>
            <p class="epoch epoch-contemp">{{ t('epoch.contemporary') }}</p>

            <DomainBar
              domain="math"
              :label="t('domain.math')"
              @open="openDomain('math')"
            />

            <DomainBar
              domain="science"
              :label="t('domain.science')"
              @open="openDomain('science')"
            />

            <DomainBar
              domain="humanities"
              :label="t('domain.humanities')"
              @open="openDomain('humanities')"
            />

            <article id="presocratic" data-node="presocratic" class="node">
              <SchoolBlock school-id="presocratic" />
            </article>

            <article id="greece" data-node="greece" class="node">
              <SchoolBlock school-id="greece" />
            </article>

            <div id="hellenistic" class="hellenistic">
              <article id="stoicism" data-node="stoicism" class="node">
                <SchoolBlock school-id="stoicism" />
              </article>
              <article id="epicureanism" data-node="epicureanism" class="node">
                <SchoolBlock school-id="epicureanism" />
              </article>
              <article id="skepticism" data-node="skepticism" class="node">
                <SchoolBlock school-id="skepticism" />
              </article>
            </div>

            <article id="scholasticism" data-node="scholasticism" class="node">
              <SchoolBlock school-id="scholasticism" />
            </article>

            <div id="modern" class="modern">
              <article id="rationalism" data-node="rationalism" class="node">
                <SchoolBlock school-id="rationalism" />
              </article>
              <article id="empiricism" data-node="empiricism" class="node">
                <SchoolBlock school-id="empiricism" />
              </article>
            </div>

            <article id="classical" data-node="classical" class="node">
              <SchoolBlock school-id="classical" />
            </article>

            <div id="split" class="life-col">
              <article id="life" data-node="life" class="node">
                <SchoolBlock school-id="life" />
              </article>
              <article id="phenomenology" data-node="phenomenology" class="node">
                <SchoolBlock school-id="phenomenology" />
              </article>
              <article id="analytic" data-node="analytic" class="node">
                <SchoolBlock school-id="analytic" />
              </article>
            </div>

            <div id="existCol" class="exist-col">
              <article id="existentialism" data-node="existentialism" class="node">
                <SchoolBlock school-id="existentialism" />
              </article>
              <article id="deconstruction" data-node="deconstruction" class="node">
                <SchoolBlock school-id="deconstruction" />
              </article>
            </div>
          </div>
        </template>

        <template v-else-if="activeDomain === 'science'">
          <DomainBar
            domain="math"
            :label="t('domain.math')"
            @open="openDomain('math')"
          />
          <div class="science-atlas">
            <article id="astronomy" data-node="astronomy" class="node">
              <SchoolBlock school-id="astronomy" />
            </article>
            <article
              id="classicalMechanics"
              data-node="classicalMechanics"
              class="node"
            >
              <SchoolBlock school-id="classicalMechanics" />
            </article>
            <article
              id="electrodynamics"
              data-node="electrodynamics"
              class="node"
            >
              <SchoolBlock school-id="electrodynamics" />
            </article>
            <article
              id="thermodynamics"
              data-node="thermodynamics"
              class="node"
            >
              <SchoolBlock school-id="thermodynamics" />
            </article>
            <article
              id="statisticalPhysics"
              data-node="statisticalPhysics"
              class="node"
            >
              <SchoolBlock school-id="statisticalPhysics" />
            </article>
            <article id="relativity" data-node="relativity" class="node">
              <SchoolBlock school-id="relativity" />
            </article>
            <article
              id="quantumMechanics"
              data-node="quantumMechanics"
              class="node"
            >
              <SchoolBlock school-id="quantumMechanics" />
            </article>
            <article
              id="quantumFieldTheory"
              data-node="quantumFieldTheory"
              class="node"
            >
              <SchoolBlock school-id="quantumFieldTheory" />
            </article>
            <article
              id="quantitativeChemistry"
              data-node="quantitativeChemistry"
              class="node"
            >
              <SchoolBlock school-id="quantitativeChemistry" />
            </article>
            <article
              id="microscopicMatter"
              data-node="microscopicMatter"
              class="node"
            >
              <SchoolBlock school-id="microscopicMatter" />
            </article>
            <article
              id="periodicTable"
              data-node="periodicTable"
              class="node"
            >
              <SchoolBlock school-id="periodicTable" />
            </article>
            <article
              id="nuclearPhysics"
              data-node="nuclearPhysics"
              class="node"
            >
              <SchoolBlock school-id="nuclearPhysics" />
            </article>
            <article
              id="quantumChemistry"
              data-node="quantumChemistry"
              class="node"
            >
              <SchoolBlock school-id="quantumChemistry" />
            </article>
            <article id="physiology" data-node="physiology" class="node">
              <SchoolBlock school-id="physiology" />
            </article>
            <article id="microbiology" data-node="microbiology" class="node">
              <SchoolBlock school-id="microbiology" />
            </article>
            <article id="evolution" data-node="evolution" class="node">
              <SchoolBlock school-id="evolution" />
            </article>
            <article
              id="molecularBiology"
              data-node="molecularBiology"
              class="node"
            >
              <SchoolBlock school-id="molecularBiology" />
            </article>
          </div>
          <DomainBar
            domain="philosophy"
            :label="t('domain.philosophy')"
            @open="openDomain('philosophy')"
          />
          <DomainBar
            domain="humanities"
            :label="t('domain.humanities')"
            @open="openDomain('humanities')"
          />
        </template>

        <template v-else-if="activeDomain === 'humanities'">
          <DomainBar
            domain="math"
            :label="t('domain.math')"
            @open="openDomain('math')"
          />
          <DomainBar
            domain="science"
            :label="t('domain.science')"
            @open="openDomain('science')"
          />
          <DomainBar
            domain="philosophy"
            :label="t('domain.philosophy')"
            @open="openDomain('philosophy')"
          />
          <div
            class="humanities-atlas"
            :style="{
              '--sociology-indent': `${sociologyIndent}px`,
              '--sociology-min-width':
                sociologyMinWidth > 0 ? `${sociologyMinWidth}px` : '0px',
              '--ps-indent': `${psIndent}px`,
            }"
          >
            <article
              id="politicalScience"
              data-node="politicalScience"
              class="node political-science"
            >
              <SchoolBlock school-id="politicalScience" />
            </article>
            <article id="economics" data-node="economics" class="node">
              <SchoolBlock school-id="economics" />
            </article>
            <article id="sociology" data-node="sociology" class="node">
              <SchoolBlock school-id="sociology" />
            </article>
          </div>
        </template>

        <template v-else-if="activeDomain === 'math'">
          <MathAtlas />
          <DomainBar
            domain="science"
            :label="t('domain.science')"
            @open="openDomain('science')"
          />
          <DomainBar
            domain="philosophy"
            :label="t('domain.philosophy')"
            @open="openDomain('philosophy')"
          />
          <DomainBar
            domain="humanities"
            :label="t('domain.humanities')"
            @open="openDomain('humanities')"
          />
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-x pan-y;
}

.viewport-math,
.viewport-science,
.viewport-humanities {
  overflow-x: auto;
  overflow-y: hidden;
}

.graph {
  --gutter-x: 40px;
  /* Per-domain max card width that still fits one viewport; shared size = min. */
  --card-w-cap: 56px;
  --card-w-floor: 32px;
  --fit-math: clamp(
    var(--card-w-floor),
    calc((100dvh - 12.5rem) / 16),
    var(--card-w-cap)
  );
  --fit-science: clamp(
    var(--card-w-floor),
    calc((100dvh - 12.5rem) / 16),
    var(--card-w-cap)
  );
  --fit-humanities: clamp(
    var(--card-w-floor),
    calc((100dvh - 12.5rem) / 16),
    var(--card-w-cap)
  );
  --fit-philosophy: clamp(
    var(--card-w-floor),
    calc((100dvh - 11rem) / 14),
    var(--card-w-cap)
  );
  --card-w: min(
    var(--fit-math),
    var(--fit-science),
    var(--fit-humanities),
    var(--fit-philosophy)
  );
  --info-h: 1.2rem;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 40px 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  padding-left: max(40px, env(safe-area-inset-left));
  padding-right: max(40px, env(safe-area-inset-right));
  height: 100%;
  min-height: 0;
  width: max-content;
  min-width: 100%;
  box-sizing: border-box;
}

/* Shared person-card chrome (domain switch must not resize cards). */
.graph :deep(.school) {
  gap: 3px;
  border-top-width: 2px;
}

.graph :deep(.school h2) {
  font-size: 0.92rem;
}

.graph :deep(.people) {
  gap: 4px 10px;
}

.graph :deep(.school[data-school='economics'] .people),
.graph :deep(.school[data-school='sociology'] .people),
.graph :deep(.school[data-school='politicalScience'] .people) {
  gap: 14px 36px;
}

.graph :deep(.quantum-grid) {
  gap: 3px 10px;
}

.graph .node {
  padding: 4px 6px 2px;
}

.graph :deep(.info) {
  margin-top: 2px;
}

.graph :deep(.card h3) {
  font-size: 0.68rem;
}

.graph :deep(.dates),
.graph :deep(.country) {
  font-size: 0.58rem;
}

.philosophy-atlas {
  --gutter-x: 40px;
  position: relative;
  display: grid;
  grid-template-columns: max-content max-content max-content max-content max-content max-content max-content max-content;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  grid-template-areas:
    'epochOnto epochOnto epochOnto epochOnto epochEpist epochEpist epochContemp epochContemp'
    'math math math math math math math math'
    '. . . . science science science science'
    'presocratic greece hellenistic scholasticism modern classical lifeCol existCol'
    '. . . . humanities humanities humanities humanities';
  gap: 8px var(--gutter-x);
  flex: 1 1 auto;
  min-height: 0;
  width: max-content;
  margin-left: var(--philosophy-left, 0px);
  align-items: center;
  box-sizing: border-box;
}

.domain-slot {
  position: relative;
  z-index: 3;
  box-sizing: border-box;
}

.science-slot {
  margin-left: var(--science-left, 0px);
  width: var(--science-width, max-content);
  min-width: var(--science-width, 0px);
  flex: 0 0 auto;
}

.math-slot {
  margin-left: var(--math-left, 0px);
  width: var(--math-width, max-content);
  min-width: var(--math-width, 0px);
  flex: 0 0 auto;
}

.graph.domain-science,
.graph.domain-math,
.graph.domain-humanities {
  --gutter-x: 28px;
  gap: 4px;
  padding-top: 6px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  justify-content: flex-start;
}

.graph.domain-math {
  gap: 8px;
  padding-top: 8px;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
}

.science-atlas {
  --gutter-x: 28px;
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: max-content max-content max-content max-content max-content max-content max-content;
  grid-template-rows: auto auto auto auto auto;
  grid-template-areas:
    'astronomy classicalMechanics electrodynamics . . relativity .'
    '. . thermodynamics statisticalPhysics . quantumMechanics quantumFieldTheory'
    '. . quantitativeChemistry microscopicMatter periodicTable nuclearPhysics quantumChemistry'
    '. . physiology microbiology . . .'
    '. . evolution molecularBiology molecularBiology molecularBiology molecularBiology';
  gap: 6px var(--gutter-x);
  margin-left: var(--science-left, 0px);
  width: max-content;
  flex: 1 1 auto;
  min-height: 0;
  align-content: space-evenly;
  align-items: start;
  box-sizing: border-box;
}

.science-atlas #astronomy {
  grid-area: astronomy;
}

.science-atlas #classicalMechanics {
  grid-area: classicalMechanics;
}

.science-atlas #electrodynamics {
  grid-area: electrodynamics;
}

.science-atlas #thermodynamics {
  grid-area: thermodynamics;
}

.science-atlas #statisticalPhysics {
  grid-area: statisticalPhysics;
}

.science-atlas #relativity {
  grid-area: relativity;
}

.science-atlas #quantumMechanics {
  grid-area: quantumMechanics;
}

.science-atlas #quantumFieldTheory {
  grid-area: quantumFieldTheory;
}

.science-atlas #quantitativeChemistry {
  grid-area: quantitativeChemistry;
}

.science-atlas #microscopicMatter {
  grid-area: microscopicMatter;
}

.science-atlas #periodicTable {
  grid-area: periodicTable;
}

.science-atlas #nuclearPhysics {
  grid-area: nuclearPhysics;
}

.science-atlas #quantumChemistry {
  grid-area: quantumChemistry;
}

.science-atlas #physiology {
  grid-area: physiology;
}

.science-atlas #microbiology {
  grid-area: microbiology;
}

.science-atlas #evolution {
  grid-area: evolution;
}

.science-atlas #molecularBiology {
  grid-area: molecularBiology;
  display: grid;
  grid-template-columns: subgrid;
  align-items: start;
}

.science-atlas #molecularBiology :deep(.school) {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  width: auto;
  min-width: 0;
}

.science-atlas #molecularBiology :deep(.head) {
  grid-column: 1 / -1;
}

.science-atlas #molecularBiology :deep(.genetics-grid) {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: start;
}

.science-atlas #molecularBiology :deep(.slot-mendel) {
  grid-column: 1;
  justify-self: start;
}

/* Crick left-aligns with Curie (nuclearPhysics col); Watson sits tight beside him. */
.science-atlas #molecularBiology :deep(.genetics-pair) {
  grid-column: 3;
  justify-self: start;
}

.political-science {
  position: relative;
  z-index: 3;
  width: max-content;
  flex: 0 0 auto;
  box-sizing: border-box;
}

.humanities-atlas #politicalScience {
  width: max-content;
  margin-left: var(--ps-indent, 0px);
  box-sizing: border-box;
}

.graph.domain-science :deep(.math-bar),
.graph.domain-humanities :deep(.math-bar) {
  margin-left: var(--math-left, 0px);
  width: var(--math-width, max-content);
  min-width: var(--math-width, 0px);
  flex: 0 0 auto;
  box-sizing: border-box;
}

.graph.domain-math :deep(.science-bar),
.graph.domain-humanities :deep(.science-bar) {
  margin-left: var(--science-left, 0px);
  width: var(--science-width, max-content);
  min-width: var(--science-width, 0px);
  flex: 0 0 auto;
  box-sizing: border-box;
}

.graph.domain-science :deep(.humanities-bar),
.graph.domain-math :deep(.humanities-bar) {
  margin-left: var(--humanities-left, 0px);
  width: var(--humanities-width, max-content);
  min-width: var(--humanities-width, 0px);
  flex: 0 0 auto;
  box-sizing: border-box;
}

.graph.domain-science :deep(.philosophy-bar),
.graph.domain-math :deep(.philosophy-bar),
.graph.domain-humanities :deep(.philosophy-bar) {
  margin-left: var(--philosophy-left, 0px);
  width: var(--philosophy-width, max-content);
  min-width: var(--philosophy-width, 0px);
  flex: 0 0 auto;
  box-sizing: border-box;
}

.philosophy-atlas :deep(.math-bar) {
  grid-area: math;
  justify-self: stretch;
  align-self: center;
}

.philosophy-atlas :deep(.science-bar) {
  grid-area: science;
  justify-self: stretch;
  align-self: center;
}

.philosophy-atlas :deep(.humanities-bar) {
  grid-area: humanities;
  justify-self: stretch;
  align-self: center;
}

.humanities-atlas {
  --gutter-x: 28px;
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  margin-left: var(--humanities-left, 0px);
  width: max(var(--humanities-width, 0px), max-content);
  min-width: var(--humanities-width, max-content);
  flex: 1 1 auto;
  min-height: 0;
  box-sizing: border-box;
}

.humanities-atlas #economics {
  width: max-content;
}

.humanities-atlas #sociology {
  width: max-content;
  min-width: var(--sociology-min-width, 0px);
  margin-left: var(--sociology-indent, 0px);
  box-sizing: border-box;
}

.humanities-atlas #sociology :deep(.school) {
  width: max-content;
  min-width: 100%;
}

.wires {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: visible;
  color: var(--gold);
}

.epoch {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0;
  padding: 0 2px;
  align-self: end;
  font-family: var(--serif);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.28em;
  color: var(--gold-2);
  white-space: nowrap;
  opacity: 0.9;
}

.epoch::before,
.epoch::after {
  content: '';
  flex: 1 1 1.5rem;
  height: 1px;
  min-width: 12px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(212, 184, 122, 0.45),
    transparent
  );
}

.epoch-onto {
  grid-area: epochOnto;
}

.epoch-epist {
  grid-area: epochEpist;
}

.epoch-contemp {
  grid-area: epochContemp;
}

.node,
.modern,
.hellenistic,
.life-col,
.exist-col {
  position: relative;
  z-index: 3;
}

.node {
  width: max-content;
  padding: 8px 10px 8px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(20, 24, 33, 0.88);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
}

#presocratic {
  grid-area: presocratic;
  align-self: center;
}

#greece {
  grid-area: greece;
  align-self: center;
}

#stoicism {
  align-self: center;
}

#scholasticism {
  grid-area: scholasticism;
  align-self: center;
}

.hellenistic {
  grid-area: hellenistic;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  gap: 16px;
  min-height: 0;
  align-self: center;
  width: max-content;
}

.hellenistic .node {
  width: 100%;
  box-sizing: border-box;
}

.modern {
  grid-area: modern;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  gap: 16px;
  min-height: 0;
  align-self: center;
  width: max-content;
}

.modern .node {
  width: 100%;
  box-sizing: border-box;
}

.modern :deep(.school) {
  width: 100%;
}

.modern :deep(.reason-grid),
.modern :deep(.experience-grid) {
  width: 100%;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

#classical {
  grid-area: classical;
  align-self: center;
}

.life-col,
.exist-col {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-self: start;
  gap: 12px;
}

.life-col {
  grid-area: lifeCol;
}

.exist-col {
  grid-area: existCol;
}

@media (max-height: 760px) {
  .graph {
    --card-w-cap: 48px;
    --card-w-floor: 30px;
    --fit-math: clamp(
      var(--card-w-floor),
      calc((100dvh - 11rem) / 16),
      var(--card-w-cap)
    );
    --fit-science: clamp(
      var(--card-w-floor),
      calc((100dvh - 11rem) / 16),
      var(--card-w-cap)
    );
    --fit-humanities: clamp(
      var(--card-w-floor),
      calc((100dvh - 11rem) / 16),
      var(--card-w-cap)
    );
    --fit-philosophy: clamp(
      var(--card-w-floor),
      calc((100dvh - 9.5rem) / 14),
      var(--card-w-cap)
    );
    --card-w: min(
      var(--fit-math),
      var(--fit-science),
      var(--fit-humanities),
      var(--fit-philosophy)
    );
    --info-h: 1.1rem;
    padding: 10px 32px 12px;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    padding-left: max(32px, env(safe-area-inset-left));
    padding-right: max(32px, env(safe-area-inset-right));
    gap: 8px;
  }

  .graph.domain-math,
  .graph.domain-science,
  .graph.domain-humanities {
    gap: 8px;
    padding-top: 4px;
    padding-bottom: max(6px, env(safe-area-inset-bottom));
  }

  .philosophy-atlas {
    gap: 6px var(--gutter-x);
  }

  :deep(.domain-bar-lead) {
    left: max(32px, env(safe-area-inset-left));
  }
}

@media (max-width: 900px) {
  .graph {
    --gutter-x: 22px;
    --card-w-cap: 46px;
    --card-w-floor: 30px;
    --fit-math: clamp(
      var(--card-w-floor),
      calc((100dvh - 11rem) / 16),
      var(--card-w-cap)
    );
    --fit-science: clamp(
      var(--card-w-floor),
      calc((100dvh - 11rem) / 16),
      var(--card-w-cap)
    );
    --fit-humanities: clamp(
      var(--card-w-floor),
      calc((100dvh - 11rem) / 16),
      var(--card-w-cap)
    );
    --fit-philosophy: clamp(
      var(--card-w-floor),
      calc((100dvh - 9.5rem) / 14),
      var(--card-w-cap)
    );
    --card-w: min(
      var(--fit-math),
      var(--fit-science),
      var(--fit-humanities),
      var(--fit-philosophy)
    );
    --info-h: 1.15rem;
    height: auto;
    min-height: 100%;
    gap: 12px;
    padding: 8px 18px 24px;
    padding-bottom: max(24px, calc(env(safe-area-inset-bottom) + 12px));
    padding-left: max(18px, env(safe-area-inset-left));
    padding-right: max(18px, env(safe-area-inset-right));
    align-items: flex-start;
  }

  .graph.domain-math,
  .graph.domain-science,
  .graph.domain-humanities {
    height: 100%;
    min-height: 0;
    gap: 8px;
    padding-top: 4px;
    padding-bottom: max(6px, env(safe-area-inset-bottom));
  }

  .viewport-math,
  .viewport-science,
  .viewport-humanities {
    overflow-x: auto;
    overflow-y: hidden;
  }

  :deep(.domain-bar-lead) {
    left: max(18px, env(safe-area-inset-left));
  }

  .philosophy-atlas {
    --gutter-x: 22px;
    grid-template-rows: auto auto auto auto auto;
    height: auto;
    gap: 10px var(--gutter-x);
    align-items: start;
  }

  .science-atlas {
    --gutter-x: 22px;
    gap: 12px var(--gutter-x);
    align-content: start;
  }

  .epoch {
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    gap: 8px;
  }

  .node {
    padding: 7px 8px;
    border-radius: 10px;
  }

  .hellenistic,
  .modern {
    gap: 12px;
  }

  .life-col,
  .exist-col {
    gap: 10px;
  }
}

@media (max-width: 600px) {
  .graph {
    --gutter-x: 16px;
    --card-w-cap: 42px;
    --card-w: min(
      var(--fit-math),
      var(--fit-science),
      var(--fit-humanities),
      var(--fit-philosophy)
    );
    --info-h: 1.1rem;
    gap: 10px;
  }

  .philosophy-atlas {
    --gutter-x: 16px;
    gap: 8px var(--gutter-x);
  }

  .epoch {
    letter-spacing: 0.12em;
  }
}
</style>
