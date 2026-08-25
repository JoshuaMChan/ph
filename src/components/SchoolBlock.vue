<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { peopleOf, schools } from '../data/philosophers'
import { formatEraYears } from '../utils/dates'
import PhilosopherCard from './PhilosopherCard.vue'

const props = withDefaults(
  defineProps<{
    schoolId: string
    nested?: boolean
  }>(),
  { nested: false },
)

const { t } = useI18n()
const school = computed(() => schools[props.schoolId])
const people = computed(() => peopleOf(props.schoolId))
const years = computed(() =>
  formatEraYears(school.value.yearStart, school.value.yearEnd),
)
const countries = computed(() =>
  school.value.regionKeys.map((key) => t(`region.${key}`)).join(' · '),
)

const nietzsche = computed(() => people.value.find((item) => item.id === 'nietzsche'))
const schopenhauer = computed(() => people.value.find((item) => item.id === 'schopenhauer'))
const kierkegaard = computed(() => people.value.find((item) => item.id === 'kierkegaard'))

const heidegger = computed(() => people.value.find((item) => item.id === 'heidegger'))
const sartre = computed(() => people.value.find((item) => item.id === 'sartre'))
const camus = computed(() => people.value.find((item) => item.id === 'camus'))

const descartes = computed(() => people.value.find((item) => item.id === 'descartes'))
const spinoza = computed(() => people.value.find((item) => item.id === 'spinoza'))
const leibniz = computed(() => people.value.find((item) => item.id === 'leibniz'))

const locke = computed(() => people.value.find((item) => item.id === 'locke'))
const berkeley = computed(() => people.value.find((item) => item.id === 'berkeley'))
const hume = computed(() => people.value.find((item) => item.id === 'hume'))
</script>

<template>
  <section
    class="school"
    :class="{ nested }"
    :data-school="schoolId"
    :style="{ '--accent': school.accent }"
  >
    <header class="head">
      <h2>{{ t(`school.${schoolId}`) }}</h2>
      <p class="meta">
        <span class="when">{{ years }}</span>
        <span v-if="countries" class="where">{{ countries }}</span>
      </p>
    </header>
    <div v-if="schoolId === 'life'" class="people life-grid">
      <PhilosopherCard v-if="nietzsche" class="slot-nietzsche" :person="nietzsche" />
      <PhilosopherCard v-if="schopenhauer" class="slot-schopenhauer" :person="schopenhauer" />
      <PhilosopherCard v-if="kierkegaard" class="slot-kierkegaard" :person="kierkegaard" />
    </div>
    <div v-else-if="schoolId === 'existentialism'" class="people existence-grid">
      <PhilosopherCard v-if="heidegger" class="slot-heidegger" :person="heidegger" />
      <PhilosopherCard v-if="sartre" class="slot-sartre" :person="sartre" />
      <PhilosopherCard v-if="camus" class="slot-camus" :person="camus" />
    </div>
    <div v-else-if="schoolId === 'rationalism'" class="people reason-grid">
      <PhilosopherCard v-if="descartes" class="slot-descartes" :person="descartes" />
      <PhilosopherCard v-if="spinoza" class="slot-spinoza" :person="spinoza" />
      <PhilosopherCard v-if="leibniz" class="slot-leibniz" :person="leibniz" />
    </div>
    <div v-else-if="schoolId === 'empiricism'" class="people experience-grid">
      <PhilosopherCard v-if="hume" class="slot-hume" :person="hume" />
      <PhilosopherCard v-if="locke" class="slot-locke" :person="locke" />
      <PhilosopherCard v-if="berkeley" class="slot-berkeley" :person="berkeley" />
    </div>
    <div
      v-else
      class="people"
      :class="{ stacked: people.length >= 3 && schoolId !== 'greece' && schoolId !== 'analytic' }"
    >
      <PhilosopherCard v-for="item in people" :key="item.id" :person="item" />
    </div>
  </section>
</template>

<style scoped>
.school {
  min-width: max-content;
  width: max-content;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 2px 2px 0;
  border-top: 3px solid var(--accent);
}

.head {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 10px;
  white-space: nowrap;
}

h2 {
  margin: 0;
  font-family: var(--serif);
  font-size: 1.12rem;
  font-weight: 600;
  color: var(--cream);
  letter-spacing: 0.03em;
  line-height: 1.15;
}

.meta {
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 8px;
  margin: 0;
}

.when {
  margin: 0;
  color: var(--gold-2);
  font-size: 0.78rem;
}

.where {
  margin: 0;
  color: var(--muted);
  font-size: 0.72rem;
}

.people {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 10px 14px;
  align-items: center;
}

.people.stacked {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.life-grid {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-areas:
    'schopenhauer nietzsche'
    'kierkegaard .';
  justify-content: start;
  align-items: start;
}

.slot-nietzsche {
  grid-area: nietzsche;
}

.slot-schopenhauer {
  grid-area: schopenhauer;
}

.slot-kierkegaard {
  grid-area: kierkegaard;
}

.existence-grid {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-areas:
    'heidegger sartre'
    '. camus';
  justify-content: start;
  align-items: start;
  gap: 8px 14px;
}

.slot-heidegger {
  grid-area: heidegger;
}

.slot-sartre {
  grid-area: sartre;
}

.slot-camus {
  grid-area: camus;
}

.reason-grid {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-areas:
    'descartes .'
    'spinoza leibniz';
  justify-content: start;
  align-items: start;
  gap: 8px 14px;
}

.slot-descartes {
  grid-area: descartes;
}

.slot-spinoza {
  grid-area: spinoza;
}

.slot-leibniz {
  grid-area: leibniz;
}

.experience-grid {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-areas:
    'hume .'
    'locke berkeley';
  justify-content: start;
  align-items: start;
  gap: 8px 14px;
}

.slot-hume {
  grid-area: hume;
}

.slot-locke {
  grid-area: locke;
}

.slot-berkeley {
  grid-area: berkeley;
}

.nested {
  gap: 6px;
  padding-top: 0;
}

.nested h2 {
  font-size: 1.05rem;
}
</style>
