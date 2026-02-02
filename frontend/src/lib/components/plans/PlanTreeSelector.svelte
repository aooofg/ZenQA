<script lang="ts">
  import { ChevronRight, Folder, FileText, Square, CheckSquare, MinusSquare } from 'lucide-svelte';
  import { cn } from '$lib/utils';
  import type { TreeNode } from '$lib/treeUtils';

  let { 
    node, 
    level = 0, 
    selectedIds = $bindable([]) 
  } = $props<{ 
    node: TreeNode, 
    level?: number, 
    selectedIds: string[] 
  }>();

  let isOpen = $state(level < 1); 

  function getAllChildCaseIds(item: TreeNode): string[] {
    let ids: string[] = [];
    if (item.type === 'case') ids.push(item.id);
    if (item.children) {
      item.children.forEach(child => {
        ids = [...ids, ...getAllChildCaseIds(child)];
      });
    }
    return ids;
  }

  let childCaseIds = $derived(getAllChildCaseIds(node));
  
  let isSelected = $derived(
    node.type === 'case' 
      ? selectedIds.includes(node.id)
      : childCaseIds.length > 0 && childCaseIds.every(id => selectedIds.includes(id))
  );

  let isIndeterminate = $derived(
    node.type === 'suite' && 
    !isSelected && 
    childCaseIds.some(id => selectedIds.includes(id))
  );

  function toggle() {
    if (node.type === 'case') {
      if (selectedIds.includes(node.id)) {
        selectedIds = selectedIds.filter(id => id !== node.id);
      } else {
        selectedIds = [...selectedIds, node.id];
      }
    } else {
      if (isSelected) {
        selectedIds = selectedIds.filter(id => !childCaseIds.includes(id));
      } else {
        const newIds = childCaseIds.filter(id => !selectedIds.includes(id));
        selectedIds = [...selectedIds, ...newIds];
      }
    }
  }
</script>

<div class="select-none">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="group flex items-center gap-2 py-1 px-2 hover:bg-black/5 rounded-md transition-colors cursor-pointer"
    style="padding-left: {level * 16 + 8}px"
    onclick={toggle}
  >
    <button 
      class="w-4 h-4 flex items-center justify-center text-muted hover:text-foreground"
      onclick={(e) => { e.stopPropagation(); isOpen = !isOpen; }}
    >
      {#if node.type === 'suite' && node.children?.length}
        <ChevronRight class={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
      {/if}
    </button>

    <div class="text-primary">
      {#if isSelected}
        <CheckSquare class="h-4 w-4" />
      {:else if isIndeterminate}
        <MinusSquare class="h-4 w-4 opacity-70" />
      {:else}
        <Square class="h-4 w-4 opacity-30 group-hover:opacity-100" />
      {/if}
    </div>

    <div class="flex items-center gap-2 text-sm {isSelected ? 'text-foreground font-medium' : 'text-muted'}">
      {#if node.type === 'suite'}
        <Folder class="h-4 w-4 {isSelected ? 'text-primary' : ''}" />
      {:else}
        <FileText class="h-3.5 w-3.5" />
      {/if}
      <span class="truncate">{node.name}</span>
    </div>
  </div>

  {#if isOpen && node.children}
    <div>
      {#each node.children as child (child.id)}
        <!-- ИСПОЛЬЗУЕМ svelte:self ДЛЯ РЕКУРСИИ -->
        <svelte:self node={child} level={level + 1} bind:selectedIds />
      {/each}
    </div>
  {/if}
</div>