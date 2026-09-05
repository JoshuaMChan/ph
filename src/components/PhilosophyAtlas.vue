<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { graphEdges } from '../data/graph'
import { philosophers, schools } from '../data/philosophers'
import { formatEraYears } from '../utils/dates'
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

type Domain = 'philosophy' | 'science'
const activeDomain = ref<Domain>('philosophy')

function openDomain(domain: Domain) {
  if (activeDomain.value === domain) return
  const scrollLeft = viewport.value?.scrollLeft ?? 0
  const scrollTop = viewport.value?.scrollTop ?? 0
  activeDomain.value = domain
  dismissScrollHint()

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
    if (
      domain === 'philosophy' &&
      viewport.value &&
      viewport.value.scrollWidth > viewport.value.clientWidth + 24
    ) {
      showScrollHint.value = true
      hintTimer = window.setTimeout(() => {
        showScrollHint.value = false
        hintTimer = null
      }, 4200)
    }
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
const showScrollHint = ref(false)
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
  scienceLeft: 0,
  scienceWidth: 0,
  philosophyLeft: 0,
  philosophyWidth: 0,
})

const slotVars = computed(() => ({
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
    if (!modern || !tree) return

    const scienceLeft = Math.max(0, Math.round(relLeft(modern)))
    const treeRight = Math.round(relRight(tree))
    const barWidth = sciBar
      ? Math.round((sciBar as HTMLElement).offsetWidth)
      : 0
    const scienceWidth = Math.max(barWidth, treeRight - scienceLeft)
    const philosophyLeft = Math.max(0, Math.round(relLeft(tree)))
    const philosophyWidth = Math.round((tree as HTMLElement).offsetWidth)

    const next = {
      scienceLeft,
      scienceWidth,
      philosophyLeft,
      philosophyWidth,
    }
    const prev = slotGeom.value
    if (
      Math.abs(prev.scienceLeft - next.scienceLeft) > 0.5 ||
      Math.abs(prev.scienceWidth - next.scienceWidth) > 0.5 ||
      Math.abs(prev.philosophyLeft - next.philosophyLeft) > 0.5 ||
      Math.abs(prev.philosophyWidth - next.philosophyWidth) > 0.5
    ) {
      slotGeom.value = next
    }
    return
  }

  // Science domain: keep left edges stable; stretch philosophy bar to QFT's right edge.
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

  const next = {
    scienceLeft,
    scienceWidth,
    philosophyLeft,
    philosophyWidth,
  }
  const prev = slotGeom.value
  if (
    Math.abs(prev.scienceLeft - next.scienceLeft) > 0.5 ||
    Math.abs(prev.scienceWidth - next.scienceWidth) > 0.5 ||
    Math.abs(prev.philosophyLeft - next.philosophyLeft) > 0.5 ||
    Math.abs(prev.philosophyWidth - next.philosophyWidth) > 0.5
  ) {
    slotGeom.value = next
  }
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

  // Branch upward into the science lane: go up, then across into the left edge
  if (fromSide === 'top' && toSide === 'left') {
    // Same-row rightward from a portrait top: rise above, then into left
    if (x2 > x1 && y2 >= y1 - 40) {
      const up = Math.min(y1, y2) - 28
      return `M ${x1} ${y1} C ${x1} ${up}, ${x2} ${up}, ${x2} ${y2}`
    }
    // From below into a box's left edge (scholasticism → science-bar, etc.):
    // soft quarter-turn instead of a sharp elbow.
    if (y2 < y1) {
      const r = Math.min(56, Math.abs(dx) * 0.5, Math.abs(dy) * 0.45)
      const cornerY = y2 + r
      const cornerX = x1 + Math.min(r, Math.max(0, dx))
      // Prefer rising near the start, then sweeping right into the target.
      if (x2 >= x1) {
        return `M ${x1} ${y1} L ${x1} ${cornerY} C ${x1} ${y2}, ${x1} ${y2}, ${cornerX} ${y2} L ${x2} ${y2}`
      }
      const elbowX = x2 - 28
      return `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.45}, ${elbowX} ${y2 + r}, ${elbowX} ${y2} L ${x2} ${y2}`
    }
    const midY = y1 + (y2 - y1) * 0.55
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
    // Philosophy → science: physics first (astronomy); chemistry & biology share one later x.
    // Nudge fork slightly left of each box's left edge.
    const forkNudge = 28
    if (edge.from === 'philosophy-bar' && edge.to === 'astronomy') {
      start[0] = end[0] - forkNudge
    }
    if (
      edge.from === 'philosophy-bar' &&
      (edge.to === 'chemistry' || edge.to === 'biology')
    ) {
      const chem = rootEl.querySelector('[data-node="chemistry"]')
      const bio = rootEl.querySelector('[data-node="biology"]')
      if (chem && bio) {
        const edgeLeft = Math.min(box(chem, root).left, box(bio, root).left)
        start[0] = edgeLeft - forkNudge
        end[0] = edgeLeft
      } else {
        start[0] = end[0] - forkNudge
      }
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
let hintTimer: number | null = null

function dismissScrollHint() {
  showScrollHint.value = false
  if (hintTimer !== null) {
    window.clearTimeout(hintTimer)
    hintTimer = null
  }
}

function onViewportScroll() {
  dismissScrollHint()
}

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
    const el = viewport.value
    if (el && el.scrollWidth > el.clientWidth + 24) {
      showScrollHint.value = true
      hintTimer = window.setTimeout(() => {
        showScrollHint.value = false
        hintTimer = null
      }, 4200)
    }
  })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  dismissScrollHint()
})

