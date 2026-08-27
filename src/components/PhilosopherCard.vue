<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Philosopher } from '../types'
import { formatLifespan } from '../utils/dates'

const props = defineProps<{
  person: Philosopher
}>()

const { t, te, locale } = useI18n()

const life = computed(() => formatLifespan(props.person.birth, props.person.death))
const portraitSrc = computed(
  () => import.meta.env.BASE_URL + props.person.portrait.replace(/^\/+/, ''),
)
const quote = computed(() => {
  const key = 'quote.' + props.person.id
  return te(key, locale.value) ? t(key, locale.value) : ''
})
const tooltipId = computed(() => 'quote-' + props.person.id)
const tooltip = ref({ visible: false, left: 0, top: 0, below: false })
const pinned = ref(false)
const tooltipStyle = computed(() => ({
  left: tooltip.value.left + 'px',
  top: tooltip.value.top + 'px',
}))

function placeQuote(event: Event) {
  if (!quote.value) return

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const width = Math.min(320, window.innerWidth - 32)
  const left = Math.min(
    Math.max(16, rect.left + rect.width / 2 - width / 2),
    window.innerWidth - width - 16,
  )
  const below = rect.top < 150

  tooltip.value = {
    visible: true,
    left,
    top: below ? rect.bottom + 12 : rect.top - 12,
    below,
  }
}

function hideQuote() {
  if (pinned.value) return
  tooltip.value.visible = false
}

function onPointerEnter(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  placeQuote(event)
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  hideQuote()
}

function onClick(event: MouseEvent) {
  if (!quote.value) return
  if (!window.matchMedia('(hover: none), (pointer: coarse)').matches) return

  event.preventDefault()
  if (pinned.value && tooltip.value.visible) {
    pinned.value = false
    tooltip.value.visible = false
    return
  }

  pinned.value = true
  placeQuote(event)
}

function onEsc() {
  pinned.value = false
  tooltip.value.visible = false
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!pinned.value) return
  const target = event.target as HTMLElement | null
  const host = target?.closest?.('[aria-describedby="' + tooltipId.value + '"]')
  if (host) return
  pinned.value = false
  tooltip.value.visible = false
}

document.addEventListener('pointerdown', onDocumentPointerDown)

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
</script>

<template>
  <article
    class="card"
    :class="{ 'has-quote': quote }"
    :tabindex="quote ? 0 : undefined"
    :aria-describedby="quote ? tooltipId : undefined"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @click="onClick"
    @focus="placeQuote"
    @blur="hideQuote"
    @keydown.esc="onEsc"
  >
    <div class="portrait" :data-node="person.id">
      <img
        :src="portraitSrc"
        :alt="t('person.' + person.id)"
        loading="lazy"
      />
    </div>
    <div class="info">
      <h3>{{ t('person.' + person.id) }}</h3>
      <p class="meta">
        <span class="dates">{{ life }}</span>
        <span class="country">{{ t('region.' + person.country) }}</span>
      </p>
    </div>
    <Teleport to="body">
      <Transition name="quote">
        <aside
          v-if="tooltip.visible"
          :id="tooltipId"
          class="quote-tooltip"
          :class="{ below: tooltip.below }"
          :style="tooltipStyle"
          role="tooltip"
        >
          <span aria-hidden="true">“</span>{{ quote }}<span aria-hidden="true">”</span>
        </aside>
      </Transition>
    </Teleport>
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
  -webkit-tap-highlight-color: transparent;
}

.card.has-quote {
  cursor: help;
}

.card:focus-visible {
  outline: 1px solid var(--gold);
  outline-offset: 5px;
  border-radius: 6px;
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

:global(.quote-tooltip) {
  position: fixed;
  z-index: 1000;
  width: min(320px, calc(100vw - 32px));
  box-sizing: border-box;
  padding: 13px 16px 14px;
  transform: translateY(-100%);
  border: 1px solid rgba(211, 177, 108, 0.55);
  border-radius: 9px;
  background: rgba(20, 22, 28, 0.97);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.38);
  color: var(--cream);
  font-family: var(--serif);
  font-size: 0.83rem;
  line-height: 1.65;
  letter-spacing: 0.015em;
  pointer-events: none;
}

:global(.quote-tooltip.below) {
  transform: none;
}

:global(.quote-enter-active),
:global(.quote-leave-active) {
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}

:global(.quote-enter-from),
:global(.quote-leave-to) {
  opacity: 0;
  transform: translateY(calc(-100% + 5px));
}

:global(.quote-tooltip.below.quote-enter-from),
:global(.quote-tooltip.below.quote-leave-to) {
  transform: translateY(-5px);
}

@media (max-width: 900px) {
  h3 {
    font-size: 0.72rem;
  }

  .dates,
  .country {
    font-size: 0.58rem;
  }

  :global(.quote-tooltip) {
    font-size: 0.8rem;
    padding: 12px 14px 13px;
  }
}
</style>
