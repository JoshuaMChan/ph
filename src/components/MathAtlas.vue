<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  hasDomain,
  mathDomainAccent,
  mathDomainOrder,
  mathematicians,
  type MathDomainId,
  type Mathematician,
} from '../data/mathematicians'
import { formatLifespan, formatYear } from '../utils/dates'

const { t } = useI18n()

const hovered = ref<string | null>(null)

const domains = mathDomainOrder

const people = mathematicians

const eraBreaks = computed(() => {
  /** Visual chapter ticks between columns (index = before this person). */
  const marks: { beforeId: string; key: string }[] = [
    { beforeId: 'descartes', key: 'ancient' },
    { beforeId: 'euler', key: 'earlyModern' },
    { beforeId: 'gauss', key: 'foundations' },
    { beforeId: 'hilbert', key: 'modern' },
  ]
  return marks
})

function eraBefore(person: Mathematician) {
  return eraBreaks.value.find((m) => m.beforeId === person.id)
}

function active(person: Mathematician, domain: MathDomainId) {
  return hasDomain(person, domain)
}

function spineStyle(person: Mathematician) {
  const idxs = domains
    .map((d, i) => (active(person, d) ? i : -1))
    .filter((i) => i >= 0)
  if (idxs.length < 2) return null
  const first = idxs[0]
  const last = idxs[idxs.length - 1]
  const row = 100 / domains.length
  return {
    top: `${first * row + row / 2}%`,
    height: `${(last - first) * row}%`,
  }
}

function onEnter(id: string) {
  hovered.value = id
}

function onLeave() {
  hovered.value = null
}
</script>

<template>
  <section class="math-atlas" data-node="math-atlas" aria-label="Mathematics">
    <header class="math-head">
      <div class="math-title-row">
        <h2>{{ t('domain.math') }}</h2>
        <p class="math-hint">{{ t('math.hint') }}</p>
      </div>
      <ul class="math-legend" aria-hidden="true">
        <li v-for="d in domains" :key="d" class="legend-item">
          <span
            class="legend-dot"
            :style="{ background: mathDomainAccent[d] }"
          />
          <span>{{ t(`mathDomain.${d}`) }}</span>
        </li>
      </ul>
    </header>

    <div class="math-board">
      <div class="math-labels" aria-hidden="true">
        <div
          v-for="d in domains"
          :key="d"
          class="math-label"
          :style="{ '--lane': mathDomainAccent[d] }"
        >
          <span class="lane-tick" />
          <span class="lane-name">{{ t(`mathDomain.${d}`) }}</span>
        </div>
        <div class="math-label-spacer" />
      </div>

      <div class="math-scroll">
        <div class="math-track">
          <template v-for="person in people" :key="person.id">
            <div
              v-if="eraBefore(person)"
              class="era-break"
              :aria-label="t(`mathEra.${eraBefore(person)!.key}`)"
            >
              <span class="era-label">{{
                t(`mathEra.${eraBefore(person)!.key}`)
              }}</span>
            </div>

            <article
              class="math-col"
              :class="{
                'is-hovered': hovered === person.id,
                'is-dim': hovered && hovered !== person.id,
              }"
              :data-node="person.id"
              @pointerenter="onEnter(person.id)"
              @pointerleave="onLeave"
            >
              <div class="marks">
                <span
                  v-if="spineStyle(person)"
                  class="spine"
                  :style="spineStyle(person)!"
                />
                <div
                  v-for="d in domains"
                  :key="d"
                  class="lane"
                  :class="{ on: active(person, d) }"
                  :style="{ '--lane': mathDomainAccent[d] }"
                >
                  <span class="axis" />
                  <span
                    class="mark"
                    :class="{ lit: active(person, d) }"
                    :title="
                      active(person, d) ? t(`mathDomain.${d}`) : undefined
                    "
                  />
                </div>
              </div>

              <div class="who">
                <p class="name">{{ t(`person.${person.id}`) }}</p>
                <p class="years">
                  <template v-if="person.birth.circa">c. </template
                  >{{ formatLifespan(person.birth, person.death) }}
                </p>
                <p class="native">{{ person.nativeName }}</p>
              </div>
            </article>
          </template>
        </div>
      </div>
    </div>

    <p class="math-axis-caption">
      <span class="axis-arrow" aria-hidden="true">←</span>
      {{ t('math.timeAxis') }}
      <span class="axis-arrow" aria-hidden="true">→</span>
      <span class="axis-range"
        >{{ formatYear(people[0].birth.year) }} –
        {{ formatYear(people[people.length - 1].birth.year) }}</span
      >
    </p>
  </section>
</template>

<style scoped>
.math-atlas {
  --col-w: 72px;
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: var(--math-left, 0px);
  width: max-content;
  min-width: min(100%, var(--math-width, 0px));
  flex: 1 1 auto;
  min-height: 0;
  padding: 4px 0 0;
  box-sizing: border-box;
}

