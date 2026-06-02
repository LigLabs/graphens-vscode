/**
 * Reads VS Code CSS custom properties injected into the webview and maps them
 * to DaisyUI v3 theme variables (space-separated HSL components without hsl()).
 * Falls back gracefully when a VS Code variable is absent or unparseable.
 */
export function injectVscodeTheme(): void {
  const style = document.createElement('style')
  const get = (v: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim()

  const mappings: Array<[string, string]> = [
    ['--p',  get('--vscode-button-background')],
    ['--pf', get('--vscode-button-hoverBackground')],
    ['--pc', get('--vscode-button-foreground')],
    ['--s',  get('--vscode-badge-background')],
    ['--sc', get('--vscode-badge-foreground')],
    ['--a',  get('--vscode-textLink-foreground')],
    ['--af', get('--vscode-textLink-activeForeground')],
    ['--n',  get('--vscode-editorWidget-background')],
    ['--nc', get('--vscode-editorWidget-foreground') || get('--vscode-foreground')],
    ['--b1', get('--vscode-editor-background')],
    ['--b2', get('--vscode-sideBar-background') || get('--vscode-editor-background')],
    ['--b3', get('--vscode-editorGroupHeader-tabsBackground') || get('--vscode-editor-background')],
    ['--bc', get('--vscode-foreground')],
    ['--er', get('--vscode-editorError-foreground')],
    ['--wa', get('--vscode-editorWarning-foreground')],
    ['--su', get('--vscode-testing-iconPassed')],
    ['--in', get('--vscode-debugConsole-infoForeground')],
  ]

  const rules = mappings
    .map(([variable, raw]) => {
      const hsl = toHslComponents(raw)
      return hsl ? `  ${variable}: ${hsl};` : null
    })
    .filter(Boolean)
    .join('\n')

  style.textContent = `[data-theme="vscode"] {\n${rules}\n}`
  document.head.appendChild(style)
}

/** Converts a CSS color string (hex or rgb/rgba) to DaisyUI HSL components "h s% l%". */
function toHslComponents(raw: string): string | null {
  if (!raw) return null

  let r: number, g: number, b: number

  const hexMatch = /^#([0-9a-f]{3,8})$/i.exec(raw)
  if (hexMatch) {
    const hex = hexMatch[1]!
    if (hex.length === 3 || hex.length === 4) {
      r = parseInt(hex[0]! + hex[0]!, 16)
      g = parseInt(hex[1]! + hex[1]!, 16)
      b = parseInt(hex[2]! + hex[2]!, 16)
    } else {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    }
  } else {
    const rgbMatch = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(raw)
    if (!rgbMatch) return null
    r = parseInt(rgbMatch[1]!, 10)
    g = parseInt(rgbMatch[2]!, 10)
    b = parseInt(rgbMatch[3]!, 10)
  }

  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0, s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break
      case gn: h = ((bn - rn) / d + 2) / 6; break
      case bn: h = ((rn - gn) / d + 4) / 6; break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}
