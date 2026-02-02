<!-- src/routes/project/[id]/library/+page.svelte -->
<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import { pb } from "$lib/pb";
    import { cn } from "$lib/utils";
    import { ui } from "$lib/ui.svelte";
    import { buildTree, isDescendant } from "$lib/treeUtils";
    import { onMount } from "svelte"; // <--- ДОБАВЬ ЭТУ СТРОКУ

    import SuiteTree from "$lib/components/cases/SuiteTree.svelte";
    import CaseEditor from "$lib/components/cases/CaseEditor.svelte";
    import Input from "$lib/components/ui/Input.svelte";
    import Dialog from "$lib/components/ui/Dialog.svelte";
    import Button from "$lib/components/ui/Button.svelte";
    import {
        Search,
        Inbox,
        FolderPlus,
        FilePlus,
        Loader2,
        CheckSquare,
        X,
        Trash2,
        FolderInput,
        PanelLeftClose,
        PanelLeftOpen, // <--- NEW
    } from "lucide-svelte";

    let { data } = $props();

    // Tree Logic
    let treeNodes = $derived(buildTree(data.suites || [], data.cases || []));
    let activeCaseId = $state<string | null>(null);
    
    // --- SELECTION & BULK ACTIONS ---
    let isSelectionMode = $state(false);
    let selectedIds = $state<string[]>([]);
    let isBulkProcessing = $state(false);

    // Move Modal
    let isMoveModalOpen = $state(false);
    let targetSuiteId = $state<string | null>(null);

    // --- DRAG & DROP HANDLER ---
    async function handleMove(id: string, type: 'suite' | 'case', targetSuiteId: string | null) {
        // Если пытаемся переместить в ту же папку, где объект и так лежит — ничего не делаем
        const item = type === 'suite' 
            ? data.suites.find((s: any) => s.id === id)
            : data.cases.find((c: any) => c.id === id);
        
        const currentParentId = type === 'suite' ? item?.parent_id : item?.suite_id;
        if (currentParentId === targetSuiteId) return;

        try {
            // Валидация ТОЛЬКО для папок (чтобы не засунуть родителя в ребенка)
            if (type === 'suite' && targetSuiteId) {
                if (id === targetSuiteId || isDescendant(treeNodes, id, targetSuiteId)) {
                    console.warn("Invalid move: cannot move suite into itself or its descendants");
                    return;
                }
            }

            // Обновление в БД
            if (type === 'suite') {
                await pb.collection('suites').update(id, { parent_id: targetSuiteId });
            } else {
                await pb.collection('cases').update(id, { suite_id: targetSuiteId });
            }

            // invalidateAll() сработает через подписку (subscribe), которую мы добавили ранее
        } catch (e) {
            console.error("Move failed:", e);
        }
    }

    // Обработчик для сброса в корень (на пустое место)
    function handleDropToRoot(e: DragEvent) {
        e.preventDefault();
        const draggedId = e.dataTransfer?.getData("application/tms-id");
        const draggedType = e.dataTransfer?.getData("application/tms-type") as
            | "suite"
            | "case";
        if (draggedId) handleMove(draggedId, draggedType, null);
    }

    function toggleSelectionMode() {
        isSelectionMode = !isSelectionMode;
        selectedIds = [];
    }

    function handleToggleSelect(id: string) {
        if (selectedIds.includes(id)) {
            selectedIds = selectedIds.filter((i) => i !== id);
        } else {
            selectedIds = [...selectedIds, id];
        }
    }

    async function handleBulkDelete() {
        if (!confirm(`Удалить выбранные элементы (${selectedIds.length})?`))
            return;

        isBulkProcessing = true;
        try {
            const promises = selectedIds.map((id) => {
                const isSuite = data.suites.find((s: any) => s.id === id);
                const collection = isSuite ? "suites" : "cases";
                return pb.collection(collection).delete(id);
            });

            await Promise.all(promises);
            await invalidateAll();
            selectedIds = [];
            isSelectionMode = false;
        } catch (e) {
            console.error(e);
            alert("Ошибка при массовом удалении");
        } finally {
            isBulkProcessing = false;
        }
    }

    async function handleBulkMove() {
        if (!targetSuiteId && targetSuiteId !== null) return;

        isBulkProcessing = true;
        try {
            const promises = selectedIds.map((id) => {
                const isSuite = data.suites.find((s: any) => s.id === id);
                if (isSuite) {
                    if (id === targetSuiteId) return Promise.resolve();
                    return pb
                        .collection("suites")
                        .update(id, { parent_id: targetSuiteId });
                } else {
                    return pb
                        .collection("cases")
                        .update(id, { suite_id: targetSuiteId });
                }
            });

            await Promise.all(promises);
            await invalidateAll();
            isMoveModalOpen = false;
            selectedIds = [];
            isSelectionMode = false;
        } catch (e) {
            console.error(e);
            alert("Ошибка при перемещении");
        } finally {
            isBulkProcessing = false;
        }
    }

    // --- CREATE LOGIC ---
    let isCreateOpen = $state(false);
    let isCreating = $state(false);
    let createMode = $state<"suite" | "case">("suite");
    let createParentId = $state<string | null>(null);
    let newItem = $state({ name: "" });

    function openCreateDialog(
        type: "suite" | "case",
        parentId: string | null = null,
    ) {
        createMode = type;
        createParentId = parentId;
        newItem.name = "";
        isCreateOpen = true;
    }

    async function handleCreate() {
        if (!newItem.name) return;
        isCreating = true;
        try {
            let record;
            if (createMode === "suite") {
                record = await pb.collection("suites").create({
                    name: newItem.name,
                    project_id: data.projectId,
                    parent_id: createParentId,
                });
            } else {
                record = await pb.collection("cases").create({
                    title: newItem.name,
                    project_id: data.projectId,
                    suite_id: createParentId || "", // Гарантируем пустую строку вместо null для корня
                    priority: "medium",
                    automation_status: "manual", // УСТАНАВЛИВАЕМ ПО УМОЛЧАНИЮ
                    status: "draft",
                    steps: [{ action: "", expected: "" }],
                });
            }

            await invalidateAll();
            isCreateOpen = false;
            if (createMode === "case") activeCaseId = record.id;
        } catch (err) {
            console.error(err);
            alert("Ошибка при создании");
        } finally {
            isCreating = false;
        }
    }

    function handleSelect(id: string, type: "suite" | "case") {
        if (type === "case") activeCaseId = id;
    }
