<script setup lang="ts">
defineProps<{
  domain: 'philosophy' | 'science' | 'math'
  label: string
}>()

defineEmits<{
  open: []
}>()
</script>

<template>
  <button
    :id="`${domain}-bar`"
    type="button"
    :data-node="`${domain}-bar`"
    class="domain-bar"
    :class="`${domain}-bar`"
    :title="label"
    :aria-label="label"
    @click="$emit('open')"
  >
    <span class="domain-bar-lead">
      <span class="domain-bar-label">{{ label }}</span>
      <span class="domain-bar-hint" aria-hidden="true">
        <svg class="domain-bar-icon" viewBox="0 0 12 14" width="11" height="13">
          <path d="M6 1.2 L10.2 6.2 H1.8 Z" />
          <path d="M6 12.8 L1.8 7.8 H10.2 Z" />
        </svg>
      </span>
    </span>
  </button>
</template>

<style scoped>
.domain-bar {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 6px 12px;
  border-radius: 10px;
  font: inherit;
  cursor: pointer;
  text-align: left;
  box-sizing: border-box;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    filter 0.15s ease;
}

.domain-bar:hover {
  filter: brightness(1.1);
}

.domain-bar:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}

.domain-bar-lead {
  position: sticky;
  left: max(40px, env(safe-area-inset-left));
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.domain-bar-label {
  font-family: var(--serif);
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.domain-bar-hint {
  display: inline-flex;
  align-items: center;
  flex: none;
  opacity: 0.78;
  line-height: 0;
}

.domain-bar:hover .domain-bar-hint {
  opacity: 1;
}

.domain-bar-icon {
  display: block;
  fill: currentColor;
}

.math-bar {
  border: 1px solid rgba(142, 180, 196, 0.42);
  background: rgba(142, 180, 196, 0.1);
  color: #b7d4e0;
}

.science-bar {
  border: 1px solid rgba(74, 155, 184, 0.4);
  background: rgba(74, 155, 184, 0.1);
  color: #9ecfe0;
}

.philosophy-bar {
  border: 1px solid var(--line);
  background: rgba(212, 184, 122, 0.08);
  color: var(--gold-2);
}
</style>
