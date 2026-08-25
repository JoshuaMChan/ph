<script setup lang="ts">
import { watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import PhilosophyAtlas from './components/PhilosophyAtlas.vue'

const { t, locale } = useI18n()

watchEffect(() => {
  document.title = t('site.title')
  document.documentElement.lang = locale.value === 'zh' ? 'zh-Hans' : String(locale.value)
})
</script>

<template>
  <PhilosophyAtlas />
</template>
