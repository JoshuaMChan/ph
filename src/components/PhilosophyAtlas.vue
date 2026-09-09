<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { graphEdges } from '../data/graph'
import { philosophers, schools } from '../data/philosophers'
import { formatEraYears } from '../utils/dates'
import MathAtlas from './MathAtlas.vue'
import DomainBar from './DomainBar.vue'
import PhilosopherCard from './PhilosopherCard.vue'
import SchoolBlock from './SchoolBlock.vue'
import SiteHeader from './SiteHeader.vue'

const { t, locale } = useI18n()

const political = schools.political
const politicalYears = computed(() =>
  formatEraYears(political.yearStart, political.yearEnd),
)
const politicalRegion = computed(() =>
  political.regionKeys.map((key) => t(`region.${key}`)).join(' · '),
)

type Domain = 'philosophy' | 'science' | 'math'
const activeDomain = ref<Domain>('philosophy')

function openDomain(domain: Domain) {
  if (activeDomain.value === domain) return
  const scrollLeft = viewport.value?.scrollLeft ?? 0
  const scrollTop = viewport.value?.scrollTop ?? 0
  activeDomain.value = domain

  const restoreScroll = () => {
    const el = viewport.value
    if (!el) return
    el.scrollLeft = scrollLeft
    el.scrollTop = scrollTop
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
const polLayout = ref({
  hobbes: 0,
  rousseau: 0,
  marx: 0,
  mill: 0,
  rawls: 0,
  trackW: 200,
})

/** Stable domain-slot geometry so expand/collapse keeps the same left edge & width. */
const slotGeom = ref({
  mathLeft: 0,
  mathWidth: 0,
  scienceLeft: 0,
  scienceWidth: 0,
  philosophyLeft: 0,
  philosophyWidth: 0,
})

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
  '--philosophy-left': `${slotGeom.value.philosophyLeft}px`,
  '--philosophy-width':
    slotGeom.value.philosophyWidth > 0
      ? `${slotGeom.value.philosophyWidth}px`
      : 'max-content',
}))

function setSlotGeom(next: typeof slotGeom.value) {
  const prev = slotGeom.value
  if (
    Math.abs(prev.mathLeft - next.mathLeft) > 0.5 ||
    Math.abs(prev.mathWidth - next.mathWidth) > 0.5 ||
    Math.abs(prev.scienceLeft - next.scienceLeft) > 0.5 ||
    Math.abs(prev.scienceWidth - next.scienceWidth) > 0.5 ||
    Math.abs(prev.philosophyLeft - next.philosophyLeft) > 0.5 ||
    Math.abs(prev.philosophyWidth - next.philosophyWidth) > 0.5
  ) {
    slotGeom.value = next
  }
}

