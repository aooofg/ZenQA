<!-- src\routes\project\[id]\runs\[runId]\+page.svelte -->
<script lang="ts">
    import { pb } from "$lib/pb";
    import { invalidateAll } from "$app/navigation";
    import { cn } from "$lib/utils";
    import { ui } from "$lib/ui.svelte";

    import StatusBadge from "$lib/components/runs/StatusBadge.svelte";
    import Button from "$lib/components/ui/Button.svelte";
    import Input from "$lib/components/ui/Input.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Dialog from "$lib/components/ui/Dialog.svelte";

    import {
        CheckCircle2,
        XCircle,
        AlertCircle,
        ChevronLeft,
        Search,
        Paperclip,
        Bug,
        ExternalLink,
        Loader2,
        Trash2,
        PanelLeftClose,
        PanelLeftOpen,
        Clock,
    } from "lucide-svelte";

    let { data } = $props();

    let { results: allResults, project } = data;
    let run = $state(data.run);

    let results = $state(allResults);
    let selectedId = $state<string | null>(
        results.length > 0 ? results[0].id : null,
    );

    let currentResult = $derived(results.find((r) => r.id === selectedId));
    let caseData = $derived(
        currentResult?.snapshotted_data?.title
            ? currentResult.snapshotted_data
            : currentResult?.expand?.case_id,
    );

    let searchQuery = $state("");
    let filteredResults = $derived(
        results.filter((r) =>
            (r.expand?.case_id?.title || r.snapshotted_data?.title || "Unknown")
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
        ),
    );

    let stats = $derived({
        total: results.length,
        passed: results.filter((r) => r.status === "passed").length,
        failed: results.filter((r) => r.status === "failed").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        untest: results.filter((r) => r.status === "untest").length,
    });

    // Расчет ширин для выравнивания текста под полоской
    let pctPassed = $derived(
        stats.total > 0 ? (stats.passed / stats.total) * 100 : 0,
    );
    let pctFailed = $derived(
        stats.total > 0 ? (stats.failed / stats.total) * 100 : 0,
    );
    let pctSkipped = $derived(
        stats.total > 0 ? (stats.skipped / stats.total) * 100 : 0,
    );

    // --- TIMER LOGIC ---
    let elapsed = $state("00:00:00");
    let timerInterval: any;

    let failedSteps = $state<number[]>([]); // Состояние для упавших шагов

    // --- ФУНКЦИЯ ВСТАВКИ СКРИНШОТА (Clipboard) ---
    function handlePaste(e: ClipboardEvent) {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.indexOf("image") !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    const dt = new DataTransfer();
                    if (files)
                        Array.from(files).forEach((f) => dt.items.add(f));
                    const file = new File([blob], `paste_${Date.now()}.png`, {
                        type: "image/png",
                    });
                    dt.items.add(file);
                    files = dt.files;
                }
            }
        }
    }

    // Клик по номеру шага
    function toggleStepFailure(idx: number) {
        if (failedSteps.includes(idx)) {
            failedSteps = failedSteps.filter((i) => i !== idx);
        } else {
            failedSteps = [...failedSteps, idx];
            const stepNum = idx + 1;
            if (!comment.includes(`[!] Ошибка на шаге ${stepNum}`)) {
                comment +=
                    (comment ? "\n" : "") + `[!] Ошибка на шаге ${stepNum}: `;
            }
        }
    }

    // Сброс при смене кейса
    $effect(() => {
        if (selectedId) failedSteps = [];
    });

    function formatTime(ms: number) {
        if (ms < 0) ms = 0;
        const s = Math.floor((ms / 1000) % 60);
        const m = Math.floor((ms / (1000 * 60)) % 60);
        const h = Math.floor(ms / (1000 * 60 * 60));
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    function formatDurationLabel(minutes: number) {
        if (!minutes) return "0м";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}ч ${m}м` : `${m}м`;
    }

    $effect(() => {
        if (run.status === "active") {
            const startDate = new Date(run.created).getTime();
            timerInterval = setInterval(() => {
                elapsed = formatTime(Date.now() - startDate);
            }, 1000);
            elapsed = formatTime(Date.now() - startDate);
        }
        return () => clearInterval(timerInterval);
    });

    // --- FINISH LOGIC ---
    let isFinishModalOpen = $state(false);
    let finishDuration = $state(0);

    function openFinishModal() {
        // Проверяем время старта
        const startTime = new Date(run.created).getTime();
        const now = Date.now();

        // Считаем минуты (минимум 1, если прошло меньше минуты)
        const diffMinutes = Math.floor((now - startTime) / (1000 * 60));
        finishDuration = diffMinutes > 0 ? diffMinutes : 1;

        isFinishModalOpen = true;
    }

    async function confirmFinishRun() {
        try {
            const val = parseInt(finishDuration.toString());

            // ИСПРАВЛЕНО: имя поля теперь finishDuration (как на скриншоте)
            const updatedRun = await pb.collection("runs").update(run.id, {
                status: "finished",
                finishDuration: val,
            });

            run = updatedRun;
            isFinishModalOpen = false;
            await invalidateAll();
        } catch (e) {
            console.error("Ошибка при сохранении:", e);
        }
    }

    // --- RESULT LOGIC ---
    let comment = $state("");
    let issueUrl = $state("");
    let files = $state<FileList | null>(null);
    let isSaving = $state(false);

    $effect(() => {
        if (currentResult) {
            comment = currentResult.comment || "";
            issueUrl = currentResult.issue_url || "";
            failedSteps = currentResult.failed_steps || [];
            files = null;
        }
    });

    async function saveResult(status: string) {
        if (!currentResult || run.status === "finished") return;
        isSaving = true;

        try {
            const formData = new FormData();
            formData.append("status", status);
            formData.append("comment", comment);
            formData.append("issue_url", issueUrl);
            formData.append("failed_steps", JSON.stringify(failedSteps));

            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    formData.append("attachments", files[i]);
                }
            }

            const updatedRecord = await pb
                .collection("run_results")
                .update(currentResult.id, formData);

            // Обновляем локальный список результатов
            const index = results.findIndex((r) => r.id === currentResult!.id);
            if (index !== -1) {
                results[index] = { ...results[index], ...updatedRecord };
            }

            // Авто-переключение на следующий Untested (твой текущий код)
            const currentIdx = filteredResults.findIndex(
                (r) => r.id === currentResult!.id,
            );
            const nextTest = filteredResults
                .slice(currentIdx + 1)
                .find((r) => r.status === "untest");
            if (nextTest) selectedId = nextTest.id;
        } catch (e) {
            console.error("Ошибка сохранения", e);
            alert("Ошибка сохранения результата");
        } finally {
            isSaving = false;
        }
    }

    function openGiteaIssue() {
        if (!caseData) return;
        if (
            !project?.gitea_url ||
            !project?.gitea_owner ||
            !project?.gitea_repo
        ) {
            alert("Настройте интеграцию с Gitea!");
            return;
        }
        const title = encodeURIComponent(`[Bug] ${caseData.title}`);
        let body = `**Steps:**\n`;
        caseData.steps?.forEach(
            (s: any, i: number) =>
                (body += `${i + 1}. ${s.action} -> ${s.expected}\n`),
        );
        const url = `${project.gitea_url.replace(/\/$/, "")}/${project.gitea_owner}/${project.gitea_repo}/issues/new?title=${title}&body=${encodeURIComponent(body)}`;
        window.open(url, "_blank");
    }

    async function deleteAttachment(fileName: string) {
        if (
            !currentResult ||
            run.status === "finished" ||
            !confirm("Удалить файл?")
        )
            return;
        try {
            await pb
                .collection("run_results")
                .update(currentResult.id, { "attachments-": fileName });
            const index = results.findIndex((r) => r.id === currentResult!.id);
            if (index !== -1)
                results[index].attachments = results[index].attachments.filter(
                    (a: string) => a !== fileName,
                );
        } catch (e) {}
    }
</script>

<div
    class="h-full flex flex-col bg-background overflow-hidden"
    onpaste={handlePaste}
>
    <!-- HEADER -->
    <header
        class="h-16 border-b border-border bg-surface px-4 flex items-center justify-between shrink-0 z-20"
    >
        <!-- LEFT: Title & Timer -->
        <div class="flex items-center gap-4 w-[280px]">
            <a
                href="/project/{run.project_id}/runs"
                class="p-2 hover:bg-panel rounded-full text-muted transition-colors"
            >
                <ChevronLeft class="h-5 w-5" />
            </a>
            <div class="min-w-0">
                <h2 class="font-bold text-sm flex items-center gap-2 truncate">
                    {run.title}
                    <Badge
                        variant={run.status === "active"
                            ? "default"
                            : "secondary"}>{run.status}</Badge
                    >
                </h2>
                {#if run.status === "active"}
                    <div
                        class="flex items-center gap-1.5 text-[10px] text-primary font-mono mt-0.5"
                    >
                        <Clock class="h-3 w-3 animate-pulse" />
                        {elapsed}
                    </div>
                {/if}
            </div>
        </div>

        <!-- CENTER: PROGRESS BAR + STATS ALIGNED -->
        <div class="flex-1 max-w-xl px-4 flex flex-col items-stretch">
            <!-- The Bar -->
            <div
                class="h-2.5 bg-panel rounded-full overflow-hidden flex border border-border/50"
            >
                <div
                    class="bg-success h-full transition-all duration-500"
                    style="width: {pctPassed}%"
                ></div>
                <div
                    class="bg-danger h-full transition-all duration-500"
                    style="width: {pctFailed}%"
                ></div>
                <div
                    class="bg-warning h-full transition-all duration-500"
                    style="width: {pctSkipped}%"
                ></div>
            </div>

            <!-- Labels Aligned and Centered -->
            <div
                class="flex text-[10px] font-bold uppercase tracking-tighter mt-1 min-h-[14px] relative"
            >
                <div
                    class="text-success text-center truncate transition-all duration-500 px-0.5"
                    style="width: {pctPassed}%"
                >
                    {stats.passed > 0 ? `${stats.passed} passed` : ""}
                </div>
                <div
                    class="text-danger text-center truncate transition-all duration-500 px-0.5 border-l border-white/10"
                    style="width: {pctFailed}%"
                >
                    {stats.failed > 0 ? `${stats.failed} failed` : ""}
                </div>
                <div
                    class="text-warning text-center truncate transition-all duration-500 px-0.5 border-l border-white/10"
                    style="width: {pctSkipped}%"
                >
                    {stats.skipped > 0 ? `${stats.skipped} skipped` : ""}
                </div>

                <!-- Скрываем TODO, если 0 -->
                {#if stats.untest > 0}
                    <div class="absolute right-0 text-muted opacity-50">
                        {stats.untest} todo
                    </div>
                {/if}
            </div>
        </div>

        <!-- RIGHT: Action or Duration -->
        <div class="w-[200px] flex justify-end">
            {#if run.status === "active"}
                <Button variant="outline" size="sm" onclick={openFinishModal}
                    >Завершить прогон</Button
                >
            {:else}
                <div
                    class="flex items-center gap-2 text-muted font-bold text-xs bg-panel px-3 py-1.5 rounded border border-border shadow-sm"
                >
                    <Clock class="h-3.5 w-3.5" />
                    <!-- ИСПРАВЛЕНО: run.finishDuration -->
                    Время прогона: {formatDurationLabel(run.finishDuration)}
                </div>
            {/if}
        </div>
    </header>

    <!-- WORKSPACE -->
    <div
        class={cn(
            "flex-1 overflow-hidden grid min-h-0 transition-all duration-300 ease-in-out",
            ui.isSidebarOpen ? "grid-cols-[300px_1fr]" : "grid-cols-[0px_1fr]",
        )}
    >
        <!-- LEFT: LIST -->
        <div
            class="border-r border-border bg-panel flex flex-col h-full min-h-0 overflow-hidden relative"
        >
            <div class="p-2 border-b border-border shrink-0 flex gap-2">
                <div class="relative flex-1">
                    <Search
                        class="absolute left-2 top-2.5 h-4 w-4 text-muted"
                    />
                    <input
                        bind:value={searchQuery}
                        class="w-full bg-surface border border-border rounded pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:border-primary placeholder:text-muted/50"
                        placeholder="Поиск..."
                    />
                </div>
                <button
                    onclick={() => ui.toggleSidebar()}
                    class="h-9 w-9 flex items-center justify-center rounded bg-surface border border-border text-muted hover:text-foreground transition-colors"
                    ><PanelLeftClose class="h-4 w-4" /></button
                >
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {#each filteredResults as res (res.id)}
                    <button
                        onclick={() => (selectedId = res.id)}
                        class={cn(
                            "w-full text-left p-2 rounded-md text-sm border flex items-start gap-2 transition-all",
                            selectedId === res.id
                                ? "bg-surface border-primary ring-1 ring-primary/20 shadow-sm z-10"
                                : "border-transparent hover:bg-black/5 hover:text-foreground text-muted",
                        )}
                    >
                        <div class="mt-0.5 shrink-0">
                            {#if res.status === "passed"}<CheckCircle2
                                    class="h-4 w-4 text-success"
                                />{:else if res.status === "failed"}<XCircle
                                    class="h-4 w-4 text-danger"
                                />{:else if res.status === "skipped"}<AlertCircle
                                    class="h-4 w-4 text-warning"
                                />{:else}<div
                                    class="h-4 w-4 rounded-full border-2 border-muted/50"
                                ></div>{/if}
                        </div>
                        <span class="line-clamp-2 leading-tight font-medium"
                            >{res.expand?.case_id?.title ||
                                res.snapshotted_data?.title ||
                                "No Title"}</span
                        >
                    </button>
                {/each}
            </div>
        </div>

        <!-- RIGHT: RUNNER AREA -->
        <div class="bg-bg-main flex flex-col h-full min-h-0 relative">
            {#if !ui.isSidebarOpen}<button
                    onclick={() => ui.toggleSidebar()}
                    class="absolute left-2 top-2 z-50 p-2 bg-surface border border-border rounded-md shadow-neo text-muted hover:text-primary transition-all"
                    ><PanelLeftOpen class="h-5 w-5" /></button
                >{/if}

            {#if currentResult && caseData}
                <div class="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div class="max-w-4xl mx-auto space-y-6 pb-4">
                        <StatusBadge
                            status={currentResult.status}
                            class="mb-3 w-fit"
                        />
                        <h1
                            class="text-2xl font-bold text-foreground leading-tight"
                        >
                            {caseData.title}
                        </h1>
                        {#if caseData.pre_condition}<div
                                class="bg-surface border border-border rounded-md p-4 shadow-sm"
                            >
                                <h4
                                    class="text-[10px] font-bold text-muted uppercase mb-2 tracking-wider"
                                >
                                    Предусловия
                                </h4>
                                <div class="text-sm whitespace-pre-wrap">
                                    {caseData.pre_condition}
                                </div>
                            </div>{/if}
                        <!-- Steps -->
                        <div class="space-y-4">
                            <h4
                                class="text-[10px] font-bold text-muted uppercase tracking-wider pl-1"
                            >
                                Шаги
                            </h4>
                            <div
                                class="grid border border-border rounded-md divide-y divide-border bg-surface overflow-hidden shadow-sm"
                            >
                                {#each caseData.steps || [] as step, i}
                                    <div
                                        class={cn(
                                            "grid grid-cols-[40px_1fr_1fr] min-h-[50px] group transition-colors",
                                            failedSteps.includes(i)
                                                ? "bg-danger/5"
                                                : "",
                                        )}
                                    >
                                        <button
                                            onclick={() => toggleStepFailure(i)}
                                            class={cn(
                                                "border-r border-border flex items-center justify-center text-xs font-mono transition-colors",
                                                failedSteps.includes(i)
                                                    ? "bg-danger text-white border-danger"
                                                    : "bg-panel/50 text-muted hover:bg-danger/20",
                                            )}
                                            title="Пометить как упавший"
                                        >
                                            {i + 1}
                                        </button>
                                        <div
                                            class="p-3 text-sm border-r border-border leading-relaxed"
                                        >
                                            {step.action}
                                        </div>
                                        <div
                                            class="p-3 text-sm text-muted bg-panel/10 leading-relaxed"
                                        >
                                            {step.expected}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>

                        <!-- Post Conditions (ВОЗВРАЩЕНО) -->
                        {#if caseData.post_condition}
                            <div
                                class="bg-surface border border-border rounded-md p-4 opacity-80 shadow-sm mt-6"
                            >
                                <h4
                                    class="text-[10px] font-bold text-muted uppercase mb-2 tracking-wider"
                                >
                                    Постусловия
                                </h4>
                                <div class="text-sm whitespace-pre-wrap">
                                    {caseData.post_condition}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Bottom Panel -->
                <div
                    class="shrink-0 bg-surface border-t border-border shadow-[0_-4px_30px_rgba(0,0,0,0.03)] flex flex-col"
                >
                    <div class="p-4 flex gap-6">
                        <div class="flex-1 space-y-2">
                            <label
                                class="text-[10px] font-bold text-muted uppercase tracking-wider"
                                >Комментарий</label
                            >
                            <textarea
                                bind:value={comment}
                                class="w-full h-20 rounded-md border border-input bg-input p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                placeholder="Результат..."
                            ></textarea>
                        </div>
                        <div class="w-[320px] space-y-3">
                            <div>
                                <label
                                    class="text-[10px] font-bold text-muted uppercase tracking-wider flex justify-between mb-1"
                                    >Вложения <span
                                        class="font-normal opacity-50"
                                        >Max 5MB</span
                                    ></label
                                >
                                <input
                                    bind:files
                                    type="file"
                                    multiple
                                    class="block w-full text-xs text-muted file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                />
                                {#if currentResult.attachments?.length > 0}
                                    <div class="flex flex-wrap gap-2 mt-2">
                                        {#each currentResult.attachments as file}
                                            <div
                                                class="flex items-center gap-1 text-[10px] bg-panel px-2 py-1 rounded border border-border"
                                            >
                                                <Paperclip
                                                    class="h-3 w-3 opacity-50"
                                                />
                                                <span
                                                    class="max-w-[120px] truncate"
                                                    >{file}</span
                                                >
                                                <button
                                                    onclick={() =>
                                                        deleteAttachment(file)}
                                                    class="text-muted hover:text-danger ml-1"
                                                    ><Trash2
                                                        class="h-3 w-3"
                                                    /></button
                                                >
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                            <div class="space-y-2">
                                <label
                                    class="text-[10px] font-bold text-muted uppercase tracking-wider"
                                >
                                    Дефекты (URL через пробел)
                                </label>
                                <div class="flex gap-2">
                                    <!-- Поле ввода для одной или нескольких ссылок -->
                                    <textarea
                                        bind:value={issueUrl}
                                        placeholder="Вставьте ссылки на баги из Gitea..."
                                        class="flex-1 min-h-[38px] max-h-[80px] rounded-md border border-input bg-input p-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary resize-none transition-shadow"
                                    ></textarea>

                                    <!-- Кнопка создания НОВОГО бага (твоя логика openGiteaIssue) -->
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        class="h-[38px] w-[38px] p-0 shrink-0 border-dashed hover:border-danger hover:text-danger transition-colors"
                                        onclick={openGiteaIssue}
                                        title="Сгенерировать баг-репорт в Gitea"
                                    >
                                        <Bug class="h-4 w-4" />
                                    </Button>
                                </div>

                                <!-- Визуализация ссылок в виде красивых тегов -->
                                <div class="flex flex-wrap gap-2">
                                    {#each issueUrl
                                        .split(/[\s,]+/)
                                        .filter((link) => link
                                                .trim()
                                                .startsWith("http")) as link}
                                        <a
                                            href={link}
                                            target="_blank"
                                            class="flex items-center gap-1.5 px-2 py-1 bg-danger/10 text-danger border border-danger/20 rounded text-[10px] font-bold hover:bg-danger/20 transition-all hover:scale-105"
                                        >
                                            <Bug class="h-3 w-3 shrink-0" />
                                            <span
                                                class="max-w-[150px] truncate"
                                            >
                                                {link.split("/").pop() ||
                                                    "Issue"}
                                            </span>
                                            <ExternalLink
                                                class="h-2.5 w-2.5 opacity-50 shrink-0"
                                            />
                                        </a>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        class="h-14 px-6 flex items-center justify-between bg-panel/40 border-t border-border"
                    >
                        <Button
                            variant="outline"
                            onclick={() => saveResult("skipped")}
                            disabled={isSaving}>Skip</Button
                        >
                        <div class="flex items-center gap-3">
                            <Button
                                onclick={() => saveResult("failed")}
                                disabled={isSaving}
                                class="bg-danger text-white min-w-[120px] shadow-sm border-transparent"
                                ><XCircle class="mr-2 h-4 w-4" /> Failed</Button
                            >
                            <Button
                                onclick={() => saveResult("passed")}
                                disabled={isSaving}
                                class="bg-success text-white min-w-[120px] shadow-sm border-transparent"
                                ><CheckCircle2 class="mr-2 h-4 w-4" /> Passed</Button
                            >
                        </div>
                    </div>
                </div>
            {:else}
                <div
                    class="flex-1 flex items-center justify-center text-muted flex-col gap-2"
                >
                    <div class="p-4 bg-panel rounded-full border border-border">
                        <Search class="h-6 w-6 opacity-30" />
                    </div>
                    <span class="text-sm">Выберите тест слева для начала</span>
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- FINISH MODAL -->
<Dialog bind:open={isFinishModalOpen} title="Завершение тестирования">
    <div class="space-y-4">
        <div
            class="p-3 bg-panel border border-border rounded text-sm text-muted"
        >
            После завершения изменение статусов будет невозможно.
        </div>
        <div class="space-y-1.5">
            <label
                class="text-[10px] font-bold uppercase text-muted tracking-widest"
                >Затраченное время (минуты)</label
            >
            <Input type="number" bind:value={finishDuration} min="0" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onclick={() => (isFinishModalOpen = false)}
                >Отмена</Button
            >
            <Button variant="default" onclick={confirmFinishRun}
                >Подтвердить</Button
            >
        </div>
    </div>
</Dialog>
