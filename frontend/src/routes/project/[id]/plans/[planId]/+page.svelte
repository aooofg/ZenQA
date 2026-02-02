<script lang="ts">
    import { pb } from '$lib/pb';
    import { buildTree } from '$lib/treeUtils';
    import { cn } from '$lib/utils';
    import Button from '$lib/components/ui/Button.svelte';
    import PlanTreeSelector from '$lib/components/plans/PlanTreeSelector.svelte';
    import { Save, ChevronLeft, FileText, CheckCircle2, Loader2 } from 'lucide-svelte';

    let { data } = $props();
    
    // Состояние плана
    let plan = $state({ ...data.plan });
    let selectedIds = $state<string[]>(data.plan.case_ids || []);
    let isSaving = $state(false);

    // Строим дерево всей библиотеки проекта
    let treeNodes = $derived(buildTree(data.suites || [], data.cases || []));
    
    // Статистика
    let totalProjectCases = $derived(data.cases.length);
    let selectedCount = $derived(selectedIds.length);

    async function savePlan() {
        isSaving = true;
        try {
            await pb.collection('test_plans').update(plan.id, {
                name: plan.name,
                description: plan.description,
                case_ids: selectedIds
            });
            alert("План сохранен успешно");
        } catch (e) {
            console.error(e);
            alert("Ошибка сохранения плана");
        } finally {
            isSaving = false;
        }
    }
</script>

<div class="h-full flex flex-col bg-background overflow-hidden">
    <!-- Header -->
    <header class="h-14 border-b border-border bg-surface px-6 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
            <a href="/project/{data.projectId}/plans" class="text-muted hover:text-foreground">
                <ChevronLeft class="h-5 w-5" />
            </a>
            <div class="flex items-center gap-3">
                <div class="h-8 w-8 bg-primary/10 rounded flex items-center justify-center text-primary">
                    <FileText class="h-5 w-5" />
                </div>
                <div>
                    <h1 class="font-bold text-sm leading-none">{plan.name}</h1>
                    <p class="text-[10px] text-muted mt-1 uppercase tracking-wider">Редактирование тест-плана</p>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <div class="text-right mr-2">
                <div class="text-xs font-bold text-foreground">{selectedCount} / {totalProjectCases}</div>
                <div class="text-[10px] text-muted uppercase">Кейсов выбрано</div>
            </div>
            <Button onclick={savePlan} disabled={isSaving}>
                {#if isSaving}
                    <Loader2 class="h-4 w-4 mr-2 animate-spin" />
                {/if}
                <Save class="h-4 w-4 mr-2" />
                Сохранить план
            </Button>
        </div>
    </header>

    <div class="flex-1 overflow-hidden grid grid-cols-[350px_1fr]">
        <!-- Info Sidebar -->
        <div class="border-r border-border bg-panel p-6 space-y-6 overflow-y-auto">
            <div class="space-y-2">
                <label class="text-[10px] font-bold text-muted uppercase tracking-wider">Название</label>
                <input 
                    bind:value={plan.name}
                    class="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:ring-1 ring-primary outline-none"
                />
            </div>
            <div class="space-y-2">
                <label class="text-[10px] font-bold text-muted uppercase tracking-wider">Описание</label>
                <textarea 
                    bind:value={plan.description}
                    class="w-full h-32 bg-surface border border-border rounded-md px-3 py-2 text-sm focus:ring-1 ring-primary outline-none resize-none"
                ></textarea>
            </div>

            <div class="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                <h4 class="text-xs font-bold text-primary uppercase mb-2">Совет</h4>
                <p class="text-xs text-muted leading-relaxed">
                    Выбирайте папки целиком, чтобы все новые кейсы, добавленные в эти папки позже, автоматически попадали в этот план (в будущем релизе).
                </p>
            </div>
        </div>

        <!-- Selection Area -->
        <div class="bg-bg-main p-8 overflow-y-auto custom-scrollbar">
            <div class="max-w-3xl mx-auto">
                <div class="mb-6 flex items-center justify-between">
                    <h2 class="text-lg font-bold">Выберите кейсы из библиотеки</h2>
                    <div class="flex gap-2">
                         <Button variant="ghost" size="sm" onclick={() => selectedIds = []} class="text-xs">Сбросить всё</Button>
                    </div>
                </div>

                <div class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                    <div class="p-4 bg-panel/50 border-b border-border flex items-center justify-between text-[10px] font-bold text-muted uppercase">
                        <span>Структура проекта</span>
                        <span>Выбор</span>
                    </div>
                    <div class="p-4">
                        {#if treeNodes.length === 0}
                            <div class="text-center py-12 text-muted italic">Библиотека проекта пуста</div>
                        {/if}
                        {#each treeNodes as node (node.id)}
                            <PlanTreeSelector {node} bind:selectedIds />
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>