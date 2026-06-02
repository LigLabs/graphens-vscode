import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'

export default {
  content: ['./index.html', './src/**/*.{svelte,ts}'],
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        // Static fallback values (Dark+ palette). theme.ts overrides these at
        // runtime using the actual VS Code CSS custom properties.
        vscode: {
          primary: '#0e639c',
          'primary-focus': '#1177bb',
          'primary-content': '#ffffff',
          secondary: '#3a3d41',
          accent: '#007acc',
          neutral: '#252526',
          'base-100': '#1e1e1e',
          'base-200': '#252526',
          'base-300': '#3c3c3c',
          'base-content': '#cccccc',
          info: '#75beff',
          success: '#4ec994',
          warning: '#cca700',
          error: '#f48771',
        },
      },
    ],
    darkTheme: 'vscode',
    logs: false,
  },
} satisfies Config
