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
import type { Philosopher } from '../types'
import PhilosopherCard from './PhilosopherCard.vue'

const { t } = useI18n()

const hoveredId = ref<string | null>(null)

const domains = mathDomainOrder
const people = mathematicians

type EraSection = {
  key: string
  people: Mathematician[]
}

/** Same band idea as philosophy epochs: label sits above its stretch of people. */
const eraSections = computed<EraSection[]>(() => {
  const starts: { key: string; id: string }[] = [
    { key: 'ancient', id: 'euclid' },
    { key: 'earlyModern', id: 'descartes' },
    { key: 'foundations', id: 'euler' },
    { key: 'modern', id: 'hilbert' },
  ]
  const indexes = starts.map((s) => people.findIndex((p) => p.id === s.id))
  return starts.map((s, i) => {
    const from = indexes[i] < 0 ? people.length : indexes[i]
    const to =
      i + 1 < indexes.length && indexes[i + 1] >= 0
        ? indexes[i + 1]
        : people.length
    return { key: s.key, people: people.slice(from, to) }
  })
})

const hoveredPerson = computed(() =>
  people.find((p) => p.id === hoveredId.value) ?? null,
)

const focusDomains = computed(() => {
  const person = hoveredPerson.value
  if (!person) return new Set<MathDomainId>()
  return new Set(person.domains)
})

const stubBorn = {
  city: '',
  region: '',
  lat: 0,
  lng: 0,
  countryId: '',
}

function asCardPerson(person: Mathematician): Philosopher {
  return {
    id: person.id,
    nativeName: person.nativeName,
    country: person.country,
    portrait: person.portrait,
    birth: person.birth,
    death: person.death,
    born: stubBorn,
  }
}

function active(person: Mathematician, domain: MathDomainId) {
  return hasDomain(person, domain)
}

function domainFocused(domain: MathDomainId) {
  return focusDomains.value.has(domain)
}

function onEnter(id: string) {
  hoveredId.value = id
}

function onLeave() {
  hoveredId.value = null
}
</script>

<template>
  <section
    class="math-atlas"
    :class="{ 'has-focus': hoveredId }"
    data-node="math-atlas"
    aria-label="Mathematics"
  >
    <div class="math-board">
      <div class="math-labels" aria-hidden="true">
        <div class="math-label-epoch-spacer" />
        <div
          v-for="d in domains"
          :key="d"
          class="math-label"
          :class="{ 'is-focus': domainFocused(d) }"
          :style="{ '--lane': mathDomainAccent[d] }"
        >
          <span class="lane-tick" />
          <span class="lane-name">{{ t(`mathDomain.${d}`) }}</span>
        </div>
        <div class="math-label-spacer" />
      </div>

      <div class="math-scroll">
        <!-- Epoch row: same UI language as philosophy Ontology / Epistemology. -->
        <div class="math-epochs">
          <p
            v-for="sec in eraSections"
            :key="sec.key"
            class="epoch"
            :style="{ flex: Math.max(sec.people.length, 1) }"
          >
            {{ t(`mathEra.${sec.key}`) }}
          </p>
        </div>

        <div class="math-people">
          <div class="rail-layer" aria-hidden="true">
            <div
              v-for="d in domains"
              :key="d"
              class="rail"
              :class="{ 'is-focus': domainFocused(d) }"
              :style="{ '--lane': mathDomainAccent[d] }"
            />
          </div>

          <div class="math-track">
            <div
              v-for="sec in eraSections"
              :key="sec.key"
              class="math-segment"
              :style="{ flex: Math.max(sec.people.length, 1) }"
            >
              <article
                v-for="person in sec.people"
                :key="person.id"
                class="math-col"
                :class="{ 'is-hovered': hoveredId === person.id }"
                @pointerenter="onEnter(person.id)"
                @pointerleave="onLeave"
              >
                <div class="marks">
                  <div
                    v-for="d in domains"
                    :key="d"
                    class="lane"
                    :style="{ '--lane': mathDomainAccent[d] }"
                  >
                    <span
                      v-if="active(person, d)"
                      class="mark lit"
                      :class="{
                        'in-focus': domainFocused(d),
                        'is-own': hoveredId === person.id,
                      }"
                      :title="t(`mathDomain.${d}`)"
                    />
                  </div>
                </div>

                <div class="who">
                  <PhilosopherCard
                    :person="asCardPerson(person)"
                    :quotes="false"
                    stacked
                  />
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.math-atlas {
  --col-w: var(--card-w, 56px);
  --card-block-h: calc(var(--card-w, 56px) * 4 / 3 + 2.6rem);
  --marks-h: 148px;
  --epoch-h: 1.6rem;
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  margin-left: var(--math-left, 0px);
  width: max(var(--math-width, 0px), max-content);
  min-width: var(--math-width, max-content);
  max-width: none;
  flex: 1 1 auto;
  min-height: 0;
  padding: 8px 0;
  box-sizing: border-box;
}

.math-board {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 0 12px;
  align-items: stretch;
  flex: 0 1 auto;
  min-height: 0;
  width: 100%;
}

