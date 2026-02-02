<!-- src/lib/components/cases/SuiteTree.svelte -->
<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { pb } from "$lib/pb";
  import {
    ChevronRight,
    Folder,
    FolderOpen,
    FileText,
    FolderPlus,
    FilePlus,
    Trash2,
  } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import type { TreeNode } from "$lib/treeUtils";

  let {
    node,
    level = 0,
    activeCaseId = null,
    isSelectionMode = false,
    selectedIds = [],
    onSelect,
    onCreate,
    onToggleSelect,
    onMove, // <--- НОВЫЙ ПРОП
  } = $props<{
    node: TreeNode;
    level?: number;
    activeCaseId?: string | null;
    isSelectionMode?: boolean;
    selectedIds?: string[];
    onSelect: (id: string, type: "suite" | "case") => void;
    onCreate: (parentId: string, type: "suite" | "case") => void;
    onToggleSelect?: (id: string) => void;
    onMove: (
      id: string,
      type: "suite" | "case",
      targetSuiteId: string | null,
    ) => void;
  }>();

  let isOpen = $state(false);
  let isDragOver = $state(false); // Для подсветки при наведении

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    if (isSelectionMode) {
      onToggleSelect?.(node.id);
    } else {
      if (node.type === "suite") isOpen = !isOpen;
      else onSelect(node.id, "case");
    }
  }

  // --- Drag & Drop Logic ---
  function handleDragStart(e: DragEvent) {
    if (isSelectionMode) return;
    e.dataTransfer?.setData("application/tms-id", node.id);
    e.dataTransfer?.setData("application/tms-type", node.type);
    // Добавляем эффект призрака
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    const draggedId = e.dataTransfer?.getData('application/tms-id');
    if (draggedId === node.id) return;

    isDragOver = true;
  }

  function handleDragLeave() {
    isDragOver = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation(); // ВАЖНО: предотвращаем срабатывание drop на родительских папках
    isDragOver = false;

    const draggedId = e.dataTransfer?.getData("application/tms-id");
    const draggedType = e.dataTransfer?.getData("application/tms-type") as
      | "suite"
      | "case";

    if (draggedId && draggedId !== node.id) {
      // Если мы бросаем на папку — она становится родителем (node.id)
      // Если бросаем на кейс — он перемещается в ту же папку, где лежит этот кейс (node.parentId)
      const targetSuiteId = node.type === "suite" ? node.id : node.parentId;

      onMove(draggedId, draggedType, targetSuiteId);
    }
  }
</script>

<div
  draggable={!isSelectionMode}
  ondragstart={handleDragStart}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  class="outline-none"
>
  <!-- Row -->
  <div
    role="button"
    tabindex="0"
    onclick={handleClick}
    class={cn(
      "group flex items-center gap-1.5 py-1 px-2 cursor-pointer select-none text-sm transition-all rounded-md mx-1 relative border",
      // Состояние активного кейса
      activeCaseId === node.id && node.type === "case"
        ? "bg-primary/10 text-primary border-transparent"
        : "text-muted hover:bg-black/5 hover:text-foreground border-transparent",

      // ИСПРАВЛЕНО: Улучшенная подсветка цели при Drag-and-Drop
      isDragOver &&
        "border-primary bg-primary/10 ring-1 ring-primary/30 z-10 scale-[1.02] shadow-sm",

      // Режим массового выбора
      isSelectionMode &&
        selectedIds.includes(node.id) &&
        "bg-primary/5 border-primary/20",
    )}
    style="padding-left: {level * 12 + 8}px"
  >
    <!-- Checkbox (Selection Mode) -->
    {#if isSelectionMode}
      <div
        class={cn(
          "h-3.5 w-3.5 rounded border flex items-center justify-center mr-1",
          selectedIds.includes(node.id)
            ? "bg-primary border-primary"
            : "border-muted/40 bg-surface",
        )}
      >
        {#if selectedIds.includes(node.id)}
          <svg
            class="w-2.5 h-2.5 text-primary-fg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="4"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        {/if}
      </div>
    {/if}

    <span
      class={cn(
        "h-4 w-4 flex items-center justify-center transition-transform shrink-0",
        isOpen && "rotate-90",
        node.type === "case" && "opacity-0",
      )}
    >
      {#if node.type === "suite"}
        <ChevronRight class="h-3 w-3" />
      {/if}
    </span>

    {#if node.type === "suite"}
      {#if isOpen}
        <FolderOpen class="h-4 w-4 text-primary/80 shrink-0" />
      {:else}
        <Folder class="h-4 w-4 shrink-0" />
      {/if}
    {:else}
      <FileText class="h-3.5 w-3.5 shrink-0" />
    {/if}

    <span class="truncate flex-1">{node.name}</span>

    <!-- Actions (Hover) -->
    {#if node.type === "suite" && !isSelectionMode}
      <div
        class="hidden group-hover:flex items-center gap-0.5 bg-surface border border-border rounded shadow-sm absolute right-1 z-10 p-0.5"
      >
        <button
          onclick={(e) => {
            e.stopPropagation();
            onCreate(node.id, "suite");
            isOpen = true;
          }}
          class="p-1 hover:bg-primary hover:text-white rounded text-muted"
          ><FolderPlus class="h-3 w-3" /></button
        >
        <button
          onclick={(e) => {
            e.stopPropagation();
            onCreate(node.id, "case");
            isOpen = true;
          }}
          class="p-1 hover:bg-primary hover:text-white rounded text-muted"
          ><FilePlus class="h-3 w-3" /></button
        >
        <button
          onclick={handleDeleteSuite}
          class="p-1 hover:bg-danger hover:text-white rounded text-muted"
          ><Trash2 class="h-3 w-3" /></button
        >
      </div>
    {/if}
  </div>

  {#if isOpen && node.children}
    <div>
      {#each node.children as child (child.id)}
        <svelte:self
          node={child}
          level={level + 1}
          {activeCaseId}
          {isSelectionMode}
          {selectedIds}
          {onSelect}
          {onCreate}
          {onToggleSelect}
          {onMove}
        />
      {/each}
    </div>
  {/if}
</div>
