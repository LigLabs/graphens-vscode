import { z } from 'zod'
import { onDestroy } from 'svelte'
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
onDestroy(() => {
  window.removeEventListener('message', handleMessageEvents)
})

export function vsrune<TSchema extends z.ZodTypeAny>(
  key: string,
  schema: TSchema,
  defaultValue: z.infer<TSchema>
): { get current(): z.infer<TSchema>; set current(v: z.infer<TSchema>) } {

  let state = $state<z.infer<TSchema>>(defaultValue)

  const sync = (event: Event) => {
    state = schema.parse((event as CustomEvent).detail)
  }

  stateChangesBus.addEventListener(`stateLoaded:${key}`, sync)

  $effect(() => {
    vscode.postMessage({ type: 'stateChanged', key, value: state } satisfies FromWebviewMessage)
  })

  onDestroy(() => {
    stateChangesBus.removeEventListener(`stateLoaded:${key}`, sync)
  })

  return {
    get current(): z.infer<TSchema> {
      return state
    },
    set current(v: z.infer<TSchema>) {
      state = v
    },
  }
}
