import { z } from 'zod'
import { vscode, type ToWebviewMessage, type FromWebviewMessage } from '../vscode'

const stateChangesBus = new EventTarget()

const handleMessageEvents = (event: MessageEvent) => {
    const msg = event.data as ToWebviewMessage
    if (msg.type === 'stateLoaded') {
      stateChangesBus.dispatchEvent(
        new CustomEvent(`stateLoaded:${msg.key}`, { detail: msg.state })
      )
    }
  }

window.addEventListener('message', handleMessageEvents)

export interface VSRune<T> {
  value: T
  sync(): void
  unsync(): void
}

export function vsrune<TSchema extends z.ZodTypeAny>(
  key: string,
  schema: TSchema,
  defaultValue: z.infer<TSchema>
): VSRune<z.infer<TSchema>> {

  let state = $state<z.infer<TSchema>>(defaultValue)

  const sync = (event: Event) => {
    state = schema.parse((event as CustomEvent).detail)
  }

  stateChangesBus.addEventListener(`stateLoaded:${key}`, sync)

  return {
    get value(): z.infer<TSchema> {
      return state
    },
    set value(v: z.infer<TSchema>) {
      vscode.postMessage({ type: 'stateChanged', key, value: state } satisfies FromWebviewMessage)
      state = v
    },
    sync() {
      stateChangesBus.addEventListener(`stateLoaded:${key}`, sync)
    },
    unsync() {
      stateChangesBus.removeEventListener(`stateLoaded:${key}`, sync)
    }
  }
}
