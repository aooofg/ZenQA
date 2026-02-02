<script lang="ts">
    import { page } from "$app/stores";
    import { invalidateAll } from "$app/navigation"; // Для обновления данных
    import {
        Settings as SettingsIcon,
        LogOut,
        LayoutGrid,
        Plus,
    } from "lucide-svelte";
    import { cn, getInitials } from "$lib/utils";
    import { pb } from "$lib/pb";

    // Компоненты
    import Dialog from "$lib/components/ui/Dialog.svelte";
    import Input from "$lib/components/ui/Input.svelte";
    import Button from "$lib/components/ui/Button.svelte";

    // Данные
    let projects = $derived($page.data?.projects || []);
    let currentPath = $derived($page.url.pathname);
    let currentUser = pb.authStore.model;

    // --- ЛОГИКА СОЗДАНИЯ ПРОЕКТА ---
    let isCreateOpen = $state(false);
    let isCreating = $state(false);

    let newProject = $state({
        name: "",
        key: "",
        description: "",
    });

    // Авто-генерация ключа (Key) при вводе имени
    function handleNameInput(e: Event) {
        const val = (e.target as HTMLInputElement).value;
        if (!newProject.key) {
            // Берем первые буквы слов, делаем UpperCase, максимум 10 символов
            const generated = val
                .split(" ")
                .map((word) => word[0])
                .join("")
                .toUpperCase()
                .substring(0, 10);
            newProject.key = generated;
        }
    }
    function logout() {
        pb.authStore.clear(); // Очищает токен в localStorage
        // Редирект произойдет автоматически благодаря onChange в +layout.svelte
    }
    async function createProject() {
        if (!newProject.name || !newProject.key) return;

        isCreating = true;
        try {
            await pb.collection("projects").create(newProject);

            // Сброс формы
            newProject = { name: "", key: "", description: "" };
            isCreateOpen = false;

            // Обновляем список проектов (перезапускаем load функцию layout-а)
            await invalidateAll();
        } catch (err) {
            console.error("Error creating project:", err);
            alert("Ошибка при создании проекта (возможно такой Key уже есть)");
        } finally {
            isCreating = false;
        }
    }
</script>

<aside
    class="flex h-full w-[240px] flex-col border-r border-border bg-panel text-foreground"
>
    <!-- Header -->
    <div class="flex h-12 items-center px-4 border-b border-border shrink-0">
        <div class="flex items-center gap-2 font-bold text-lg text-primary">
            <LayoutGrid class="h-6 w-6" />
            <span>TMS</span>
        </div>
    </div>

    <!-- Projects List -->
    <div class="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <div class="px-3 mb-2">
            <h3
                class="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-2"
            >
                Проекты
            </h3>

            {#each projects as project (project.id)}
                <a
                    href="/project/{project.id}"
                    class={cn(
                        "flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors mb-0.5",
                        currentPath.includes(project.id)
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted hover:bg-black/5 hover:text-foreground",
                    )}
                >
                    <span
                        class={cn(
                            "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border",
                            currentPath.includes(project.id)
                                ? "bg-primary border-primary text-white"
                                : "bg-surface border-border text-muted",
                        )}
                    >
                        {project.key ? project.key.substring(0, 2) : "??"}
                    </span>
                    <span class="truncate">{project.name}</span>
                </a>
            {/each}

            <!-- Кнопка открытия модалки -->
            <button
                onclick={() => (isCreateOpen = true)}
                class="mt-3 w-full flex items-center gap-2 px-2 py-2 text-sm text-muted hover:text-primary transition-colors border border-dashed border-border rounded-md hover:border-primary hover:bg-surface"
            >
                <Plus class="h-4 w-4" />
                <span>Создать проект</span>
            </button>
        </div>
    </div>

    <!-- User Footer -->
    <div class="p-3 border-t border-border bg-panel shrink-0">
        <div class="flex items-center justify-between">
            <a
                href="/settings/profile"
                class="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-black/5 transition-colors group flex-1 min-w-0"
            >
                <div
                    class="h-8 w-8 rounded bg-primary text-white flex items-center justify-center font-bold text-xs shadow-neo border border-white shrink-0"
                >
                    {getInitials(currentUser?.email || "??")}
                </div>
                <div class="flex flex-col overflow-hidden">
                    <span class="text-sm font-medium leading-none truncate"
                        >{currentUser?.email || "Guest"}</span
                    >
                    <span
                        class="text-[10px] text-success font-bold uppercase mt-1"
                        >Online</span
                    >
                </div>
            </a>

            <div class="flex gap-1">
                <!-- Ссылка на настройки -->
                <a
                    href="/settings/profile"
                    class="p-2 text-muted hover:text-primary transition-colors"
                    title="Настройки профиля"
                >
                    <SettingsIcon class="h-4 w-4" />
                </a>
                <button
                    onclick={logout}
                    class="p-2 text-muted hover:text-danger transition-colors"
                    title="Выйти"
                >
                    <LogOut class="h-4 w-4" />
                </button>
            </div>
        </div>
    </div>
</aside>

<!-- МОДАЛКА СОЗДАНИЯ ПРОЕКТА -->
<Dialog bind:open={isCreateOpen} title="Новый проект">
    <div class="space-y-4">
        <div class="space-y-1">
            <label class="text-xs font-semibold text-muted uppercase"
                >Название</label
            >
            <Input
                bind:value={newProject.name}
                oninput={handleNameInput}
                placeholder="Например: iOS App"
                autofocus
            />
        </div>

        <div class="space-y-1">
            <label class="text-xs font-semibold text-muted uppercase"
                >Ключ (Key)</label
            >
            <Input
                bind:value={newProject.key}
                placeholder="IOS"
                maxlength={10}
            />
            <p class="text-[10px] text-muted">
                Используется как префикс для тест-кейсов (напр. IOS-12)
            </p>
        </div>

        <div class="space-y-1">
            <label class="text-xs font-semibold text-muted uppercase"
                >Описание</label
            >
            <Input
                bind:value={newProject.description}
                placeholder="Краткое описание проекта"
            />
        </div>

        <div class="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onclick={() => (isCreateOpen = false)}
                >Отмена</Button
            >
            <Button
                onclick={createProject}
                disabled={isCreating || !newProject.name || !newProject.key}
            >
                {#if isCreating}
                    <Loader2 class="h-4 w-4 animate-spin mr-2" />
                {/if}
                Создать
            </Button>
        </div>
    </div>
</Dialog>
