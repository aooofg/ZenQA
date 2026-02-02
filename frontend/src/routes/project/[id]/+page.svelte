<!-- src\routes\project\[id]\+page.svelte -->
<script lang="ts">
    import { cn } from "$lib/utils";
    import {
        FileText,
        Play,
        CheckCircle2,
        XCircle,
        Zap,
        Clock,
        ChevronRight,
        BarChart3,
        Target,
        Bug,
    } from "lucide-svelte";
    import ProgressRing from "$lib/components/ui/ProgressRing.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";

    // В Svelte 5 получаем данные из props
    let { data } = $props();

    // ОТЛАДКА: Раскомментируй строку ниже и посмотри в консоль браузера (F12)
    // console.log("Данные дашборда:", data);

    // Используем функции для получения данных, чтобы они точно пересчитывались
    let totalCases = $derived(data?.cases?.length || 0);
    let automatedCases = $derived(
        data?.cases?.filter((c: any) => c.automation_status === "automated")
            .length || 0,
    );
    let automationRate = $derived(
        totalCases > 0 ? (automatedCases / totalCases) * 100 : 0,
    );

    let recentRuns = $derived(data?.runs || []);
    let lastRun = $derived(recentRuns.length > 0 ? recentRuns[0] : null);

    let runStats = $derived({
        total: data?.lastRunResults?.length || 0,
        passed:
            data?.lastRunResults?.filter((r: any) => r.status === "passed")
                .length || 0,
        failed:
            data?.lastRunResults?.filter((r: any) => r.status === "failed")
                .length || 0,
        skipped:
            data?.lastRunResults?.filter((r: any) => r.status === "skipped")
                .length || 0,
    });

    let passRate = $derived(
        runStats.total > 0 ? (runStats.passed / runStats.total) * 100 : 0,
    );
</script>

<!-- HTML часть остается такой же, как была -->

