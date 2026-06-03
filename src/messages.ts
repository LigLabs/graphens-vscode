/** Messages sent from the extension host to the webview. */
export type ToWebviewMessage =
  | { type: 'init'; state: Record<string, unknown> }
  | { type: 'clearChat' }

/** Messages sent from the webview to the extension host. */
export type FromWebviewMessage =
  | { type: 'setState'; key: string; value: unknown }