</script>

<!-- GRID CHANGED: Added transition and dynamic columns -->
<div
    class={cn(
        "grid h-full divide-x divide-border overflow-hidden relative transition-all duration-300 ease-in-out",
        ui.isSidebarOpen ? "grid-cols-[300px_1fr]" : "grid-cols-[0px_1fr]",
    )}
>
    <!-- LEFT PANEL: Tree -->
    <!-- ondragover и ondrop позволяют сбрасывать элементы в корень, если промахнулись мимо папки -->
    <div
        class="flex flex-col bg-panel h-full overflow-hidden relative min-w-0"
        ondragover={(e) => e.preventDefault()}
        ondrop={handleDropToRoot}
    >
        <div class="p-2 border-b border-border space-y-2 shrink-0">
            <div class="flex gap-2">
                <!-- Search / Selection Info -->
                {#if !isSelectionMode}
                    <div class="relative flex-1">
                        <Search
                            class="absolute left-2 top-2 h-4 w-4 text-muted"
                        />
                        <Input
                            class="pl-8 bg-surface border-transparent h-8"
                            placeholder="Поиск..."
                        />
                    </div>
                {:else}
                    <div
                        class="flex-1 flex items-center px-2 text-sm text-primary font-bold bg-primary/10 rounded border border-primary/20"
                    >
                        Выбрано: {selectedIds.length}
                    </div>
                {/if}

                <!-- Toggle Select Mode -->
                <button
                    onclick={toggleSelectionMode}
                    class={cn(
                        "h-8 w-8 flex items-center justify-center rounded border transition-colors shrink-0",
                        isSelectionMode
                            ? "bg-primary text-white border-primary shadow-neo"
                            : "bg-surface border-transparent hover:border-border text-muted",
                    )}
                    title="Выбор нескольких"
                >
                    {#if isSelectionMode}
                        <X class="h-4 w-4" />
                    {:else}
                        <CheckSquare class="h-4 w-4" />
                    {/if}
                </button>

                <!-- Action Buttons (Only normal mode) -->
                {#if !isSelectionMode}
                    <button
                        onclick={() => openCreateDialog("suite", null)}
                        class="h-8 w-8 flex items-center justify-center rounded bg-surface border border-transparent hover:border-border hover:text-primary transition-colors shrink-0"
                        title="Создать папку"
                    >
                        <FolderPlus class="h-4 w-4" />
                    </button>

                    <button
                        onclick={() => openCreateDialog("case", null)}
                        class="h-8 w-8 flex items-center justify-center rounded bg-surface border border-transparent hover:border-border hover:text-primary transition-colors shrink-0"
                        title="Создать тест-кейс"
                    >
                        <FilePlus class="h-4 w-4" />
                    </button>

                    <!-- SIDEBAR CLOSE BUTTON -->
                    <button
                        onclick={() => ui.toggleSidebar()}
                        class="h-8 w-8 flex items-center justify-center rounded bg-surface border border-transparent hover:border-border text-muted hover:text-foreground transition-colors shrink-0 ml-1"
                        title="Свернуть меню"
                    >
                        <PanelLeftClose class="h-4 w-4" />
                    </button>
                {/if}
            </div>
        </div>

        <div class="flex-1 overflow-y-auto p-2 custom-scrollbar pb-16">
            {#if treeNodes.length === 0}
                <div class="text-center py-8 text-sm text-muted">
                    Пусто. Создайте первую папку.
                </div>
            {/if}

            {#each treeNodes as node (node.id)}
                <!-- @ts-ignore -->
                <SuiteTree
                    {node}
                    {activeCaseId}
                    {isSelectionMode}
                    {selectedIds}
                    onSelect={handleSelect}
                    onCreate={(parentId, type) =>
                        openCreateDialog(type, parentId)}
                    onToggleSelect={handleToggleSelect}
                    onMove={handleMove}
                />
            {/each}

            <!-- Дополнительная зона внизу для удобного сброса в корень -->
            <div
                class="h-32 w-full"
                ondragover={(e) => e.preventDefault()}
            ></div>
        </div>

        <!-- FLOATING ACTION BAR -->
        {#if isSelectionMode && selectedIds.length > 0}
            <div class="absolute bottom-4 left-4 right-4 z-20">
                <div
                    class="bg-surface border border-border rounded-lg shadow-neo p-2 flex items-center justify-between gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200"
                >
                    <Button
                        size="sm"
                        variant="danger"
                        class="flex-1 text-[10px]"
                        onclick={handleBulkDelete}
                        disabled={isBulkProcessing}
                    >
                        <Trash2 class="h-3 w-3 mr-1" /> Удалить
                    </Button>
                    <div class="w-px h-4 bg-border"></div>
                    <Button
                        size="sm"
                        variant="default"
                        class="flex-1 text-[10px]"
                        onclick={() => (isMoveModalOpen = true)}
                        disabled={isBulkProcessing}
                    >
                        <FolderInput class="h-3 w-3 mr-1" /> Переместить
                    </Button>
                </div>
            </div>
        {/if}
    </div>

    <!-- RIGHT PANEL: Editor -->
    <div class="h-full overflow-hidden bg-bg-main relative flex flex-col">
        <!-- SIDEBAR OPEN BUTTON (Floating) -->
        {#if !ui.isSidebarOpen}
            <button
                onclick={() => ui.toggleSidebar()}
                class="absolute left-2 top-2 z-50 p-2 bg-surface border border-border rounded-md shadow-neo text-muted hover:text-primary transition-all hover:scale-105"
                title="Показать меню"
            >
                <PanelLeftOpen class="h-5 w-5" />
            </button>
        {/if}

        {#if activeCaseId}
            {#key activeCaseId}
                <CaseEditor caseId={activeCaseId} />
            {/key}
        {:else}
            <div
                class="h-full flex flex-col items-center justify-center text-muted"
            >
                <div
                    class="p-4 bg-panel rounded-full mb-4 border border-border shadow-neo"
                >
                    <Inbox class="h-8 w-8 opacity-50" />
                </div>
                <p class="font-medium">Выберите тест-кейс</p>
                <Button
                    variant="outline"
                    class="mt-4"
                    onclick={() => openCreateDialog("case", null)}
                >
                    <FilePlus class="h-4 w-4 mr-2" />
                    Создать кейс в корне
                </Button>
            </div>
        {/if}
    </div>
</div>

<!-- MODALS -->
<Dialog
    bind:open={isCreateOpen}
    title={createMode === "suite" ? "Новая папка" : "Новый тест-кейс"}
>
    <div class="space-y-4">
        <div class="space-y-1">
            <label
                class="text-[10px] font-bold text-muted uppercase tracking-widest pl-1"
                >Название</label
            >
            <Input
                bind:value={newItem.name}
                placeholder={createMode === "suite"
                    ? "Например: Authorization"
                    : "Например: Проверка входа"}
                autofocus
                onkeydown={(e) => e.key === "Enter" && handleCreate()}
            />
        </div>
        <div class="flex justify-end pt-2">
            <Button
                onclick={handleCreate}
                disabled={!newItem.name || isCreating}
            >
                {#if isCreating}
                    <Loader2 class="h-4 w-4 animate-spin mr-2" />
                {/if}
                Создать
            </Button>
        </div>
    </div>
</Dialog>

<Dialog bind:open={isMoveModalOpen} title="Переместить в...">
    <div class="space-y-4">
        <div
            class="p-3 bg-panel border border-border rounded text-sm text-muted"
        >
            Перемещение <b>{selectedIds.length}</b> объектов.
        </div>
        <div class="space-y-1">
            <label
                class="text-[10px] font-bold text-muted uppercase tracking-widest pl-1"
                >Выберите папку</label
            >
            <select
                bind:value={targetSuiteId}
                class="w-full bg-surface border border-input rounded-md px-3 py-2 text-sm focus:ring-1 ring-primary outline-none shadow-sm"
            >
                <option value={null}>— Корневая директория —</option>
                {#each data.suites as suite}
                    {#if !selectedIds.includes(suite.id)}
                        <option value={suite.id}>{suite.name}</option>
                    {/if}
                {/each}
            </select>
        </div>
        <div class="flex justify-end pt-2">
            <Button onclick={handleBulkMove} disabled={isBulkProcessing}>
                {#if isBulkProcessing}
                    <Loader2 class="h-4 w-4 animate-spin mr-2" />
                {/if}
                Переместить
            </Button>
        </div>
    </div>
</Dialog>
