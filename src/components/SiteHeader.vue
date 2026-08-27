<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setLocaleCookie, type AppLocale } from '../i18n'

const { t, locale } = useI18n()
const langs: AppLocale[] = ['en', 'zh', 'ja']

/** Section jump targets — empty for now; fill when chapter nav returns. */
const sections: { id: string; labelKey: string }[] = []

function go(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    inline: 'center',
    block: 'nearest',
  })
}

function onLocale(event: Event) {
  const value = (event.target as HTMLSelectElement).value as AppLocale
  locale.value = value
  setLocaleCookie(value)
  document.documentElement.lang = value === 'zh' ? 'zh-Hans' : value
}
</script>

<template>
  <header class="bar">
    <a class="brand" href="#top">
      <span class="mark">Φ</span>
      <span class="name">{{ t('site.title') }}</span>
    </a>
    <nav v-if="sections.length">
      <button
        v-for="section in sections"
        :key="section.id"
        type="button"
        @click="go(section.id)"
      >
        {{ t(section.labelKey) }}
      </button>
    </nav>
    <label class="lang">
      <span class="sr">{{ t('lang.en') }}</span>
      <select :value="locale" @change="onLocale">
        <option v-for="code in langs" :key="code" :value="code">
          {{ t(`lang.${code}`) }}
        </option>
      </select>
    </label>
  </header>
</template>

<style scoped>
.bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 22px;
  padding-top: max(10px, env(safe-area-inset-top));
  padding-left: max(22px, env(safe-area-inset-left));
  padding-right: max(22px, env(safe-area-inset-right));
  background: rgba(11, 12, 16, 0.92);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(16px);
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: var(--cream);
  text-decoration: none;
  min-width: 0;
}

.mark {
  font-family: var(--serif);
  color: var(--gold);
  font-size: 1.35rem;
}

.name {
  font-family: var(--serif);
  font-size: 1.05rem;
  letter-spacing: 0.06em;
}

nav {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

nav button {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 999px;
  font: inherit;
  font-size: 0.8rem;
  letter-spacing: 0.06em;
}

nav button:hover {
  color: var(--cream);
}

.lang {
  margin-left: auto;
}

.lang select {
  appearance: none;
  background: var(--bg-card);
  color: var(--cream);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 6px 28px 6px 12px;
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  background-image: linear-gradient(45deg, transparent 50%, var(--gold) 50%),
    linear-gradient(135deg, var(--gold) 50%, transparent 50%);
  background-position:
    calc(100% - 14px) 11px,
    calc(100% - 9px) 11px;
  background-size: 5px 5px;
  background-repeat: no-repeat;
}

nav + .lang {
  margin-left: 0;
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

@media (max-width: 820px) {
  .bar {
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 14px;
    padding-top: max(10px, env(safe-area-inset-top));
    padding-left: max(14px, env(safe-area-inset-left));
    padding-right: max(14px, env(safe-area-inset-right));
  }

  .name {
    font-size: 0.95rem;
  }

  nav {
    order: 3;
    width: 100%;
    margin: 0;
    justify-content: space-between;
  }

  .lang select {
    min-height: 36px;
    font-size: 0.86rem;
  }
}
</style>
