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
  formatEraYears(school.value.yearStart, school.value.yearEnd, t('ui.bce')),
)
const countries = computed(() =>
  school.value.regionKeys.map((key) => t(`region.${key}`)).join(' · '),
)

const nietzsche = computed(() => people.value.find((item) => item.id === 'nietzsche'))
const schopenhauer = computed(() => people.value.find((item) => item.id === 'schopenhauer'))
const kierkegaard = computed(() => people.value.find((item) => item.id === 'kierkegaard'))
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
        <span class="where">{{ countries }}</span>
      </p>
    </header>
    <div v-if="schoolId === 'life'" class="people life-grid">
      <PhilosopherCard v-if="nietzsche" class="slot-nietzsche" :person="nietzsche" />
      <PhilosopherCard v-if="schopenhauer" class="slot-schopenhauer" :person="schopenhauer" />
      <PhilosopherCard v-if="kierkegaard" class="slot-kierkegaard" :person="kierkegaard" />
    </div>
    <div v-else class="people">
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

.nested {
  gap: 6px;
  padding-top: 0;
}

.nested h2 {
  font-size: 1.05rem;
}
</style>