.math-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 24px;
  padding: 0 4px;
  max-width: 100%;
}

.math-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 16px;
}

.math-head h2 {
  margin: 0;
  font-family: var(--serif);
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--cream);
}

.math-hint {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.math-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.math-board {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0 12px;
  align-items: stretch;
  min-height: 0;
  flex: 1 1 auto;
}

.math-labels {
  display: grid;
  grid-template-rows: repeat(4, 1fr) auto;
  gap: 0;
  padding-top: 2px;
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--bg);
  box-shadow: 8px 0 16px rgba(11, 12, 16, 0.55);
  padding-right: 10px;
}

.math-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  white-space: nowrap;
}

.lane-tick {
  width: 10px;
  height: 2px;
  border-radius: 1px;
  background: var(--lane);
  opacity: 0.85;
  flex: 0 0 auto;
}

.lane-name {
  font-family: var(--serif);
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--gold-2);
}

.math-label-spacer {
  height: 4.6rem;
}

.math-scroll {
  min-width: 0;
  overflow: visible;
}

.math-track {
  display: flex;
  align-items: stretch;
  gap: 0;
  width: max-content;
  min-height: 100%;
}

.era-break {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 36px;
  flex: 0 0 36px;
  position: relative;
  margin: 0 4px;
  padding-top: 2px;
}

.era-break::before {
  content: '';
  position: absolute;
  top: 1.4rem;
  bottom: 5.2rem;
  left: 50%;
  width: 1px;
  background: linear-gradient(
    180deg,
    rgba(212, 184, 122, 0.45),
    rgba(212, 184, 122, 0.12),
    transparent
  );
}

.era-label {
  position: relative;
  z-index: 1;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  white-space: nowrap;
  font-size: 0.62rem;
  letter-spacing: 0.22em;
  color: rgba(212, 184, 122, 0.7);
  padding: 4px 0;
}

.math-col {
  --mark: 9px;
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto;
  width: var(--col-w);
  flex: 0 0 var(--col-w);
  padding: 0 2px;
  transition:
    opacity 0.18s ease,
    filter 0.18s ease;
}

.math-col.is-dim {
  opacity: 0.38;
}

.math-col.is-hovered {
  opacity: 1;
  z-index: 1;
}

.marks {
  position: relative;
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  min-height: 148px;
}

.spine {
  position: absolute;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  border-radius: 2px;
  background: linear-gradient(
    180deg,
    rgba(232, 213, 163, 0.15),
    rgba(232, 213, 163, 0.55),
    rgba(232, 213, 163, 0.15)
  );
  pointer-events: none;
  z-index: 0;
}

.math-col.is-hovered .spine {
  background: linear-gradient(
    180deg,
    rgba(232, 213, 163, 0.25),
    rgba(232, 213, 163, 0.85),
    rgba(232, 213, 163, 0.25)
  );
}

.lane {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.axis {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: rgba(212, 184, 122, 0.14);
  pointer-events: none;
}

.lane.on .axis {
  background: color-mix(in srgb, var(--lane) 35%, transparent);
}

.mark {
  position: relative;
  width: var(--mark);
  height: var(--mark);
  border-radius: 50%;
  border: 1px solid rgba(212, 184, 122, 0.18);
  background: transparent;
  box-sizing: border-box;
  transition:
    transform 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.mark.lit {
  border-color: color-mix(in srgb, var(--lane) 80%, white);
  background: var(--lane);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--lane) 22%, transparent),
    0 0 12px color-mix(in srgb, var(--lane) 45%, transparent);
}

.math-col.is-hovered .mark.lit {
  transform: scale(1.18);
}

.who {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 2px 4px;
  text-align: center;
  border-top: 1px solid rgba(212, 184, 122, 0.12);
  min-height: 4.6rem;
}

.math-col.is-hovered .who {
  border-top-color: rgba(212, 184, 122, 0.4);
}

.name {
  margin: 0;
  font-family: var(--serif);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: 0.02em;
  color: var(--cream);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.years {
  margin: 0;
  font-size: 0.58rem;
  letter-spacing: 0.02em;
  color: var(--gold);
  opacity: 0.9;
}

.native {
  margin: 0;
  font-size: 0.52rem;
  line-height: 1.2;
  color: var(--muted);
  opacity: 0.75;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.math-axis-caption {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 0 0;
  padding: 0 4px;
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.axis-arrow {
  color: var(--gold);
  opacity: 0.7;
}

.axis-range {
  margin-left: 4px;
  letter-spacing: 0.04em;
  color: var(--gold-2);
  opacity: 0.85;
}

@media (max-width: 720px) {
  .math-atlas {
    --col-w: 64px;
  }

  .math-label-spacer,
  .who {
    min-height: 5rem;
  }

  .marks {
    min-height: 128px;
  }
}
</style>