function captureSlotGeom(rootEl: HTMLElement) {
  const root = rootEl.getBoundingClientRect()
  const padLeft = Number.parseFloat(getComputedStyle(rootEl).paddingLeft) || 0
  const relLeft = (el: Element) =>
    el.getBoundingClientRect().left - root.left - padLeft
  const relRight = (el: Element) =>
    el.getBoundingClientRect().right - root.left - padLeft

  if (activeDomain.value === 'philosophy') {
    const modern = rootEl.querySelector('#modern')
    const tree = rootEl.querySelector('.philosophy-atlas')
    const sciBar = rootEl.querySelector('[data-node="science-bar"]')
    const mathBar = rootEl.querySelector('[data-node="math-bar"]')
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

    // Science still branches later (from modern / medieval band).
    const scienceLeft = Math.max(0, Math.round(relLeft(modern)))
    const sciBarW = sciBar
      ? Math.round((sciBar as HTMLElement).offsetWidth)
      : 0
    const scienceWidth = Math.max(sciBarW, treeRight - scienceLeft)

    setSlotGeom({
      mathLeft,
      mathWidth,
      scienceLeft,
      scienceWidth,
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

    const scienceLeft =
      slotGeom.value.scienceLeft > 0
        ? slotGeom.value.scienceLeft
        : Math.max(0, Math.round(relLeft(astronomy)))
    const atlasRight = Math.round(relRight(atlas))
    const qftRight = qft ? Math.round(relRight(qft)) : atlasRight
    const scienceWidth = Math.max(
      slotGeom.value.scienceWidth,
      atlasRight - scienceLeft,
      qftRight - scienceLeft,
    )

    const philosophyLeft =
      slotGeom.value.philosophyLeft > 0
        ? slotGeom.value.philosophyLeft
        : 0
    const philosophyWidth = Math.max(0, qftRight - philosophyLeft)

    setSlotGeom({
      mathLeft: slotGeom.value.mathLeft,
      mathWidth: Math.max(slotGeom.value.mathWidth, philosophyWidth),
      scienceLeft,
      scienceWidth,
      philosophyLeft,
      philosophyWidth,
    })
    return
  }

  // Math domain: keep the philosophy band; science bar starts at Newton.
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

  // Align collapsed natural-science bar with Newton's column.
  const newtonNode = rootEl.querySelector(
    '.math-atlas [data-node="newton"]',
  ) as HTMLElement | null
  const newtonCol =
    (newtonNode?.closest('.math-col') as HTMLElement | null) ?? newtonNode
  const scienceLeft = newtonCol
    ? Math.max(0, Math.round(relLeft(newtonCol)))
    : slotGeom.value.scienceLeft
  const sciBar = rootEl.querySelector('[data-node="science-bar"]')
  const sciBarW = sciBar
    ? Math.round((sciBar as HTMLElement).offsetWidth)
    : 0
  const scienceWidth = Math.max(
    sciBarW,
    atlasRight - scienceLeft,
    philosophyLeft + philosophyWidth - scienceLeft,
  )

  setSlotGeom({
    mathLeft,
    mathWidth,
    scienceLeft,
    scienceWidth,
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
    // From below into a box's left edge (scholasticism / philosophy-bar → science-bar):
    // rise toward the target, then enter horizontally from the left (tip faces right).
    if (y2 < y1) {
      const run = Math.max(28, Math.abs(dx) * 0.7)
      if (x2 >= x1) {
        const midY = y1 + (y2 - y1) * 0.55
        return `M ${x1} ${y1} C ${x1} ${midY}, ${x2 - run} ${y2}, ${x2} ${y2}`
      }
      const elbowX = x2 - Math.min(36, Math.max(16, Math.abs(dx) * 0.35))
      return `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.45}, ${elbowX} ${y2}, ${elbowX} ${y2} L ${x2} ${y2}`
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
    // Same-row rightward (e.g. Galileo → Newton): drop below, then across into left
    if (x2 > x1) {
      const down = Math.max(y1, y2) + 28
      return `M ${x1} ${y1} C ${x1} ${down}, ${x2} ${down}, ${x2} ${y2}`
    }
    const midY = y1 + (y2 - y1) * 0.65
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x1} ${y2}, ${x2} ${y2}`
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

function layoutPolitical(rootEl: HTMLElement) {
  const track = rootEl.querySelector('.pol-track') as HTMLElement | null
  const kant = rootEl.querySelector('#classical [data-node="kant"]')
  const frege = rootEl.querySelector('#analytic [data-node="frege"]')
  const foucault = rootEl.querySelector('#deconstruction [data-node="foucault"]')
  const machSlot = rootEl.querySelector('.pol-slot-machiavelli') as HTMLElement | null
  const hobbesSlot = rootEl.querySelector('.pol-slot-hobbes') as HTMLElement | null
  const marxSlot = rootEl.querySelector('.pol-slot-marx') as HTMLElement | null
  const millSlot = rootEl.querySelector('.pol-slot-mill') as HTMLElement | null
  const rawlsSlot = rootEl.querySelector('.pol-slot-rawls') as HTMLElement | null
  if (
    !track ||
    !kant ||
    !frege ||
    !foucault ||
    !machSlot ||
    !hobbesSlot ||
    !marxSlot ||
    !millSlot ||
    !rawlsSlot
  )
    return false

  const trackLeft = track.getBoundingClientRect().left
  const gap = 28
  const machW = machSlot.offsetWidth
  const hobbesW = hobbesSlot.offsetWidth
  const marxW = marxSlot.offsetWidth
  const millW = millSlot.offsetWidth
  const rawlsW = rawlsSlot.offsetWidth

  let rousseau = Math.max(0, kant.getBoundingClientRect().left - trackLeft)
  let mill = Math.max(0, frege.getBoundingClientRect().left - trackLeft)
  let rawls = Math.max(0, foucault.getBoundingClientRect().left - trackLeft)
  let hobbes = machW + gap

  if (hobbes + hobbesW + gap > rousseau) {
    hobbes = Math.max(machW + 16, rousseau - hobbesW - gap)
  }
  if (mill < rousseau + gap) {
    mill = rousseau + gap
  }

  const marx = mill + millW + gap
  if (rawls < marx + marxW + gap) {
    rawls = marx + marxW + gap
  }

  const trackW = Math.ceil(rawls + rawlsW)
  const next = { hobbes, rousseau, marx, mill, rawls, trackW }
  const prev = polLayout.value
  const changed =
    Math.abs(prev.hobbes - next.hobbes) > 0.5 ||
    Math.abs(prev.rousseau - next.rousseau) > 0.5 ||
    Math.abs(prev.marx - next.marx) > 0.5 ||
    Math.abs(prev.mill - next.mill) > 0.5 ||
    Math.abs(prev.rawls - next.rawls) > 0.5 ||
    Math.abs(prev.trackW - next.trackW) > 0.5
  if (changed) polLayout.value = next
  return changed
}

function measureLinks() {
  const rootEl = graph.value
  if (!rootEl) return
  const root = rootEl.getBoundingClientRect()
  canvas.value = { w: rootEl.offsetWidth, h: rootEl.offsetHeight }

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
    if (edge.from === 'philosophy-bar' && edge.to === 'astronomy') {
      start[0] = end[0] - forkNudge
    }
    if (edge.from === 'philosophy-bar' && edge.to === 'science-bar') {
      // Leave philosophy a bit left of the science bar so the cubic has room to bend.
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
  if (activeDomain.value === 'math') {
    captureSlotGeom(rootEl)
    canvas.value = { w: rootEl.offsetWidth, h: rootEl.offsetHeight }
    measureLinks()
    return
  }
  if (activeDomain.value === 'science') {
    captureSlotGeom(rootEl)
    canvas.value = { w: rootEl.offsetWidth, h: rootEl.offsetHeight }
    measureLinks()
    return
  }
  const moved = layoutPolitical(rootEl)
  captureSlotGeom(rootEl)
  if (moved) {
    void nextTick(() => {
      captureSlotGeom(rootEl)
      measureLinks()
    })
    return
  }
  measureLinks()
}

let observer: ResizeObserver | null = null

onMounted(() => {
  observer = new ResizeObserver(() => measure())
  if (graph.value) {
    observer.observe(graph.value)
    graph.value.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', measure, { once: true })
    })
  }
  void nextTick(() => {
    measure()
    requestAnimationFrame(measure)
  })
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

watch(locale, () => void nextTick(measure))
watch(activeDomain, () => void nextTick(measure))
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
              refX="8.6"
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

            <section id="political" data-node="political" class="political">
              <header class="pol-head">
                <h2>{{ t('school.political') }}</h2>
                <p class="pol-meta">
                  <span class="when">{{ politicalYears }}</span>
                  <span class="where">{{ politicalRegion }}</span>
                </p>
              </header>
              <div class="pol-track" :style="{ width: `${polLayout.trackW}px` }">
                <div class="pol-slot pol-slot-machiavelli" style="left: 0">
                  <PhilosopherCard :person="philosophers.machiavelli" />
                </div>
                <div
                  class="pol-slot pol-slot-hobbes"
                  :style="{ left: `${polLayout.hobbes}px` }"
                >
                  <PhilosopherCard :person="philosophers.hobbes" />
                </div>
                <div
                  class="pol-slot pol-slot-rousseau"
                  :style="{ left: `${polLayout.rousseau}px` }"
                >
                  <PhilosopherCard :person="philosophers.rousseau" />
                </div>
                <div
                  class="pol-slot pol-slot-mill"
                  :style="{ left: `${polLayout.mill}px` }"
                >
                  <PhilosopherCard :person="philosophers.mill" />
                </div>
                <div
                  class="pol-slot pol-slot-marx"
                  :style="{ left: `${polLayout.marx}px` }"
                >
                  <PhilosopherCard :person="philosophers.marx" />
                </div>
                <div
                  class="pol-slot pol-slot-rawls"
                  :style="{ left: `${polLayout.rawls}px` }"
                >
                  <PhilosopherCard :person="philosophers.rawls" />
                </div>
              </div>
            </section>
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
        </template>

        <template v-else>
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
.viewport-science {
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
  --fit-philosophy: clamp(
    var(--card-w-floor),
    calc((100dvh - 11rem) / 14),
    var(--card-w-cap)
  );
  --card-w: min(var(--fit-math), var(--fit-science), var(--fit-philosophy));
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
    '. . . . political political political political';
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
.graph.domain-math {
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
}

.science-atlas #molecularBiology :deep(.slot-crick) {
  grid-column: 3;
}

.science-atlas #molecularBiology :deep(.slot-watson) {
  grid-column: 4;
}

.graph.domain-science :deep(.math-bar) {
  margin-left: var(--math-left, 0px);
  width: var(--math-width, max-content);
  min-width: var(--math-width, 0px);
  flex: 0 0 auto;
  box-sizing: border-box;
}

.graph.domain-math :deep(.science-bar) {
  margin-left: var(--science-left, 0px);
  width: var(--science-width, max-content);
  min-width: var(--science-width, 0px);
  flex: 0 0 auto;
  box-sizing: border-box;
}

.graph.domain-science :deep(.philosophy-bar),
.graph.domain-math :deep(.philosophy-bar) {
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

.political {
  grid-area: political;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: start;
  justify-self: start;
  width: max-content;
  max-width: 100%;
  min-width: 0;
  overflow: visible;
  gap: 8px;
  margin-top: -2px;
  padding: 13px 10px 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(20, 24, 33, 0.42);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
}

.political::before {
  content: '';
  position: absolute;
  top: 8px;
  right: 10px;
  left: 10px;
  height: 3px;
  background: var(--c-political);
}

.pol-head {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 8px 10px;
  white-space: nowrap;
}

.pol-head h2 {
  margin: 0;
  font-family: var(--serif);
  font-size: 1.12rem;
  font-weight: 600;
  color: var(--cream);
  letter-spacing: 0.03em;
  line-height: 1.15;
}

.pol-meta {
  display: flex;
  gap: 8px;
  margin: 0;
  white-space: nowrap;
}

.pol-meta .when {
  color: var(--gold-2);
  font-size: 0.78rem;
}

.pol-meta .where {
  color: var(--muted);
  font-size: 0.72rem;
}

.pol-track {
  position: relative;
  z-index: 3;
  height: calc(var(--card-w, 56px) * 4 / 3 + var(--info-h, 1.55rem));
  min-width: 0;
}

.pol-slot {
  position: absolute;
  top: 0;
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
    --fit-philosophy: clamp(
      var(--card-w-floor),
      calc((100dvh - 9.5rem) / 14),
      var(--card-w-cap)
    );
    --card-w: min(var(--fit-math), var(--fit-science), var(--fit-philosophy));
    --info-h: 1.1rem;
    padding: 10px 32px 12px;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    padding-left: max(32px, env(safe-area-inset-left));
    padding-right: max(32px, env(safe-area-inset-right));
    gap: 8px;
  }

  .graph.domain-math,
  .graph.domain-science {
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
    --fit-philosophy: clamp(
      var(--card-w-floor),
      calc((100dvh - 9.5rem) / 14),
      var(--card-w-cap)
    );
    --card-w: min(var(--fit-math), var(--fit-science), var(--fit-philosophy));
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
  .graph.domain-science {
    height: 100%;
    min-height: 0;
    gap: 8px;
    padding-top: 4px;
    padding-bottom: max(6px, env(safe-area-inset-bottom));
  }

  .viewport-math,
  .viewport-science {
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

  .pol-head {
    flex-wrap: wrap;
    white-space: normal;
  }

  .pol-head h2 {
    font-size: 1rem;
  }
}

@media (max-width: 600px) {
  .graph {
    --gutter-x: 16px;
    --card-w-cap: 42px;
    --card-w: min(var(--fit-math), var(--fit-science), var(--fit-philosophy));
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
