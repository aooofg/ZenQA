<script lang="ts">
    import { pb } from '$lib/pb';
    import { invalidateAll } from '$app/navigation';
    import Input from '$lib/components/ui/Input.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import { Save, Settings, GitMerge, Loader2, Trash2, AlertTriangle } from 'lucide-svelte';

    let { data } = $props();
    let project = $state({ ...data.project }); // Копия для редактирования
    let isSaving = $state(false);
    let isDeleting = $state(false);

    async function save() {
        isSaving = true;
        try {
            await pb.collection('projects').update(project.id, project);
            await invalidateAll(); // Обновит данные в сайдбаре
            alert("Настройки сохранены");
        } catch (e) {
            console.error(e);
            alert("Ошибка сохранения");
        } finally {
            isSaving = false;
        }
    }

    async function deleteProject() {
        const confirmName = prompt(`ВНИМАНИЕ: Это действие удалит проект "${project.name}", все его тест-кейсы, планы и результаты прогонов навсегда.\n\nДля подтверждения введите название проекта ниже:`);
        
        if (confirmName !== project.name) {
            if (confirmName !== null) alert("Название введено неверно. Удаление отменено.");
            return;
        }

        isDeleting = true;
        try {
            await pb.collection('projects').delete(project.id);
            // После удаления проекта уходим на главную
            window.location.href = '/'; 
        } catch (e) {
            console.error(e);
            alert("Ошибка при удалении проекта");
            isDeleting = false;
        }
    }
</script>

<!-- Главный контейнер с прокруткой -->
<div class="h-full w-full overflow-y-auto custom-scrollbar bg-bg-main">
    <div class="p-6 max-w-2xl mx-auto pb-32">
        
        <!-- Header -->
        <div class="mb-8 border-b border-border pb-4">
            <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                <Settings class="h-6 w-6 text-muted" />
                Настройки проекта
            </h1>
            <p class="text-muted mt-1 text-sm font-medium">Управление конфигурацией и внешними связями</p>
        </div>

        <div class="space-y-12">
            
            <!-- General Section -->
            <section class="space-y-4">
                <h3 class="text-lg font-semibold px-1 text-foreground">Общее</h3>
                <div class="bg-surface border border-border rounded-xl p-6 space-y-5 shadow-sm">
                    <div class="space-y-1.5">
                        <label class="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Название проекта</label>
                        <Input bind:value={project.name} />
                    </div>
                    
                    <div class="space-y-1.5">
                        <label class="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Ключ (Префикс)</label>
                        <div class="relative">
                            <Input bind:value={project.key} class="pl-16 font-mono" maxlength={10} />
                            <div class="absolute left-3 top-1.5 text-[10px] font-bold text-muted bg-panel px-1.5 py-0.5 rounded border border-border">
                                KEY
                            </div>
                        </div>
                        <p class="text-[10px] text-muted-foreground/60 px-1 italic">Используется для ID кейсов (напр. {project.key || 'ABC'}-101)</p>
                    </div>

                    <div class="space-y-1.5">
                        <label class="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Описание</label>
                        <textarea 
                            bind:value={project.description}
                            placeholder="О чем этот проект..."
                            class="w-full min-h-[100px] rounded-md border border-input bg-input p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y transition-shadow"
                        ></textarea>
                    </div>
                </div>
            </section>

            <!-- Integration Section -->
            <section class="space-y-4">
                <h3 class="text-lg font-semibold flex items-center gap-2 px-1 text-foreground">
                    <GitMerge class="h-5 w-5 text-primary" />
                    Интеграция с Gitea
                </h3>
                <div class="bg-surface border border-border rounded-xl p-6 space-y-5 shadow-sm">
                    <div class="space-y-1.5">
                        <label class="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Gitea URL</label>
                        <Input bind:value={project.gitea_url} placeholder="https://git.your-company.com" />
                        <p class="text-[10px] text-muted-foreground/60 px-1">Базовый URL вашего сервера Gitea</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Владелец (Owner)</label>
                            <Input bind:value={project.gitea_owner} placeholder="Organization or Username" />
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Репозиторий</label>
                            <Input bind:value={project.gitea_repo} placeholder="project-name" />
                        </div>
                    </div>
                </div>
            </section>

            <!-- Save Action -->
            <div class="flex justify-end border-t border-border pt-6">
                <Button size="lg" onclick={save} disabled={isSaving || isDeleting} class="min-w-[180px] h-11 shadow-sm">
                    {#if isSaving}
                        <Loader2 class="h-4 w-4 mr-2 animate-spin" />
                    {:else}
                        <Save class="h-4 w-4 mr-2" />
                    {/if}
                    Сохранить настройки
                </Button>
            </div>

            <!-- Danger Zone Section -->
            <section class="pt-12 border-t border-danger/20">
                <div class="flex items-center gap-2 mb-4 text-danger px-1">
                    <AlertTriangle class="h-5 w-5" />
                    <h3 class="text-lg font-bold uppercase tracking-tight">Опасная зона</h3>
                </div>
                
                <div class="bg-danger/5 border border-danger/20 rounded-xl p-6 flex items-center justify-between shadow-sm">
                    <div class="space-y-1">
                        <div class="font-bold text-foreground">Удалить проект</div>
                        <p class="text-xs text-muted max-w-[380px] leading-relaxed">
                            Это действие нельзя отменить. Все данные проекта, включая вложения, будут стерты навсегда.
                        </p>
                    </div>
                    
                    <Button 
                        variant="danger" 
                        onclick={deleteProject} 
                        disabled={isSaving || isDeleting}
                        class="shadow-lg shadow-danger/10 h-10"
                    >
                        {#if isDeleting}
                            <Loader2 class="h-4 w-4 animate-spin mr-2" />
                        {:else}
                            <Trash2 class="h-4 w-4 mr-2" />
                        {/if}
                        Удалить
                    </Button>
                </div>
            </section>

        </div>
    </div>
</div>