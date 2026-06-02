<script lang="ts">
  import { afterUpdate } from 'svelte'
  import { vscode, type ToWebviewMessage } from './vscode'

  interface ChatMessage {
    role: 'user' | 'assistant' | 'error'
    content: string
  }

  let messages: ChatMessage[] = []
  let inputText = ''
  let isStreaming = false
  let messagesEl: HTMLElement

  afterUpdate(() => {
    messagesEl?.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' })
  })

  function send() {
    const text = inputText.trim()
    if (!text || isStreaming) return
    inputText = ''
    vscode.postMessage({ type: 'sendMessage', text })
    isStreaming = true
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  window.addEventListener('message', (event: MessageEvent) => {
    const msg = event.data as ToWebviewMessage

    if (msg.type === 'addMessage') {
      messages = [...messages, { role: msg.role, content: msg.content }]
    } else if (msg.type === 'streamChunk') {
      const last = messages.at(-1)
      if (last?.role === 'assistant') {
        messages = [...messages.slice(0, -1), { ...last, content: last.content + msg.text }]
      }
    } else if (msg.type === 'streamEnd') {
      isStreaming = false
    } else if (msg.type === 'streamError') {
      messages = [...messages, { role: 'error', content: msg.message }]
      isStreaming = false
    } else if (msg.type === 'clearChat') {
      messages = []
      isStreaming = false
    }
  })
</script>

<div class="flex flex-col h-screen bg-base-100 text-base-content overflow-hidden">
  <!-- message list -->
  <div class="flex-1 overflow-y-auto p-2 space-y-1" bind:this={messagesEl}>
    {#each messages as msg, i (i)}
      <div class="chat {msg.role === 'user' ? 'chat-end' : 'chat-start'}">
        <div
          class="chat-bubble text-sm whitespace-pre-wrap break-words
            {msg.role === 'user'  ? 'chat-bubble-primary' : ''}
            {msg.role === 'error' ? 'chat-bubble-error'   : ''}"
        >
          {msg.content}{#if msg.role === 'assistant' && isStreaming && i === messages.length - 1}<span class="animate-pulse">▍</span>{/if}
        </div>
      </div>
    {/each}

    {#if isStreaming && (messages.at(-1)?.role !== 'assistant')}
      <div class="chat chat-start">
        <div class="chat-bubble chat-bubble-ghost">
          <span class="loading loading-dots loading-xs"></span>
        </div>
      </div>
    {/if}
  </div>

  <!-- input -->
  <div class="flex gap-2 p-2 border-t border-base-300">
    <textarea
      class="textarea textarea-bordered flex-1 resize-none text-sm leading-snug min-h-[4rem] max-h-40"
      placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
      bind:value={inputText}
      on:keydown={handleKeydown}
      disabled={isStreaming}
    ></textarea>
    <button
      class="btn btn-primary self-end"
      on:click={send}
      disabled={isStreaming || !inputText.trim()}
    >
      {#if isStreaming}
        <span class="loading loading-spinner loading-sm"></span>
      {:else}
        Send
      {/if}
    </button>
  </div>
</div>
