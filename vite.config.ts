import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base works for GitHub project pages (/ph/) without hardcoding.
  base: './',
  plugins: [vue()],
})