watch(locale, () => void nextTick(measure))
watch(activeDomain, () => void nextTick(measure))
</script>

<template>
  <div class="shell">
    <SiteHeader />
    <div ref="viewport" class="viewport" @scroll.passive="onViewportScroll">
      <p v-if="showScrollHint" class="scroll-hint">{{ t('ui.scroll') }}</p>
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
              refX="9"
              refY="5"
              markerWidth="10"
              markerHeight="10"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M 1 1.2 L 9 5 L 1 8.8 z" fill="context-stroke" />
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

            <button
              id="science-bar"
              type="button"
              data-node="science-bar"
              class="domain-bar science-bar"
              @click="openDomain('science')"
            >
              <span class="domain-bar-label">{{ t('domain.science') }}</span>
            </button>

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

        <template v-else>
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
            <article id="chemistry" data-node="chemistry" class="node">
              <SchoolBlock school-id="chemistry" />
            </article>
            <article id="biology" data-node="biology" class="node">
              <SchoolBlock school-id="biology" />
            </article>
          </div>
          <button
            id="philosophy-bar"
            type="button"
            data-node="philosophy-bar"
            class="domain-bar philosophy-bar"
            @click="openDomain('philosophy')"
          >
            <span class="domain-bar-label">{{ t('domain.philosophy') }}</span>
          </button>
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

.scroll-hint {
  position: sticky;
  top: 10px;
  left: 0;
  z-index: 8;
  width: max-content;
  max-width: calc(100% - 28px);
  margin: 0 0 -28px 14px;
  padding: 7px 12px;
  border: 1px solid rgba(212, 184, 122, 0.35);
  border-radius: 999px;
  background: rgba(14, 16, 22, 0.88);
  color: var(--gold-2);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  pointer-events: none;
  backdrop-filter: blur(10px);
}

.graph {
  --gutter-x: 40px;
  --card-w: 56px;
  --info-h: 1.55rem;
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

.philosophy-atlas {
  --gutter-x: 40px;
  position: relative;
  display: grid;
  grid-template-columns: max-content max-content max-content max-content max-content max-content max-content max-content;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  grid-template-areas:
    'epochOnto epochOnto epochOnto epochOnto epochEpist epochEpist epochContemp epochContemp'
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

.graph.domain-science {
  justify-content: flex-start;
}

.science-atlas {
  --gutter-x: 40px;
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: max-content max-content max-content max-content max-content;
  grid-template-rows: auto auto auto auto;
  grid-template-areas:
    'astronomy classicalMechanics electrodynamics relativity .'
    '. . statisticalPhysics quantumMechanics quantumFieldTheory'
    '. . chemistry . .'
    '. . biology . .';
  gap: 16px var(--gutter-x);
  margin-left: var(--science-left, 0px);
  width: max-content;
  flex: 1 1 auto;
  align-content: start;
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

.science-atlas #chemistry {
  grid-area: chemistry;
}

.science-atlas #biology {
  grid-area: biology;
}

.graph.domain-science .philosophy-bar {
  margin-left: var(--philosophy-left, 0px);
  width: var(--philosophy-width, max-content);
  min-width: var(--philosophy-width, 0px);
  flex: 0 0 auto;
  box-sizing: border-box;
}

.domain-bar {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  margin: 0;
  padding: 10px 14px;
  border-radius: 10px;
  font: inherit;
  cursor: pointer;
  text-align: center;
  box-sizing: border-box;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.domain-bar:hover {
  filter: brightness(1.08);
}

.domain-bar:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}

.domain-bar-label {
  font-family: var(--serif);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.science-bar {
  grid-area: science;
  justify-self: stretch;
  align-self: center;
  border: 1px solid rgba(74, 155, 184, 0.4);
  background: rgba(74, 155, 184, 0.1);
  color: #9ecfe0;
}

.philosophy-bar {
  border: 1px solid var(--line);
  background: rgba(212, 184, 122, 0.08);
  color: var(--gold-2);
}

.science-slot > .node {
  width: max-content;
  box-sizing: border-box;
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

#astronomy {
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
    --card-w: 48px;
    --info-h: 1.4rem;
    padding: 10px 32px 12px;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    padding-left: max(32px, env(safe-area-inset-left));
    padding-right: max(32px, env(safe-area-inset-right));
    gap: 8px;
  }

  .philosophy-atlas {
    gap: 6px var(--gutter-x);
  }
}

@media (max-width: 900px) {
  .scroll-hint {
    top: 8px;
    margin-left: max(12px, env(safe-area-inset-left));
  }

  .graph {
    --gutter-x: 22px;
    --card-w: 46px;
    --info-h: 1.45rem;
    height: auto;
    min-height: 100%;
    gap: 12px;
    padding: 8px 18px 24px;
    padding-bottom: max(24px, calc(env(safe-area-inset-bottom) + 12px));
    padding-left: max(18px, env(safe-area-inset-left));
    padding-right: max(18px, env(safe-area-inset-right));
    align-items: flex-start;
  }

  .philosophy-atlas {
    --gutter-x: 22px;
    grid-template-rows: auto auto auto auto;
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
    --card-w: 42px;
    --info-h: 1.35rem;
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
