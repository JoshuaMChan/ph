<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Philosopher } from '../types'
import { formatLifespan } from '../utils/dates'

const props = defineProps<{
  person: Philosopher
}>()

const { t } = useI18n()

const life = computed(() => formatLifespan(props.person.birth, props.person.death))
</script>

<template>
  <article class="card">
    <div class="portrait" :data-node="person.id">
      <img :src="person.portrait" :alt="t(`person.${person.id}`)" />
    </div>
    <div class="info">
      <h3>{{ t(`person.${person.id}`) }}</h3>
      <p class="meta">
        <span class="dates">{{ life }}</span>
        <span class="country">{{ t(`region.${person.country}`) }}</span>
      </p>
    </div>
  </article>
</template>

<style scoped>
.card {
  --portrait-h: calc(var(--card-w, 70px) * 4 / 3);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: max-content;
  height: calc(var(--portrait-h) + var(--info-h, 1.55rem));
  flex: 0 0 auto;
}

.portrait {
  width: var(--card-w, 70px);
  height: var(--portrait-h);
  flex: none;
  overflow: hidden;
  border-radius: 8px;
  background: #11141b;
  border: 1px solid var(--line);
}

.portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 12%;
  filter: grayscale(0.25) contrast(1.05);
}

.card:hover img {
  filter: grayscale(0) contrast(1.08);
}

.info {
  height: var(--info-h, 1.55rem);
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 6px;
  margin-top: 5px;
  min-width: 0;
}

h3 {
  margin: 0;
  font-family: var(--serif);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--cream);
  line-height: 1.2;
  white-space: nowrap;
}

.meta {
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 5px;
  margin: 0;
  white-space: nowrap;
}

.dates,
.country {
  margin: 0;
  font-size: 0.62rem;
  line-height: 1.2;
}

.dates {
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}

.country {
  color: var(--muted);
}
</style>
