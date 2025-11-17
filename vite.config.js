import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  // The root is the project root, where package.json is.
  // No need to specify `root` if it's the default.
  base: '/', // Serve from the root of the domain
  build: {
    // Build assets into a `dist` folder at the project root
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    manifest: true,
  }
})