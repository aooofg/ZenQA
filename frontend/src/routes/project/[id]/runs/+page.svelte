<!-- src\routes\project\[id]\runs\+page.svelte -->
<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import { pb } from "$lib/pb";
    import {
        Plus,
        Play,
        Calendar,
        Server,
        Loader2,
        FileText,
        Clock,
    } from "lucide-svelte";
    import Button from "$lib/components/ui/Button.svelte";
    import Dialog from "$lib/components/ui/Dialog.svelte";
    import Input from "$lib/components/ui/Input.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";

    let { data } = $props();

    let isCreateOpen = $state(false);
    let isCreating = $state(false);

    let newRun = $state({
        title: "",
        environment: "Production",
        planId: "",
    });

    // Форматирование минут в "1ч 30м"
    function formatDuration(minutes: number) {
        if (!minutes || minutes === 0) return null;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}ч ${m}м` : `${m}м`;
    }

    async function createRun() {
        if (!newRun.title) return;
        isCreating = true;

        try {
            let casesToRun = [];
            if (newRun.planId) {
                const selectedPlan = data.plans.find(
                    (p: any) => p.id === newRun.planId,
                );
                if (selectedPlan?.case_ids?.length > 0) {
                    const filter = selectedPlan.case_ids
                        .map((id: string) => `id="${id}"`)
                        .join(" || ");
                    casesToRun = await pb
                        .collection("cases")
                        .getFullList({ filter });
                }
            } else {
                casesToRun = await pb.collection("cases").getFullList({
                    filter: `project_id="${data.projectId}"`,
                });
            }

            if (casesToRun.length === 0) {
                alert("Нет кейсов для запуска.");
                isCreating = false;
                return;
            }

            const run = await pb.collection("runs").create({
                title: newRun.title,
                environment: newRun.environment,
                project_id: data.projectId,
                status: "active",
            });

            const promises = casesToRun.map((c: any) => {
                return pb.collection("run_results").create(
                    {
                        run_id: run.id,
                        case_id: c.id,
                        status: "untest",
                        snapshotted_data: {
                            title: c.title,
                            steps: c.steps,
                            pre_condition: c.pre_condition,
                            post_condition: c.post_condition,
                        },
                    },
                    { requestKey: null },
                );
            });

            await Promise.all(promises);
            await invalidateAll();
            isCreateOpen = false;
            newRun = { title: "", environment: "Production", planId: "" };
        } catch (e) {
            console.error(e);
            alert("Ошибка при создании прогона");
        } finally {
            isCreating = false;
        }
    }
</script>

<!-- Добавлен h-full и overflow-y-auto для появления скролла -->
<div class="h-full overflow-y-auto custom-scrollbar bg-bg-main">
    <div class="p-8 max-w-5xl mx-auto pb-24">
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-2xl font-bold tracking-tight">Запуски</h1>
                <p class="text-muted">История выполнения тестов</p>
            </div>
            <Button onclick={() => (isCreateOpen = true)}>
                <Plus class="h-4 w-4 mr-2" />
                Новый запуск
            </Button>
        </div>

        <div class="grid gap-4">
            {#if data.runs.length === 0}
                <div
                    class="text-center py-12 bg-panel rounded-lg border border-dashed border-border"
                >
                    <p class="text-muted text-sm italic">
                        История запусков пуста
                    </p>
                </div>
            {/if}

            {#each data.runs as run (run.id)}
                <a
                    href="/project/{data.projectId}/runs/{run.id}"
                    class="group block"
                >
                    <div
                        class="flex items-center justify-between p-4 bg-surface border border-border rounded-xl shadow-sm hover:border-primary transition-all duration-200"
                    >
                        <div class="flex items-center gap-4">
                            <div
                                class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200"
                            >
                                <Play class="h-5 w-5 fill-current" />
                            </div>
                            <div>
                                <h3
                                    class="font-bold text-lg group-hover:text-primary transition-colors"
                                >
                                    {run.title}
                                </h3>
                                <div
                                    class="flex items-center gap-4 text-xs text-muted mt-1"
                                >
                                    <span class="flex items-center gap-1.5"
                                        ><Server class="h-3.5 w-3.5" />
                                        {run.environment}</span
                                    >
                                    <span class="flex items-center gap-1.5"
                                        ><Calendar class="h-3.5 w-3.5" />
                                        {new Date(
                                            run.created,
                                        ).toLocaleDateString()}</span
                                    >

                                    <!-- ВЫВОД ВРЕМЕНИ ПРОГОНА НА КАРТОЧКЕ -->
                                    {#if run.finishDuration}
                                        <span
                                            class="flex items-center gap-1.5 text-foreground font-bold bg-panel px-2 py-0.5 rounded border border-border"
                                        >
                                            <Clock
                                                class="h-3 w-3 text-primary"
                                            />
                                            {formatDuration(run.finishDuration)}
                                        </span>
                                    {/if}
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-4">
                            <Badge
                                variant={run.status === "active"
                                    ? "default"
                                    : "secondary"}
                            >
                                {run.status}
                            </Badge>
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    </div>
</div>

<Dialog bind:open={isCreateOpen} title="Запуск тестирования">
    <div class="space-y-4">
        <div class="space-y-1">
            <label
                class="text-[10px] font-bold text-muted uppercase tracking-wider"
                >Название прогона</label
            >
            <Input
                bind:value={newRun.title}
                placeholder="Например: Релиз 1.2.0"
                autofocus
            />
        </div>
        <div class="space-y-1">
            <label
                class="text-[10px] font-bold text-muted uppercase tracking-wider"
                >Окружение</label
            >
            <select
                bind:value={newRun.environment}
                class="w-full bg-surface border border-input rounded-md px-3 py-2 text-sm focus:ring-1 ring-primary outline-none transition-shadow"
            >
                <option>Production</option>
                <option>Staging</option>
                <option>Dev</option>
                <option>QA</option>
            </select>
        </div>
        <div class="space-y-1">
            <label
                class="text-[10px] font-bold text-muted uppercase tracking-wider"
                >Тест-план (Опционально)</label
            >
            <div class="relative">
                <select
                    bind:value={newRun.planId}
                    class="w-full bg-surface border border-input rounded-md pl-10 pr-3 py-2 text-sm focus:ring-1 ring-primary outline-none appearance-none transition-shadow"
                >
                    <option value="">Весь проект (Все кейсы)</option>
                    {#each data.plans as plan}
                        <option value={plan.id}
                            >{plan.name} ({plan.case_ids?.length || 0} кейсов)</option
                        >
                    {/each}
                </select>
                <FileText
                    class="absolute left-3 top-2.5 h-4 w-4 text-muted pointer-events-none"
                />
            </div>
        </div>
        <div class="flex justify-end pt-4 border-t border-border mt-6">
            <Button
                onclick={createRun}
                disabled={isCreating || !newRun.title}
                class="min-w-[150px]"
            >
                {#if isCreating}
                    <Loader2 class="h-4 w-4 animate-spin mr-2" />
                {/if}
                Начать тестирование
            </Button>
        </div>
    </div>
</Dialog>
