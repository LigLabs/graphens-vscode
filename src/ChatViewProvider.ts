import * as vscode from 'vscode'

type Role = 'user' | 'assistant'

interface Message {
  role: Role
  content: string
}

// Messages sent from extension host → webview
type ToWebviewMessage =
  | { type: 'addMessage'; role: Role; content: string }
  | { type: 'streamChunk'; text: string }
  | { type: 'streamEnd' }
  | { type: 'streamError'; message: string }
  | { type: 'clearChat' }

// Messages sent from webview → extension host
type FromWebviewMessage =
  | { type: 'sendMessage'; text: string }
  | { type: 'clearChat' }

export class ChatViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'graphens-ai.chat'

  private view?: vscode.WebviewView
  private history: Message[] = []
  private streaming = false

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    }

    webviewView.webview.html = this.buildHtml(webviewView.webview)

    webviewView.webview.onDidReceiveMessage((raw: unknown) => {
      const msg = raw as FromWebviewMessage
      if (msg.type === 'sendMessage') {
        void this.handleUserMessage(msg.text)
      } else if (msg.type === 'clearChat') {
        this.clearChat()
      }
    })
  }

  clearChat() {
    this.history = []
    this.post({ type: 'clearChat' })
  }

  private post(msg: ToWebviewMessage) {
    this.view?.webview.postMessage(msg)
  }

  private async handleUserMessage(text: string) {
    if (this.streaming || !text.trim()) return

    const cfg = vscode.workspace.getConfiguration('graphens-ai')
    const backendUrl = cfg.get<string>('backendUrl', '').trim()

    if (!backendUrl) {
      this.post({
        type: 'streamError',
        message: 'No backend URL configured. Set `graphens-ai.backendUrl` in VS Code settings.',
      })
      return
    }

    this.history.push({ role: 'user', content: text })
    this.post({ type: 'addMessage', role: 'user', content: text })

    const apiKey =
      (await this.context.secrets.get('graphens-ai.apiKey')) ||
      cfg.get<string>('apiKey', '').trim() ||
      undefined

    this.streaming = true
    let assistantText = ''

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: this.history }),
      })

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`Backend responded ${response.status}: ${body || response.statusText}`)
      }

      const contentType = response.headers.get('content-type') ?? ''

      if (contentType.includes('text/event-stream')) {
        this.post({ type: 'addMessage', role: 'assistant', content: '' })
        for await (const chunk of this.readSse(response)) {
          assistantText += chunk
          this.post({ type: 'streamChunk', text: chunk })
        }
      } else {
        const data = (await response.json()) as Record<string, unknown>
        assistantText =
          typeof data['message'] === 'string' ? data['message'] :
          typeof data['content'] === 'string' ? data['content'] :
          typeof data['text']    === 'string' ? data['text']    :
          JSON.stringify(data)
        this.post({ type: 'addMessage', role: 'assistant', content: assistantText })
      }

      this.history.push({ role: 'assistant', content: assistantText })
      this.post({ type: 'streamEnd' })
    } catch (err) {
      this.post({ type: 'streamError', message: err instanceof Error ? err.message : String(err) })
      this.history.pop() // remove the user turn that failed
    } finally {
      this.streaming = false
    }
  }

  private async *readSse(response: Response): AsyncGenerator<string> {
    const reader = response.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') return

          try {
            const parsed = JSON.parse(payload) as Record<string, unknown>
            const text =
              typeof parsed['text']    === 'string' ? parsed['text'] :
              typeof parsed['content'] === 'string' ? parsed['content'] :
              typeof parsed['delta']   === 'object' && parsed['delta'] !== null &&
                typeof (parsed['delta'] as Record<string, unknown>)['text'] === 'string'
                ? (parsed['delta'] as Record<string, unknown>)['text'] as string
              : ''
            if (text) yield text
          } catch {
            // non-JSON SSE line — ignore
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  private buildHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'chat.js')
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'chat.css')
    )
    const csp = `default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource};`

    return /* html */ `<!DOCTYPE html>
<html lang="en" data-theme="vscode">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>Graphens AI Chat</title>
</head>
<body>
  <div id="app"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`
  }
}
