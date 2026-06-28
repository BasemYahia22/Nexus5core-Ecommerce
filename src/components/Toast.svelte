<script lang="ts">
  import { store } from '../lib/store.svelte';
  import { X, CheckCircle, AlertTriangle, Info } from 'lucide-svelte';
</script>

<div class="fixed top-24 right-6 z-[999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
  {#each store.toasts as toast (toast.id)}
    <div 
      class="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border bg-[#0d0d0d]/90 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 transform translate-y-0"
      class:border-emerald-500={toast.type === 'success'}
      class:border-red-500={toast.type === 'error'}
      class:border-orange-500={toast.type === 'warning'}
      class:border-sky-500={toast.type === 'info'}
    >
      {#if toast.type === 'success'}
        <CheckCircle class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
      {:else if toast.type === 'warning'}
        <AlertTriangle class="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
      {:else if toast.type === 'error'}
        <X class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      {:else}
        <Info class="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
      {/if}

      <div class="flex-1">
        <p class="text-xs font-semibold text-white uppercase tracking-wide">
          {toast.type}
        </p>
        <p class="text-sm text-slate-300 mt-1 leading-relaxed">
          {toast.message}
        </p>
      </div>

      <button 
        onclick={() => store.removeToast(toast.id)}
        class="text-slate-500 hover:text-white transition-colors shrink-0 p-0.5"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  {/each}
</div>
