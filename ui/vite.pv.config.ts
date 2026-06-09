import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  plugins: [svelte({ preprocess: vitePreprocess() }), tailwindcss()],
  root: path.resolve(__dirname, 'src/preview'),
  base: './'
})
