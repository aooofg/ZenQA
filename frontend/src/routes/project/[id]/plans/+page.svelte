<script lang="ts">
    import { pb } from '$lib/pb';
    import { invalidateAll } from '$app/navigation';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import { FileText, Plus, Loader2, Calendar } from 'lucide-svelte';

    let { data } = $props();

    // Create Logic
    let isCreateOpen = $state(false);
    let isCreating = $state(false);
    let newPlan = $state({ name: '', description: '' });

    async function createPlan() {
        if (!newPlan.name) return;
        isCreating = true;
        try {
            await pb.collection('test_plans').create({
                name: newPlan.name,
                description: newPlan.description,
                project_id: data.projectId,
                case_ids: [] // Пока пусто
            });
            await invalidateAll();
            isCreateOpen = false;
            newPlan = { name: '', description: '' };
        } catch (e) {
            console.error(e);
            alert("Ошибка создания плана");
        } finally {
            isCreating = false;
        }
    }
</script>

<div class="p-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-8">
        <div>
            <h1 class="text-2xl font-bold tracking-tight">Тест-планы</h1>
            <p class="text-muted">Шаблоны для регулярных запусков</p>
        </div>
        <Button onclick={() => isCreateOpen = true}>
            <Plus class="h-4 w-4 mr-2" />
            Создать план
        </Button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#if data.plans.length === 0}
            <div class="col-span-full text-center py-12 bg-panel rounded-lg border border-dashed border-border">
                <p class="text-muted">Нет тест-планов. Создайте первый!</p>
            </div>
        {/if}

        {#each data.plans as plan (plan.id)}
            <a href="/project/{data.projectId}/plans/{plan.id}" class="group block">
                <div class="h-full p-5 bg-surface rounded-lg border border-border shadow-sm hover:border-primary hover:shadow-md transition-all flex flex-col">
                    <div class="flex items-start justify-between mb-4">
                        <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <FileText class="h-5 w-5" />
                        </div>
                        <span class="text-xs text-muted font-mono bg-panel px-2 py-1 rounded">
                            {plan.case_ids?.length || 0} CASES
                        </span>
                    </div>
                    
                    <h3 class="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{plan.name}</h3>
                    <p class="text-sm text-muted line-clamp-2 flex-1">{plan.description || 'Нет описания'}</p>
                    
                    <div class="mt-4 pt-4 border-t border-border flex items-center text-xs text-muted">
                        <Calendar class="h-3 w-3 mr-1" />
                        {new Date(plan.created).toLocaleDateString()}
                    </div>
                </div>
            </a>
        {/each}
    </div>
</div>

<!-- Modal -->
<Dialog bind:open={isCreateOpen} title="Новый тест-план">
    <div class="space-y-4">
        <div class="space-y-1">
            <label class="text-xs font-semibold text-muted uppercase">Название</label>
            <Input bind:value={newPlan.name} placeholder="Например: Regression Suite" autofocus />
        </div>
        <div class="space-y-1">
            <label class="text-xs font-semibold text-muted uppercase">Описание</label>
            <Input bind:value={newPlan.description} placeholder="Краткое описание..." />
        </div>
        <div class="flex justify-end pt-2">
            <Button onclick={createPlan} disabled={isCreating || !newPlan.name}>
                {#if isCreating} <Loader2 class="h-4 w-4 animate-spin mr-2" /> {/if}
                Создать
            </Button>
        </div>
    </div>
</Dialog>