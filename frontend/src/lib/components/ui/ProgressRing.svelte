<script lang="ts">
  let { percentage = 0, size = 120, stroke = 8, class: className } = $props();
  
  let radius = $derived((size - stroke) / 2);
  let circumference = $derived(radius * 2 * Math.PI);
  let offset = $derived(circumference - (percentage / 100) * circumference);
</script>

<div class="relative flex items-center justify-center {className}" style="width: {size}px; height: {size}px">
  <svg width={size} height={size} class="rotate-[-90deg]">
    <!-- Background Circle -->
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="transparent"
      stroke="currentColor"
      stroke-width={stroke}
      class="text-border/30"
    />
    <!-- Progress Circle -->
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="transparent"
      stroke="currentColor"
      stroke-width={stroke}
      stroke-dasharray={circumference}
      style="stroke-dashoffset: {offset}"
      stroke-linecap="round"
      class="text-success transition-all duration-1000 ease-out"
    />
  </svg>
  <div class="absolute inset-0 flex flex-col items-center justify-center">
    <span class="text-2xl font-bold leading-none">{Math.round(percentage)}%</span>
    <span class="text-[10px] text-muted uppercase font-bold tracking-tighter">Passed</span>
  </div>
</div>