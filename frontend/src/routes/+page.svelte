<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { LayoutGrid, Plus, Search, Folder, ArrowRight, Loader2 } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import { pb } from '$lib/pb';

  let { data } = $props();
  let projects = $derived(data.projects || []);
  
  let searchQuery = $state('');
  let filteredProjects = $derived(
    projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.key.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Логика создания
  let isCreateOpen = $state(false);
  let isCreating = $state(false);
  let newProject = $state({ name: '', key: '', description: '' });

  function handleNameInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    if (!newProject.key) {
        newProject.key = val.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 10);
    }
  }

  async function createProject() {
    if (!newProject.name || !newProject.key) return;
    isCreating = true;
    try {
        await pb.collection('projects').create(newProject);
        newProject = { name: '', key: '', description: '' };
        isCreateOpen = false;
        await invalidateAll();
    } catch (err) {
        alert("Ошибка при создании");
    } finally {
        isCreating = false;
    }
  }
</script>

<div class="h-full w-full overflow-y-auto custom-scrollbar bg-bg-main p-8 md:p-12">
  <div class="max-w-6xl mx-auto space-y-10">
    
    <!-- Header Hub -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
            <h1 class="text-4xl font-black tracking-tight flex items-center gap-3">
                <div class="h-10 w-10 bg-primary text-white rounded-lg flex items-center justify-center shadow-neo border border-white/20">
                    <LayoutGrid class="h-6 w-6" />
                </div>
                TMS PROJECTS
            </h1>
            <p class="text-muted font-medium">Выберите рабочее пространство для начала тестирования</p>
        </div>

        <div class="flex items-center gap-3">
            <div class="relative w-64">
                <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <Input bind:value={searchQuery} placeholder="Поиск проектов..." class="pl-10 h-10 shadow-sm" />
            </div>
            <Button onclick={() => isCreateOpen = true} class="h-10 shadow-neo">
                <Plus class="h-4 w-4 mr-2" /> Создать проект
            </Button>
        </div>
    </div>

    <!-- Project Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredProjects as project (project.id)}
            <a href="/project/{project.id}" class="group bg-surface border border-border p-6 rounded-xl shadow-sm hover:shadow-neo hover:border-primary transition-all flex flex-col justify-between min-h-[180px]">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <div class="h-12 w-12 rounded-lg bg-panel flex items-center justify-center font-black text-primary border border-border group-hover:bg-primary group-hover:text-white transition-colors shadow-inset">
                            {project.key}
                        </div>
                        <div class="text-[10px] font-bold text-muted uppercase tracking-widest bg-panel px-2 py-1 rounded border border-border">
                            ID: {project.id.slice(-4)}
                        </div>
                    </div>
                    <h3 class="text-xl font-bold group-hover:text-primary transition-colors">{project.name}</h3>
                    <p class="text-sm text-muted line-clamp-2 mt-2">{project.description || 'Нет описания'}</p>
                </div>
                <div class="flex items-center justify-end mt-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                    <span class="text-xs font-bold uppercase tracking-wider mr-2">Открыть</span>
                    <ArrowRight class="h-4 w-4" />
                </div>
            </a>
        {/each}

        {#if filteredProjects.length === 0}
            <div class="col-span-full py-20 text-center bg-panel/30 border border-dashed border-border rounded-xl">
                <Folder class="h-10 w-10 text-muted mx-auto mb-4 opacity-20" />
                <p class="text-muted italic">Проекты не найдены</p>
            </div>
        {/if}
    </div>
  </div>
</div>

<Dialog bind:open={isCreateOpen} title="Новый проект">
    <div class="space-y-4">
        <div class="space-y-1">
            <label class="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Название</label>
            <Input bind:value={newProject.name} oninput={handleNameInput} placeholder="Например: Mobile App" autofocus />
        </div>
        <div class="space-y-1">
            <label class="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Ключ</label>
            <Input bind:value={newProject.key} placeholder="APP" maxlength={10} />
        </div>
        <div class="space-y-1">
            <label class="text-[10px] font-bold text-muted uppercase tracking-wider pl-1">Описание</label>
            <Input bind:value={newProject.description} placeholder="..." />
        </div>
        <div class="pt-4 flex justify-end gap-2">
            <Button variant="ghost" onclick={() => isCreateOpen = false}>Отмена</Button>
            <Button onclick={createProject} disabled={isCreating || !newProject.name || !newProject.key}>
                {#if isCreating} <Loader2 class="h-4 w-4 animate-spin mr-2" /> {/if}
                Создать проект
            </Button>
        </div>
    </div>
</Dialog>