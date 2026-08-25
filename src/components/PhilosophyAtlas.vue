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

type Link = {
  id: string
  d: string
  color: string
  dashed: boolean
}

type Side = 'left' | 'right' | 'top' | 'bottom'

const graph = ref<HTMLElement | null>(null)
const canvas = ref({ w: 0, h: 0 })
const links = ref<Link[]>([])

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
    const midY = y1 + (y2 - y1) * 0.65
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x1} ${y2}, ${x2} ${y2}`
  }

  const midX = x1 + dx * 0.5
  const midY = y1 + dy * 0.5
  if (horizontalOut) {
    return `M ${x1} ${y1} C ${midX} ${y1}, ${x2} ${midY}, ${x2} ${y2}`
  }
  return `M ${x1} ${y1} C ${x1} ${midY}, ${midX} ${y2}, ${x2} ${y2}`
}

function measure() {
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

onBeforeUnmount(() => observer?.disconnect())

watch(locale, () => void nextTick(measure))
</script>

<template>
  <div class="shell">
    <SiteHeader />
    <div class="viewport">
      <main id="top" ref="graph" class="graph">
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

        <article id="greece" data-node="greece" class="node">
          <SchoolBlock school-id="greece" />
        </article>

        <article id="stoicism" data-node="stoicism" class="node">
          <SchoolBlock school-id="stoicism" />
        </article>

        <article id="scholasticism" data-node="scholasticism" class="node">
          <SchoolBlock school-id="scholasticism" />
        </article>

        <div id="modern" class="modern">
          <div class="modern-pair">
            <article
              id="rationalism"
              data-node="rationalism"
              class="node modern-school"
              :style="{ '--accent': schools.rationalism.accent }"
            >
              <header class="school-head">
                <h2>{{ t('school.rationalism') }}</h2>
                <p class="school-meta">
                  <span class="when">{{
                    formatEraYears(
                      schools.rationalism.yearStart,
                      schools.rationalism.yearEnd,
                    )
                  }}</span>
                  <span class="where">{{
                    schools.rationalism.regionKeys.map((key) => t(`region.${key}`)).join(' · ')
                  }}</span>
                </p>
              </header>
              <PhilosopherCard :person="philosophers.descartes" />
              <PhilosopherCard :person="philosophers.spinoza" />
              <PhilosopherCard :person="philosophers.leibniz" />
            </article>
            <article
              id="empiricism"
              data-node="empiricism"
              class="node modern-school"
              :style="{ '--accent': schools.empiricism.accent }"
            >
              <header class="school-head">
                <h2>{{ t('school.empiricism') }}</h2>
                <p class="school-meta">
                  <span class="when">{{
                    formatEraYears(
                      schools.empiricism.yearStart,
                      schools.empiricism.yearEnd,
                    )
                  }}</span>
                  <span class="where">{{
                    schools.empiricism.regionKeys.map((key) => t(`region.${key}`)).join(' · ')
                  }}</span>
                </p>
              </header>
              <PhilosopherCard :person="philosophers.locke" />
              <PhilosopherCard :person="philosophers.berkeley" />
              <PhilosopherCard :person="philosophers.hume" />
            </article>
          </div>
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
          <div class="pol-modern">
            <header class="pol-head">
              <h2>{{ t('school.political') }}</h2>
              <p class="pol-meta">
                <span class="when">{{ politicalYears }}</span>
                <span class="where">{{ politicalRegion }}</span>
              </p>
            </header>
            <div class="pol-people">
              <PhilosopherCard :person="philosophers.machiavelli" />
              <PhilosopherCard :person="philosophers.hobbes" />
            </div>
          </div>
          <div class="pol-classical">
            <PhilosopherCard :person="philosophers.rousseau" />
          </div>
          <div class="pol-analytic">
            <PhilosopherCard :person="philosophers.marx" />
          </div>
        </section>
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
  overflow-x: auto;
  overflow-y: hidden;
}

.graph {
  --gutter-x: 40px;
  --card-w: 56px;
  --info-h: 1.55rem;
  position: relative;
  display: grid;
  grid-template-columns: max-content max-content max-content max-content max-content max-content max-content;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-areas:
    'greece stoicism scholasticism modern classical lifeCol existCol'
    '. . . political political political existCol';
  gap: 10px var(--gutter-x);
  padding: 14px 40px 16px;
  height: 100%;
  min-height: 0;
  width: max-content;
  min-width: 100%;
  align-items: center;
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

.node,
.modern,
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

#greece {
  grid-area: greece;
  align-self: center;
}

#stoicism {
  grid-area: stoicism;
  align-self: center;
}

#scholasticism {
  grid-area: scholasticism;
  align-self: center;
}

.modern {
  grid-area: modern;
  align-self: center;
  min-height: 0;
}

.modern-pair {
  display: grid;
  grid-template-columns: max-content max-content;
  grid-template-rows: auto auto auto auto;
  column-gap: 16px;
  row-gap: 8px;
  align-items: start;
}

.modern-school {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: 1 / -1;
  row-gap: 8px;
  border-top: 3px solid var(--accent);
}

.school-head {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 10px;
  white-space: nowrap;
  padding: 2px 2px 0;
}

.school-head h2 {
  margin: 0;
  font-family: var(--serif);
  font-size: 1.12rem;
  font-weight: 600;
  color: var(--cream);
  letter-spacing: 0.03em;
  line-height: 1.15;
}

.school-meta {
  display: flex;
  gap: 8px;
  margin: 0;
  white-space: nowrap;
}

.school-meta .when {
  color: var(--gold-2);
  font-size: 0.78rem;
}

.school-meta .where {
  color: var(--muted);
  font-size: 0.72rem;
}

#classical {
  grid-area: classical;
  align-self: center;
}

.life-col,
.exist-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  display: grid;
  grid-template-columns: subgrid;
  align-items: end;
  align-self: start;
  justify-self: stretch;
  column-gap: var(--gutter-x);
  margin-top: -2px;
  padding: 10px 10px 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(20, 24, 33, 0.42);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
  border-top: 3px solid var(--c-political);
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

.pol-modern,
.pol-classical,
.pol-analytic {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: flex-end;
  gap: 14px;
  min-width: 0;
}

.pol-modern {
  grid-column: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  justify-content: flex-end;
}

.pol-people {
  display: flex;
  align-items: flex-end;
  gap: 28px;
}

.pol-classical {
  grid-column: 2;
  justify-content: flex-start;
}

.pol-analytic {
  grid-column: 3;
  justify-content: flex-start;
  width: max-content;
}

@media (max-height: 760px) {
  .graph {
    --card-w: 48px;
    --info-h: 1.4rem;
    padding: 10px 32px 12px;
    gap: 8px var(--gutter-x);
  }
}
</style>
