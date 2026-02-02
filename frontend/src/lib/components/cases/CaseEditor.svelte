<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import Input from "$lib/components/ui/Input.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import StepsEditor from "./StepsEditor.svelte";
  import CaseHistoryModal from "./CaseHistoryModal.svelte";
  import {
    ChevronRight,
    Save,
    Clock,
    Tag,
    Loader2,
    Trash2,
    FolderTree,
    Zap,
    Copy,
  } from "lucide-svelte";
  import { pb } from "$lib/pb";
  import { onMount } from "svelte";

  let { caseId } = $props<{ caseId: string }>();

  let isLoading = $state(true);
  let isSaving = $state(false);
  let isHistoryOpen = $state(false);
  let isDuplicating = $state(false); // Для индикации копирования

  let caseData = $state<any>({
    title: "",
    priority: "medium",
    status: "draft",
    steps: [],
    pre_condition: "",
    post_condition: "",
    suite_id: "",
    automation_status: "manual",
  });

  let originalSnapshot = $state(""); // Эталон для Dirty Check
  let suites = $state<any[]>([]);

  // ВАЖНО: Функция создает "чистый" слепок только тех полей, которые мы редактируем
  function getSnapshot(data: any) {
    return JSON.stringify({
      title: data.title,
      priority: data.priority,
      automation_status: data.automation_status,
      pre_condition: data.pre_condition,
      post_condition: data.post_condition,
      steps: data.steps,
      suite_id: data.suite_id || "",
    });
  }
  function toggleSection(e: Event) {
    const btn = e.currentTarget as HTMLElement;
    const content = btn.nextElementSibling as HTMLElement;
    const icon = btn.querySelector(".chevron") as HTMLElement;
    if (!content || !icon) return;
    
    const isHidden = content.hasAttribute('hidden');
    if (isHidden) {
      content.removeAttribute('hidden');
      icon.style.transform = 'rotate(90deg)';
    } else {
      content.setAttribute('hidden', '');
      icon.style.transform = 'rotate(0deg)';
    }
  }
  onMount(async () => {
    try {
      isLoading = true;
      const record = await pb.collection("cases").getOne(caseId);
      const suitesList = await pb.collection("suites").getFullList({
        filter: `project_id="${record.project_id}"`,
        sort: "name",
      });
      suites = suitesList;

      caseData = { ...record, suite_id: record.suite_id || "" };

      if (!caseData.steps || caseData.steps.length === 0) {
        caseData.steps = [{ action: "", expected: "" }];
      }

      originalSnapshot = getSnapshot(caseData);
    } catch (e) {
      console.error("Ошибка загрузки:", e);
    } finally {
      isLoading = false;
    }
  });

  // Теперь Dirty Check работает только по важным полям
  let isDirty = $derived(originalSnapshot !== getSnapshot(caseData));

  async function logHistory(type: "updated" | "restored" | "created") {
    try {
      await pb.collection("case_history").create({
        case_id: caseId,
        user_id: pb.authStore.model?.id,
        type: type,
        data: JSON.parse(getSnapshot(caseData)), // Пишем в историю чистые данные
      });
    } catch (e) {}
  }

  async function save() {
    if (!isDirty) return;
    try {
      isSaving = true;
      await logHistory("updated");

      const dataToSave = {
        ...caseData,
        suite_id: caseData.suite_id === "" ? null : caseData.suite_id,
      };

      const updated = await pb.collection("cases").update(caseId, dataToSave);
      await invalidateAll();

      if (JSON.parse(originalSnapshot).suite_id !== (updated.suite_id || "")) {
        await invalidateAll();
      }

      // ОБНОВЛЯЕМ ЭТАЛОН: Надпись "Не сохранено" исчезнет здесь
      caseData = { ...updated, suite_id: updated.suite_id || "" };
      originalSnapshot = getSnapshot(caseData);
    } catch (e) {
      alert("Ошибка сохранения");
    } finally {
      isSaving = false;
    }
  }

  async function duplicateCase() {
    if (!confirm("Создать копию этого кейса?")) return;
    try {
      isDuplicating = true;
      const newCase = {
        ...caseData,
        id: undefined,
        created: undefined,
        updated: undefined,
        title: caseData.title + " (Copy)",
        suite_id: caseData.suite_id === "" ? null : caseData.suite_id,
      };
      await pb.collection("cases").create(newCase);
      await invalidateAll();
      alert("Кейс скопирован");
    } catch (e) {
      alert("Ошибка копирования");
    } finally {
      isDuplicating = false;
    }
  }

  async function deleteCase() {
    if (!confirm(`Удалить тест-кейс "${caseData.title}"?`)) return;
    try {
      await pb.collection("cases").delete(caseId);
      await invalidateAll();
      window.location.reload();
    } catch (e) {
      alert("Ошибка при удалении");
    }
  }

  function handleRestore(oldData: any) {
    caseData = { ...caseData, ...oldData, suite_id: oldData.suite_id || "" };
    save();
  }
