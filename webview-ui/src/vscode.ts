/** Messages sent from the extension host to the webview. */
export type ToWebviewMessage =
  | { type: 'stateLoaded'; key: string; state: unknown }
  | { type: 'clearChat' }

/** Messages sent from the webview to the extension host. */
export type FromWebviewMessage =
  | { type: 'stateChanged'; key: string; value: unknown }

interface VsCodeApi {
  postMessage(message: FromWebviewMessage): void
  getState<T>(): T | undefined
  setState<T>(state: T): void
}

declare function acquireVsCodeApi(): VsCodeApi

function createBrowserFallback(): VsCodeApi {
  const stateKey = '__graphens_webview_state'
  return {
    postMessage: (msg) => console.log('[vscode mock] postMessage:', msg),
    getState: <T>() => {
      try { return JSON.parse(sessionStorage.getItem(stateKey) ?? 'null') as T | undefined }
      catch { return undefined }
    },
    setState: <T>(state: T) => sessionStorage.setItem(stateKey, JSON.stringify(state)),
  }
}

// acquireVsCodeApi() may only be called once per webview lifetime
export const vscode: VsCodeApi =
  typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : createBrowserFallback()
