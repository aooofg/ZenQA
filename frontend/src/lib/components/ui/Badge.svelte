<script lang="ts">
  import { cn } from '$lib/utils';

  let { variant = 'default', class: className, children, ...rest } = $props();

  const variants = {
    default: "border-transparent bg-primary text-primary-fg hover:opacity-80",
    secondary: "border-transparent bg-panel text-foreground hover:bg-panel/80",
    outline: "text-foreground",
    danger: "border-transparent bg-danger text-white hover:opacity-80",
    success: "border-transparent bg-success text-white",
  };
</script>

<div
  class={cn(
    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    variants[variant as keyof typeof variants],
    className
  )}
  {...rest}
>
  {@render children?.()}
</div>