</script>

<div class="h-full flex flex-col bg-bg-main overflow-hidden">
  {#if isLoading}
    <div class="h-full flex items-center justify-center text-muted">
      <Loader2 class="h-6 w-6 animate-spin mr-2" /> Загрузка...
    </div>
  {:else}
    <!-- Toolbar (Все кнопки на месте) -->
    <div
      class="h-14 border-b border-border bg-surface px-6 flex items-center justify-between shrink-0 z-10 shadow-sm"
    >
      <div class="flex items-center gap-2 text-sm text-muted">
        <span
          class="font-mono text-[10px] opacity-50 bg-panel px-1.5 py-0.5 rounded border border-border"
          >{caseId}</span
        >
        <span class="h-4 w-px bg-border mx-1"></span>
        <Badge
          variant={caseData.priority === "high" ||
          caseData.priority === "critical"
            ? "danger"
            : "secondary"}
        >
          {caseData.priority}
        </Badge>
        {#if isDirty}
          <span
            class="flex items-center gap-1.5 text-[10px] text-warning font-bold uppercase ml-2 animate-pulse"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-current"></span> Не сохранено
          </span>
        {/if}
      </div>

      <div class="flex items-center gap-2">
          <!-- Кнопка дублирования (Copy) теперь рабочая -->
          <Button variant="ghost" size="sm" onclick={duplicateCase} disabled={isDuplicating} class="text-muted hover:text-primary" title="Дублировать кейс">
            {#if isDuplicating}
                <Loader2 class="h-4 w-4 animate-spin" />
            {:else}
                <Copy class="h-4 w-4" />
            {/if}
          </Button>

          <Button variant="ghost" size="sm" onclick={deleteCase} class="text-muted hover:text-danger" title="Удалить">
            <Trash2 class="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" onclick={() => isHistoryOpen = true} title="История изменений">
            <Clock class="h-4 w-4 mr-2" />
            История
          </Button>

          <Button 
            variant="default" 
            size="sm" 
            onclick={save} 
            disabled={isSaving || !isDirty} 
            class="min-w-[120px] shadow-lg shadow-primary/10 disabled:opacity-30"
          >
            {#if isSaving}
                <Loader2 class="h-4 w-4 mr-2 animate-spin" />
            {:else}
                <Save class="h-4 w-4 mr-2" />
            {/if}
            Сохранить
          </Button>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div class="max-w-4xl mx-auto py-10 px-8 space-y-10">
        <div class="space-y-6">
          <!-- Заголовок -->
          <input
            bind:value={caseData.title}
            placeholder="Название тест-кейса..."
            class="w-full bg-transparent text-3xl font-bold placeholder:text-muted/30 focus:outline-none"
          />

          <!-- Ряд селекторов (Все три на одной линии) -->
          <div class="flex items-end gap-6">
            <!-- Приоритет -->
            <div class="w-1/4 space-y-1.5">
              <label
                class="text-[10px] font-bold text-muted uppercase tracking-widest pl-1"
                >Приоритет</label
              >
              <select
                bind:value={caseData.priority}
                class="w-full bg-surface border border-input rounded-md px-3 py-2 text-sm focus:ring-1 ring-primary outline-none shadow-sm cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <!-- Тип теста (Новое) -->
            <div class="w-1/4 space-y-1.5">
              <label
                class="text-[10px] font-bold text-muted uppercase tracking-widest pl-1 flex items-center gap-1"
              >
                <Zap class="h-3 w-3" /> Тип теста
              </label>
              <select
                bind:value={caseData.automation_status}
                class="w-full bg-surface border border-input rounded-md px-3 py-2 text-sm focus:ring-1 ring-primary outline-none shadow-sm cursor-pointer"
              >
                <option value="manual">Manual</option>
                <option value="automated">Automated</option>
                <option value="to_automate">To Automate</option>
              </select>
            </div>

            <!-- Папка (С фиксом Корневой папки) -->
            <div class="flex-1 space-y-1.5">
              <label
                class="text-[10px] font-bold text-muted uppercase tracking-widest pl-1 flex items-center gap-1"
              >
                <FolderTree class="h-3 w-3" /> Папка
              </label>
              <select
                bind:value={caseData.suite_id}
                class="w-full bg-surface border border-input rounded-md px-3 py-2 text-sm focus:ring-1 ring-primary outline-none shadow-sm cursor-pointer"
              >
                <option value="">Корневая папка</option>
                {#each suites as suite}
                  <option value={suite.id}>{suite.name}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>

        <hr class="border-border" />

        <!-- Секции (Предусловия, Шаги, Постусловия - всё на месте) -->
        <div class="space-y-3">
          <button
            onclick={toggleSection}
            class="flex items-center gap-2 w-full text-left font-bold text-[11px] text-muted uppercase tracking-widest hover:text-primary transition-colors group"
          >
            <ChevronRight
              class="chevron h-4 w-4 transition-transform duration-200"
            />
            Предусловия
            <span class="h-px flex-1 bg-border/50 ml-2"></span>
          </button>
          <div hidden class="pl-6">
            <textarea
              bind:value={caseData.pre_condition}
              class="w-full min-h-[100px] rounded-lg border border-input bg-surface p-4 text-sm focus:ring-1 focus:ring-primary outline-none resize-y shadow-sm"
              placeholder="Что должно быть готово?"
            ></textarea>
          </div>
        </div>

        <div class="space-y-4">
          <button
            onclick={toggleSection}
            class="flex items-center gap-2 w-full text-left font-bold text-[11px] text-muted uppercase tracking-widest hover:text-primary transition-colors group"
          >
            <ChevronRight
              class="chevron h-4 w-4 transition-transform duration-200 rotate-90"
            />
            Шаги тестирования
            <span class="h-px flex-1 bg-border/50 ml-2"></span>
          </button>
          <div class="pl-6">
            <StepsEditor bind:steps={caseData.steps} />
          </div>
        </div>

        <div class="space-y-3">
          <button
            onclick={toggleSection}
            class="flex items-center gap-2 w-full text-left font-bold text-[11px] text-muted uppercase tracking-widest hover:text-primary transition-colors group"
          >
            <ChevronRight
              class="chevron h-4 w-4 transition-transform duration-200"
            />
            Постусловия
            <span class="h-px flex-1 bg-border/50 ml-2"></span>
          </button>
          <div hidden class="pl-6">
            <textarea
              bind:value={caseData.post_condition}
              class="w-full min-h-[80px] rounded-lg border border-input bg-surface p-4 text-sm focus:ring-1 focus:ring-primary outline-none resize-y shadow-sm"
              placeholder="Очистка данных..."
            ></textarea>
          </div>
        </div>

        <div class="h-20"></div>
      </div>
    </div>
  {/if}
</div>

<!-- Модалка истории (Связана через onRestore) -->
<CaseHistoryModal
  bind:open={isHistoryOpen}
  {caseId}
  onRestore={handleRestore}
/>
