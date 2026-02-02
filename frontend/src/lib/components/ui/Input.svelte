<script lang="ts">
  import { cn } from '$lib/utils';

  let { 
    class: className, 
    value = $bindable(), 
    ...rest 
  } = $props();
</script>

<input
  class={cn(
    "flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  bind:value
  {...rest}
/>