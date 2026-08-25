<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { graphEdges } from '../data/graph'
import SchoolBlock from './SchoolBlock.vue'
import SiteHeader from './SiteHeader.vue'

const { locale } = useI18n()

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

function curve(x1: number, y1: number, x2: number, y2: number) {
  const cx = x1 + (x2 - x1) * 0.55
  return `M ${x1} ${y1} C ${cx} ${y1}, ${x1 + (x2 - x1) * 0.45} ${y2}, ${x2} ${y2}`
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
    const start = point(from, edge.fromSide ?? 'right')
    const end = point(to, edge.toSide ?? 'left')
    if (edge.viaCluster) {
      const cluster = rootEl.querySelector(`[data-node="${edge.viaCluster}"]`)
      if (cluster) start[0] = box(cluster, root).right
    }
    return [
      {
        id: `${edge.from}-${edge.to}`,
        d: curve(start[0], start[1], end[0], end[1]),
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
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>
          <path
            v-for="link in links"
            :key="link.id"
            :d="link.d"
            fill="none"
            :stroke="link.color"
            :stroke-dasharray="link.dashed ? '7 6' : 'none'"
            stroke-width="2.2"
            stroke-linecap="round"
            marker-end="url(#arrow)"
          />
        </svg>

        <article id="greece" data-node="greece" class="node">
          <SchoolBlock school-id="greece" />
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
          <article id="structuralism" data-node="structuralism" class="node">
            <SchoolBlock school-id="structuralism" />
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

        <article id="political" data-node="political" class="node">
          <SchoolBlock school-id="political" />
        </article>
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
  --col-gap: 6.5rem;
  --gutter-x: 40px;
  --card-w: 70px;
  --info-h: 3.2rem;
  position: relative;
  display: grid;
  grid-template-columns: max-content var(--col-gap) max-content max-content max-content;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-areas:
    'greece . modern classical lineage'
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
.lineage {
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
  grid-template-columns: max-content max-content max-content;
  grid-template-areas:
    'life existentialism analytic'
    'phenomenology structuralism analytic';
  gap: 12px 36px;
  align-items: center;
}

#life {
  grid-area: life;
}

#structuralism {
  grid-area: structuralism;
  align-self: center;
}

#phenomenology {
  grid-area: phenomenology;
}

#existentialism {
  grid-area: existentialism;
}

#analytic {
  grid-area: analytic;
  align-self: center;
}

#political {
  grid-area: political;
  width: auto;
  justify-self: stretch;
}

@media (max-height: 760px) {
  .graph {
    --card-w: 62px;
    --info-h: 3rem;
    padding: 10px 32px 12px;
    gap: 10px var(--gutter-x);
  }
}
</style>
