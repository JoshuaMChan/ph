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

const hoveredPerson = computed(() =>
  people.find((p) => p.id === hoveredId.value) ?? null,
)

const focusDomains = computed(() => {
  const person = hoveredPerson.value
  if (!person) return new Set<MathDomainId>()
  return new Set(person.domains)
})

const eraBreaks = computed(() => {
  const marks: { beforeId: string; key: string }[] = [
    { beforeId: 'descartes', key: 'ancient' },
    { beforeId: 'euler', key: 'earlyModern' },
    { beforeId: 'gauss', key: 'foundations' },
    { beforeId: 'hilbert', key: 'modern' },
  ]
  return marks
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

function eraBefore(person: Mathematician) {
  return eraBreaks.value.find((m) => m.beforeId === person.id)
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
    <header class="math-head">
      <h2>{{ t('domain.math') }}</h2>
    </header>

    <div class="math-board">
      <div class="math-labels" aria-hidden="true">
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
        <!-- Continuous domain rails — length is horizontal (time), not vertical. -->
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
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.math-atlas {
  --col-w: var(--card-w, 56px);
  --card-block-h: calc(
    var(--card-w, 56px) * 4 / 3 + 2.6rem
  );
  --marks-h: 148px;
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  margin-left: var(--math-left, 0px);
  /* At least as wide as the philosophy tree; grow if people need more room. */
  width: max(var(--math-width, 0px), max-content);
  min-width: var(--math-width, max-content);
  max-width: none;
  flex: 1 1 auto;
  min-height: 0;
  padding: 8px 0;
  box-sizing: border-box;
}

.math-head {
  padding: 0 4px;
}

.math-head h2 {
  margin: 0;
  font-family: var(--serif);
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--cream);
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
  grid-template-rows: repeat(4, 1fr) auto;
  gap: 0;
  height: calc(var(--marks-h) + var(--card-block-h));
  padding-top: 0;
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
  min-height: 0;
  white-space: nowrap;
  transition:
    color 0.18s ease,
    filter 0.18s ease;
}

.math-label.is-focus .lane-name {
  color: var(--cream);
}

.math-label.is-focus .lane-tick {
  opacity: 1;
  width: 14px;
  box-shadow: 0 0 10px color-mix(in srgb, var(--lane) 55%, transparent);
}

.lane-tick {
  width: 10px;
  height: 2px;
  border-radius: 1px;
  background: var(--lane);
  opacity: 0.85;
  flex: 0 0 auto;
  transition:
    width 0.18s ease,
    opacity 0.18s ease,
    box-shadow 0.18s ease;
}

.lane-name {
  font-family: var(--serif);
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--gold-2);
  transition: color 0.18s ease;
}

.math-label-spacer {
  height: var(--card-block-h);
}

.math-scroll {
  position: relative;
  min-width: 0;
  width: 100%;
  overflow: visible;
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
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: max-content;
  min-height: 100%;
  box-sizing: border-box;
}

.era-break {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 36px;
  flex: 0 0 36px;
  position: relative;
  margin: 0 2px;
  padding-top: 2px;
}

.era-break::before {
  content: '';
  position: absolute;
  top: 1.4rem;
  bottom: var(--card-block-h);
  left: 50%;
  width: 1px;
  background: linear-gradient(
    180deg,
    rgba(212, 184, 122, 0.35),
    rgba(212, 184, 122, 0.1),
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
  --mark: 10px;
  position: relative;
  display: grid;
  grid-template-rows: var(--marks-h) auto;
  width: max-content;
  flex: 0 0 auto;
  padding: 0;
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
  transition: border-top-color 0.16s ease;
}

.math-col.is-hovered .who {
  border-top-color: rgba(212, 184, 122, 0.45);
}

@media (max-width: 720px) {
  .math-atlas {
    --marks-h: 128px;
  }
}
</style>
