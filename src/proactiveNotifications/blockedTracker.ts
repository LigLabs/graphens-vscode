import { Subject } from 'rxjs'

import * as vscode from 'vscode'

export function startBlockedTracker(): vscode.Disposable {
  const docChanges$ = new Subject<vscode.TextDocumentChangeEvent>()
  const subscription = vscode.workspace.onDidChangeTextDocument((event) => docChanges$.next(event))

  return subscription
}