<script lang="ts">
  import type { ChatMessage } from '../lib/chat.service'

  let messages: ChatMessage[] = []
  let inputText = ''
  let isStreaming = false

  async function send() {}

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }
</script>

<div class="flex flex-col h-screen bg-base-100 text-base-content overflow-hidden">
  <!-- message list -->
  <div class="flex-1 overflow-y-auto p-2 space-y-1">
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
      on:click={() => void send()}
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
