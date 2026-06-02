type FromWebviewMessage =
  | { type: 'sendMessage'; text: string }
  | { type: 'clearChat' }

export type ToWebviewMessage =
  | { type: 'addMessage'; role: 'user' | 'assistant'; content: string }
  | { type: 'streamChunk'; text: string }
  | { type: 'streamEnd' }
  | { type: 'streamError'; message: string }
  | { type: 'clearChat' }

declare function acquireVsCodeApi(): {
  postMessage(message: FromWebviewMessage): void
  getState<T>(): T | undefined
  setState<T>(state: T): void
}

// acquireVsCodeApi() may only be called once per webview lifetime
export const vscode = acquireVsCodeApi()
