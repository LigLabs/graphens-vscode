import * as vscode from 'vscode'
import { ChatViewProvider } from './ChatViewProvider'

export function activate(context: vscode.ExtensionContext) {
  const provider = new ChatViewProvider(context)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewId, provider),

    vscode.commands.registerCommand('graphens-ai.clearChat', () => {
      provider.clearChat()
    }),

    vscode.commands.registerCommand('graphens-ai.setApiKey', async () => {
      const key = await vscode.window.showInputBox({
        prompt: 'Enter your Anthropic API key',
        password: true,
        ignoreFocusOut: true,
      })
      if (key !== undefined) {
        await context.secrets.store('graphens-ai.apiKey', key)
        vscode.window.showInformationMessage('API key saved.')
      }
    })
  )
}

export function deactivate() {}
