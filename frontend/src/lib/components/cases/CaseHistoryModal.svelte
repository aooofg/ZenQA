<script lang="ts">
  import { pb } from '$lib/pb';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { History, RotateCcw, User, Clock, Loader2 } from 'lucide-svelte';
  import { getInitials } from '$lib/utils';

  let { open = $bindable(false), caseId, onRestore } = $props<{ 
    open: boolean, 
    caseId: string,
    onRestore: (oldData: any) => void 
  }>();

  let historyItems = $state<any[]>([]);
  let isLoading = $state(false);

  // Загружаем историю при открытии модалки
  $effect(() => {
    if (open && caseId) {
      loadHistory();
    }
  });

  async function loadHistory() {
    isLoading = true;
    try {
      historyItems = await pb.collection('case_history').getFullList({
        filter: `case_id="${caseId}"`,
        sort: '-created',
        expand: 'user_id' // Чтобы видеть, кто менял
      });
    } catch (e) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  }

  function handleRestore(item: any) {
    if (confirm('Восстановить эту версию кейса? Текущие несохраненные данные будут заменены.')) {
      onRestore(item.data);
      open = false;
    }
  }
</script>

<Dialog bind:open title="История изменений" class="w-[500px]">
  <div class="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
    {#if isLoading}
      <div class="flex justify-center py-8"><Loader2 class="animate-spin text-primary" /></div>
    {:else if historyItems.length === 0}
      <p class="text-center py-8 text-sm text-muted italic">История изменений пуста</p>
    {:else}
      <div class="space-y-3">
        {#each historyItems as item}
          <div class="p-3 rounded-lg border border-border bg-panel/30 hover:bg-panel transition-colors flex items-center justify-between group">
            <div class="flex items-center gap-3">
              <!-- Аватарка автора -->
              <div class="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20">
                {getInitials(item.expand?.user_id?.email || '??')}
              </div>
              
              <div>
                <div class="text-xs font-bold text-foreground flex items-center gap-2">
                  {item.expand?.user_id?.email || 'System'}
                  <span class="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] uppercase tracking-tighter opacity-70">
                    {item.type}
                  </span>
                </div>
                <div class="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                  <Clock class="h-3 w-3" />
                  {new Date(item.created).toLocaleString()}
                </div>
              </div>
            </div>

            <Button variant="ghost" size="sm" onclick={() => handleRestore(item)} class="opacity-0 group-hover:opacity-100 h-8 px-2 text-xs">
              <RotateCcw class="h-3 w-3 mr-1" />
              Откатить
            </Button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Dialog>