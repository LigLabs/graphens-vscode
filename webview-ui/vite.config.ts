import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  plugins: [svelte({ preprocess: vitePreprocess() })],
  build: {
    outDir: path.resolve(__dirname, '../media'),
    emptyOutDir: false, // preserve media/icon.svg
    rollupOptions: {
      output: {
        entryFileNames: 'chat.js',
        chunkFileNames: 'chat-[name].js',
        assetFileNames: (info) =>
          info.name?.endsWith('.css') ? 'chat.css' : '[name].[ext]',
      },
    },
  },
})
