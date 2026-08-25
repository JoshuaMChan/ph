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
const politicalYears = formatEraYears(political.yearStart, political.yearEnd)
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
  const horizontalOut = fromSide === 'left' || fromSide === 'right'
  const horizontalIn = toSide === 'left' || toSide === 'right'

  if (horizontalOut && horizontalIn) {
    const mid = x1 + (x2 - x1) * 0.5
    return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`
  }

  if (!horizontalOut && !horizontalIn) {
    const mid = y1 + (y2 - y1) * 0.5
    return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`
  }

  const midX = x1 + (x2 - x1) * 0.5
  const midY = y1 + (y2 - y1) * 0.5
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

        <div id="split" class="lineage">
          <article id="life" data-node="life" class="node">
            <SchoolBlock school-id="life" />
          </article>
          <article id="deconstruction" data-node="deconstruction" class="node">
            <SchoolBlock school-id="deconstruction" />
          </article>
          <article id="phenomenology" data-node="phenomenology" class="node">
            <SchoolBlock school-id="phenomenology" />
          </article>
          <article id="existentialism" data-node="existentialism" class="node">
            <SchoolBlock school-id="existentialism" />
          </article>
          <article id="analytic" data-node="analytic" class="node">
            <SchoolBlock school-id="analytic" />
          </article>
        </div>

        <section id="political" class="political">
          <header class="pol-head" style="--accent: var(--c-political)">
            <h2>{{ t('school.political') }}</h2>
            <p class="pol-meta">
              <span class="when">{{ politicalYears }}</span>
              <span class="where">{{ politicalRegion }}</span>
            </p>
          </header>
          <div class="pol-modern">
            <PhilosopherCard :person="philosophers.machiavelli" />
            <PhilosopherCard :person="philosophers.hobbes" />
          </div>
          <div class="pol-classical">
            <PhilosopherCard :person="philosophers.rousseau" />
          </div>
          <div class="pol-lineage">
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
  grid-template-columns: max-content max-content max-content max-content max-content;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-areas:
    'greece scholasticism modern classical lineage'
    'political political political political political';
  gap: 14px var(--gutter-x);
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
  z-index: 0;
  pointer-events: none;
  overflow: visible;
  color: var(--gold);
}

.node,
.modern,
.lineage,
.political {
  position: relative;
  z-index: 1;
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

#scholasticism {
  grid-area: scholasticism;
  align-self: center;
}

.modern {
  grid-area: modern;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  min-height: 0;
}

#classical {
  grid-area: classical;
  align-self: center;
}

.lineage {
  grid-area: lineage;
  display: grid;
  grid-template-columns: max-content max-content max-content max-content;
  grid-template-areas:
    'life existentialism analytic deconstruction'
    'phenomenology . . .';
  gap: 12px 36px;
  align-items: center;
}

#life {
  grid-area: life;
}

#existentialism {
  grid-area: existentialism;
  align-self: center;
}

#analytic {
  grid-area: analytic;
  align-self: center;
}

#deconstruction {
  grid-area: deconstruction;
  align-self: center;
}

#phenomenology {
  grid-area: phenomenology;
}

.political {
  grid-area: political;
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: end;
  column-gap: var(--gutter-x);
  padding: 10px 10px 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(20, 24, 33, 0.88);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
  border-top: 3px solid var(--c-political);
}

.pol-head {
  grid-column: 1 / 3;
  align-self: center;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 10px;
  padding-left: 2px;
}

.pol-head h2 {
  margin: 0;
  font-family: var(--serif);
  font-size: 1.12rem;
  font-weight: 600;
  color: var(--cream);
  letter-spacing: 0.03em;
  line-height: 1.15;
  white-space: nowrap;
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
.pol-lineage {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  min-width: 0;
}

.pol-modern {
  grid-column: 3;
  justify-content: flex-start;
}

.pol-classical {
  grid-column: 4;
  justify-content: flex-start;
}

.pol-lineage {
  grid-column: 5;
  justify-content: flex-start;
}

@media (max-height: 760px) {
  .graph {
    --card-w: 48px;
    --info-h: 1.4rem;
    padding: 10px 32px 12px;
    gap: 10px var(--gutter-x);
  }
}
</style>
