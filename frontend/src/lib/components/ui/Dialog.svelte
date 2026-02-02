<script lang="ts">
  import { X } from 'lucide-svelte';
  import Button from './Button.svelte';
  import { cn } from '$lib/utils';

  let { 
    open = $bindable(false), 
    title, 
    children,
    class: className
  } = $props<{
    open: boolean;
    title?: string;
    children?: any;
    class?: string;
  }>();

  let dialog: HTMLDialogElement;

  // Реакция на изменение open
  $effect(() => {
    if (dialog) {
      if (open && !dialog.open) {
        dialog.showModal();
      } else if (!open && dialog.open) {
        dialog.close();
      }
    }
  });

  function close() {
    open = false;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  onclose={close}
  onclick={(e) => e.target === dialog && close()}
  class={cn(
    "backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-transparent p-0 open:animate-in open:fade-in open:zoom-in-95 focus:outline-none",
    className
  )}
>
  <div class="w-[400px] rounded-lg border border-border bg-surface shadow-neo p-0 text-foreground overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border bg-panel/50">
      <h3 class="font-semibold text-sm tracking-tight">{title || 'Dialog'}</h3>
      <button onclick={close} class="text-muted hover:text-foreground transition-colors">
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Content -->
    <div class="p-4">
      {@render children?.()}
    </div>
  </div>
</dialog>