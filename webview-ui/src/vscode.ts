export type ToWebviewMessage =
  | { type: 'init'; backendUrl: string; apiKey: string }
  | { type: 'clearChat' }

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void
  getState<T>(): T | undefined
  setState<T>(state: T): void
}

// acquireVsCodeApi() may only be called once per webview lifetime
export const vscode = acquireVsCodeApi()