<div class="h-full w-full overflow-y-auto custom-scrollbar bg-bg-main">
    <div class="p-8 md:p-12 max-w-6xl mx-auto space-y-10 pb-24">
        <!-- Welcome Header -->
        <div class="flex items-end justify-between border-b border-border pb-6">
            <div>
                <h1 class="text-3xl font-bold tracking-tight">Обзор проекта</h1>
                <p class="text-muted mt-1">
                    Текущее состояние качества и покрытия
                </p>
            </div>
            <div class="text-right">
                <p
                    class="text-[10px] font-bold text-muted uppercase tracking-widest leading-none"
                >
                    ID Проекта
                </p>
                <p class="font-mono text-sm mt-1">{data?.projectId || "..."}</p>
            </div>
        </div>

        <!-- Ключевые карточки статистики -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
                class="bg-surface border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
                <div class="flex items-center justify-between mb-3">
                    <div
                        class="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary"
                    >
                        <FileText class="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" class="text-[10px]"
                        >Library</Badge
                    >
                </div>
                <div class="text-3xl font-bold">{totalCases}</div>
                <div
                    class="text-xs text-muted font-medium mt-1 uppercase tracking-wider"
                >
                    Всего тест-кейсов
                </div>
            </div>

            <div
                class="bg-surface border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
                <div class="flex items-center justify-between mb-3">
                    <div
                        class="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary"
                    >
                        <Zap class="h-5 w-5" />
                    </div>
                    <span
                        class="text-[10px] font-bold text-primary uppercase tracking-wider"
                        >{Math.round(automationRate)}%</span
                    >
                </div>
                <div class="text-3xl font-bold">{automatedCases}</div>
                <div
                    class="text-xs text-muted font-medium mt-1 uppercase tracking-wider"
                >
                    Автоматизировано
                </div>
            </div>

            <!-- Последний результат (Дашборд) -->
            <div
                class="bg-surface border border-border p-5 rounded-xl shadow-sm md:col-span-2 flex items-center gap-8"
            >
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <Target class="h-4 w-4 text-success" />
                        <h4
                            class="text-xs font-bold text-muted uppercase tracking-wider"
                        >
                            Последний результат
                        </h4>
                    </div>
                    {#if lastRun}
                        <div class="text-xl font-bold line-clamp-1 mb-1">
                            {lastRun.title}
                        </div>

                        <!-- СТАТИСТИКА: Добавлен блок skipped -->
                        <div class="flex gap-4 mb-2">
                            <div class="text-xs">
                                <span class="text-success font-bold"
                                    >{runStats.passed}</span
                                >
                                <span class="text-muted"> passed</span>
                            </div>
                            <div class="text-xs">
                                <span class="text-danger font-bold"
                                    >{runStats.failed}</span
                                >
                                <span class="text-muted"> failed</span>
                            </div>
                            <!-- НОВОЕ: Skipped -->
                            <div class="text-xs">
                                <span class="text-warning font-bold"
                                    >{runStats.skipped}</span
                                >
                                <span class="text-muted"> skipped</span>
                            </div>
                        </div>

                        <div
                            class="text-[10px] text-muted flex items-center gap-2 italic"
                        >
                            <Clock class="h-3 w-3" />
                            {new Date(lastRun.created).toLocaleString()}
                        </div>
                    {:else}
                        <div class="text-muted italic text-sm">
                            Прогонов еще не было
                        </div>
                    {/if}
                </div>

                <!-- Наш SVG-график -->
                <ProgressRing percentage={passRate} size={90} stroke={8} />
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-4">
                <div class="flex items-center justify-between px-1">
                    <h3
                        class="font-bold flex items-center gap-2 text-foreground"
                    >
                        <BarChart3 class="h-4 w-4 text-primary" />
                        Последние запуски
                    </h3>
                    <a
                        href="/project/{data?.projectId}/runs"
                        class="text-xs text-primary hover:underline"
                        >Все запуски</a
                    >
                </div>

                <div
                    class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden"
                >
                    <table class="w-full text-sm text-left">
                        <thead
                            class="bg-panel/50 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-border"
                        >
                            <tr>
                                <th class="px-6 py-3">Название</th>
                                <th class="px-6 py-3">Дата</th>
                                <th class="px-6 py-3">Статус</th>
                                <th class="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                            {#each recentRuns as run}
                                <tr class="hover:bg-panel/30 transition-colors">
                                    <td class="px-6 py-4 font-medium"
                                        >{run.title}</td
                                    >
                                    <td class="px-6 py-4 text-muted text-xs"
                                        >{new Date(
                                            run.created,
                                        ).toLocaleDateString()}</td
                                    >
                                    <td class="px-6 py-4">
                                        <Badge
                                            variant={run.status === "active"
                                                ? "default"
                                                : "secondary"}
                                        >
                                            {run.status}
                                        </Badge>
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <a
                                            href="/project/{data?.projectId}/runs/{run.id}"
                                            class="text-muted hover:text-primary"
                                        >
                                            <ChevronRight class="h-4 w-4" />
                                        </a>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                    {#if recentRuns.length === 0}
                        <div class="p-8 text-center text-muted text-sm italic">
                            Ни одного запуска не найдено.
                        </div>
                    {/if}
                </div>
            </div>

            <div class="space-y-4">
                <h3 class="font-bold px-1 text-foreground">Интеграции</h3>
                <!-- Интеграции на Дашборде -->
                <div
                    class="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="h-10 w-10 bg-warning/10 rounded flex items-center justify-center text-warning shrink-0"
                        >
                            <Bug class="h-6 w-6" />
                            <!-- Поменял иконку на Bug -->
                        </div>
                        <div>
                            <div class="text-sm font-bold">
                                Gitea Integration
                            </div>
                            <!-- ИСПРАВЛЕННОЕ УСЛОВИЕ -->
                            {#if data.project?.gitea_url && data.project?.gitea_owner && data.project?.gitea_repo}
                                <p
                                    class="text-xs text-success flex items-center gap-1 mt-1 font-medium"
                                >
                                    <CheckCircle2 class="h-3 w-3" /> Настроено
                                </p>
                                <p class="text-[10px] text-muted mt-1">
                                    Репозиторий: {data.project.gitea_repo}
                                </p>
                            {:else}
                                <p
                                    class="text-xs text-muted mt-1 leading-relaxed"
                                >
                                    Не настроено. Баги будут создаваться
                                    вручную.
                                </p>
                                <a
                                    href="/project/{data?.projectId}/settings"
                                    class="text-[10px] text-primary hover:underline font-bold uppercase mt-2 block tracking-widest"
                                    >Перейти в настройки</a
                                >
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