.math-labels {
  display: grid;
  grid-template-rows: var(--epoch-h) repeat(4, 1fr) auto;
  gap: 0;
  height: calc(var(--epoch-h) + var(--marks-h) + var(--card-block-h));
  position: sticky;
  left: 0;
  z-index: 2;
  padding: 0 2.75rem 0 2px;
  pointer-events: none;
  isolation: isolate;
  background:
    linear-gradient(
      90deg,
      var(--bg) 0%,
      var(--bg) 42%,
      color-mix(in srgb, var(--bg) 88%, transparent) 68%,
      color-mix(in srgb, var(--bg) 35%, transparent) 86%,
      transparent 100%
    );
  -webkit-mask-image: linear-gradient(
    90deg,
    #000 0%,
    #000 58%,
    rgba(0, 0, 0, 0.55) 82%,
    transparent 100%
  );
  mask-image: linear-gradient(
    90deg,
    #000 0%,
    #000 58%,
    rgba(0, 0, 0, 0.55) 82%,
    transparent 100%
  );
}

.math-labels::before {
  content: '';
  position: absolute;
  inset: 8% auto 18% 0;
  width: 2px;
  border-radius: 2px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(212, 184, 122, 0.28),
    transparent
  );
  opacity: 0.9;
}

.math-label-epoch-spacer {
  min-height: var(--epoch-h);
}

.math-label {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 0;
  white-space: nowrap;
  transition:
    color 0.18s ease,
    filter 0.18s ease;
}

.math-label.is-focus .lane-name {
  color: var(--cream);
  text-shadow:
    0 0 18px color-mix(in srgb, var(--lane) 35%, transparent),
    0 1px 10px rgba(11, 12, 16, 0.95);
}

.math-label.is-focus .lane-tick {
  opacity: 1;
  transform: scaleX(1);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--lane) 35%, transparent),
    0 0 14px color-mix(in srgb, var(--lane) 60%, transparent);
}

.lane-tick {
  /* Fixed slot so focus never changes sticky column width (avoids layout jitter). */
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background: var(--lane);
  opacity: 0.9;
  flex: 0 0 16px;
  transform: scaleX(0.7);
  transform-origin: left center;
  box-shadow: 0 0 10px color-mix(in srgb, var(--lane) 40%, transparent);
  transition:
    transform 0.18s ease,
    opacity 0.18s ease,
    box-shadow 0.18s ease;
}

.lane-name {
  font-family: var(--serif);
  font-size: 0.84rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  color: var(--gold-2);
  text-shadow: 0 1px 12px rgba(11, 12, 16, 0.95);
  transition:
    color 0.18s ease,
    text-shadow 0.18s ease;
}

.math-label-spacer {
  height: var(--card-block-h);
}

.math-scroll {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  width: 100%;
  overflow: visible;
}

.math-epochs {
  display: flex;
  align-items: end;
  gap: var(--gutter-x, 28px);
  height: var(--epoch-h);
  width: 100%;
  min-width: max-content;
  box-sizing: border-box;
}

/* Match PhilosophyAtlas `.epoch` (Ontology / Epistemology / Contemporary). */
.epoch {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0;
  padding: 0 2px;
  min-width: 0;
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

.math-people {
  position: relative;
  width: 100%;
  min-width: max-content;
}

.rail-layer {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: var(--marks-h);
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  pointer-events: none;
  z-index: 0;
}

.rail {
  position: relative;
}

.rail::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: color-mix(in srgb, var(--lane) 28%, transparent);
  transition:
    height 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.rail.is-focus::before {
  height: 2px;
  background: color-mix(in srgb, var(--lane) 78%, transparent);
  box-shadow: 0 0 16px color-mix(in srgb, var(--lane) 40%, transparent);
}

.math-track {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: stretch;
  gap: var(--gutter-x, 28px);
  width: 100%;
  min-width: max-content;
  box-sizing: border-box;
}

.math-segment {
  display: flex;
  align-items: stretch;
  justify-content: space-evenly;
  gap: 8px;
  min-width: 0;
}

.math-col {
  --mark: 10px;
  position: relative;
  display: grid;
  grid-template-rows: var(--marks-h) auto;
  width: max-content;
  flex: 0 0 auto;
  padding: 0;
  overflow: visible;
}

.marks {
  position: relative;
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  height: var(--marks-h);
  width: var(--card-w, 56px);
  margin: 0 auto;
}

.lane {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mark {
  position: relative;
  width: var(--mark);
  height: var(--mark);
  border-radius: 50%;
  box-sizing: border-box;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    opacity 0.16s ease;
}

.mark.lit {
  border: 1px solid color-mix(in srgb, var(--lane) 80%, white);
  background: var(--lane);
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--lane) 18%, transparent),
    0 0 10px color-mix(in srgb, var(--lane) 40%, transparent);
}

.math-atlas.has-focus .mark.lit.in-focus {
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--lane) 30%, transparent),
    0 0 18px color-mix(in srgb, var(--lane) 58%, transparent);
}

.math-col.is-hovered .mark.lit {
  transform: scale(1.28);
}

.who {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
  border-top: 1px solid rgba(212, 184, 122, 0.12);
  min-height: var(--card-block-h);
  box-sizing: border-box;
  overflow: visible;
  transition: border-top-color 0.16s ease;
}

.math-col.is-hovered .who {
  border-top-color: rgba(212, 184, 122, 0.45);
}

@media (max-width: 720px) {
  .math-atlas {
    --marks-h: 128px;
  }

  .epoch {
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    gap: 8px;
  }
}
</style>
