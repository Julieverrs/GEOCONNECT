import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  root: './static',
  base: '/static/',
  build: {
    outDir: path.resolve(__dirname, 'employee/static/dist'),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'static/js/main.js'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'static/js')
    }
  }
})