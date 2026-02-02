<!-- src/lib/components/cases/StepsEditor.svelte -->
<script lang="ts">
  import { GripVertical, Trash2, Plus } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { cn } from '$lib/utils';

  interface Step {
    id?: string; 
    action: string;
    expected: string;
  }

  let { steps = $bindable([]) } = $props<{ steps: Step[] }>();

  function addStep() {
    // Для новых шагов генерируем временный ID, чтобы Svelte мог их отслеживать
    const newStep = { id: crypto.randomUUID(), action: '', expected: '' };
    steps = [...steps, newStep];
  }

  function removeStep(index: number) {
    steps = steps.filter((_, i) => i !== index);
  }

  function autoResize(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  }
</script>

<div class="space-y-2">
  <!-- Header -->
  <div class="grid grid-cols-[30px_1fr_1fr_40px] gap-4 px-2 py-2 text-[10px] font-bold text-muted uppercase tracking-widest">
    <span>#</span>
    <span>Действие</span>
    <span>Ожидаемый результат</span>
    <span></span>
  </div>

  <!-- List -->
  <div class="space-y-1">
    <!-- 
       ИСПРАВЛЕНИЕ: Используем i (индекс) как ключ, если step.id отсутствует.
       Это предотвращает ошибку duplicate key undefined.
    -->
    {#each steps as step, i (step.id ?? i)}
      <div class="group relative grid grid-cols-[30px_1fr_1fr_40px] gap-4 items-start rounded-md border border-transparent bg-surface hover:border-border hover:shadow-sm transition-all p-2">
        
        <!-- Drag Handle -->
        <div class="flex h-full items-center justify-center text-muted cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical class="h-4 w-4" />
        </div>

        <!-- Action -->
        <textarea
          bind:value={step.action}
          oninput={autoResize}
          rows="1"
          placeholder="Что делаем?"
          class="w-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none placeholder:text-muted/40"
        ></textarea>

        <!-- Expected -->
        <textarea
          bind:value={step.expected}
          oninput={autoResize}
          rows="1"
          placeholder="Ожидаемый результат..."
          class="w-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none placeholder:text-muted/40"
        ></textarea>

        <!-- Actions -->
        <div class="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onclick={() => removeStep(i)}
            class="text-muted hover:text-danger transition-colors p-1"
            title="Удалить шаг"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>

        <!-- Номер шага -->
        <div class="absolute left-2 top-3 text-[10px] font-mono font-bold text-muted/30 pointer-events-none group-hover:hidden">
            {i + 1}
        </div>
      </div>
    {/each}
  </div>

  <Button variant="outline" size="sm" onclick={addStep} class="w-full mt-2 border-dashed text-muted hover:text-primary hover:bg-primary/5">
    <Plus class="h-4 w-4 mr-2" />
    Добавить шаг
  </Button>
</div>