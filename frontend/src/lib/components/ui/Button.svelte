<script lang="ts">
  import { cn } from '$lib/utils';

  let { 
    variant = 'default', 
    size = 'default', 
    class: className, 
    children,
    ...rest 
  } = $props();

  const variants = {
    default: "bg-primary text-primary-fg hover:opacity-90 shadow-sm",
    outline: "border border-border bg-transparent hover:bg-panel text-foreground",
    ghost: "hover:bg-panel text-foreground",
    danger: "bg-danger text-white hover:opacity-90",
    link: "text-primary underline-offset-4 hover:underline",
  };

  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 px-3 text-xs",
    lg: "h-10 px-8",
    icon: "h-9 w-9 p-0 flex items-center justify-center",
  };
</script>

<button
  class={cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
    variants[variant as keyof typeof variants],
    sizes[size as keyof typeof sizes],
    className
  )}
  {...rest}
>
  {@render children?.()}
</button>