<script lang="ts">
  import { cn } from '$lib/utils';
  import { CheckCircle2, XCircle, Circle, AlertCircle } from 'lucide-svelte';

  let { status, class: className } = $props<{ status: string, class?: string }>();

  const config: any = {
    untest: { color: "text-muted bg-panel border-border", icon: Circle, label: "Untested" },
    passed: { color: "text-success bg-success/10 border-success/20", icon: CheckCircle2, label: "Passed" },
    failed: { color: "text-danger bg-danger/10 border-danger/20", icon: XCircle, label: "Failed" },
    skipped: { color: "text-warning bg-warning/10 border-warning/20", icon: AlertCircle, label: "Skipped" },
  };

  let current = $derived(config[status] || config.untest);
  let Icon = $derived(current.icon);
</script>

<div class={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider", current.color, className)}>
  <Icon class="h-3 w-3" />
  <span>{current.label}</span>
</div>