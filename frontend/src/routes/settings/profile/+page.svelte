<script lang="ts">
  import { pb } from '$lib/pb';
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { User, Key, ShieldCheck, Loader2, Save, Palette } from 'lucide-svelte';

  // Инициализируем данные из текущей сессии
  let user = $state({ ...pb.authStore.model });
  let giteaToken = $state('');
  let currentTheme = $state('modern');
  
  let isSaving = $state(false);
  let message = $state('');

  onMount(async () => {
    // Подгружаем актуальные данные пользователя из БД (токен и тему)
    try {
      const record = await pb.collection('users').getOne(user.id);
      giteaToken = record.gitea_token || '';
      currentTheme = record.theme || 'modern';
      // Синхронизируем локальный объект пользователя
      user.name = record.name;
    } catch (e) {
      console.error("Ошибка загрузки данных профиля:", e);
    }
  });

  async function handleSave() {
    isSaving = true;
    message = '';
    try {
      // 1. Сохраняем в базу данных
      await pb.collection('users').update(user.id, {
        name: user.name,
        gitea_token: giteaToken,
        theme: currentTheme
      });

      // 2. Обновляем локальную сессию, чтобы тема сменилась мгновенно везде
      await pb.collection('users').authRefresh();
      
      message = 'Настройки профиля успешно обновлены!';
    } catch (e) {
      console.error(e);
      message = 'Ошибка при сохранении настроек';
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="h-full w-full overflow-y-auto custom-scrollbar bg-bg-main p-8">
  <div class="max-w-xl mx-auto space-y-6 pb-20">
    
    <!-- Header -->
    <div class="flex items-center gap-3 mb-8 border-b border-border pb-4">
      <div class="h-12 w-12 bg-panel shadow-neo flex items-center justify-center border border-white shrink-0">
          <User class="h-8 w-8 text-muted" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-foreground">Профиль пользователя</h1>
        <p class="text-xs text-muted font-medium">Персональные настройки и ключи доступа</p>
      </div>
    </div>

    <!-- Main Settings Form -->
    <div class="bg-panel p-6 shadow-neo border border-white space-y-8">
      
      <!-- Section: General -->
      <section class="space-y-4">
        <h3 class="text-sm font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck class="h-4 w-4 text-primary" /> Основные данные
        </h3>
        <div class="space-y-4 pl-6">
            <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-muted uppercase tracking-widest pl-1">Email (Логин)</label>
                <Input value={user.email} disabled class="opacity-60 cursor-not-allowed bg-panel/50" />
            </div>
            <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-muted uppercase tracking-widest pl-1">Имя пользователя</label>
                <Input bind:value={user.name} placeholder="Ваше имя" />
            </div>
        </div>
      </section>

      <hr class="border-border opacity-50" />

      <!-- Section: Interface/Theming -->
      <section class="space-y-4">
        <h3 class="text-sm font-bold flex items-center gap-2 text-foreground">
            <Palette class="h-4 w-4 text-primary" /> Интерфейс
        </h3>
        <div class="space-y-4 pl-6">
            <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-muted uppercase tracking-widest pl-1">Тема оформления</label>
                <select 
                    bind:value={currentTheme} 
                    class="w-full bg-surface border border-input rounded-md px-3 py-2 text-sm focus:ring-1 ring-primary outline-none shadow-inset"
                >
                    <option value="modern">Modern Clean (Default)</option>
                    <option value="dark">Deep Dark Mode</option>
                    <option value="win95">Windows 95 Retro</option>
                </select>
                <p class="text-[9px] text-muted-foreground/60 px-1 italic">Выберите визуальный стиль системы</p>
            </div>
        </div>
      </section>

      <hr class="border-border opacity-50" />

      <!-- Section: Integration -->
      <section class="space-y-4">
        <h3 class="text-sm font-bold flex items-center gap-2 text-foreground">
            <Key class="h-4 w-4 text-primary" /> Интеграция с Gitea
        </h3>
        <div class="space-y-4 pl-6">
            <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-muted uppercase tracking-widest pl-1 text-foreground">Персональный токен доступа (PAT)</label>
                <Input 
                    type="password" 
                    bind:value={giteaToken} 
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                />
                <div class="p-3 bg-white/50 border border-border rounded mt-2 shadow-inset">
                    <p class="text-[10px] text-muted leading-relaxed">
                        Токен необходим для автоматического создания задач (Issues) в Gitea от вашего имени.
                        Вы можете сгенерировать его в Gitea: <span class="font-bold">Settings → Applications → Generate Token</span>.
                    </p>
                </div>
            </div>
        </div>
      </section>

      <!-- Status Message -->
      {#if message}
        <div class="p-3 text-[11px] bg-white border border-border shadow-inset text-center font-bold animate-in fade-in slide-in-from-top-1 {message.includes('Ошибка') ? 'text-danger' : 'text-success'}">
            {message}
        </div>
      {/if}

      <!-- Submit Button -->
      <div class="flex justify-end pt-4 border-t border-border">
        <Button onclick={handleSave} disabled={isSaving} class="min-w-[180px] h-11 shadow-neo">
            {#if isSaving}
                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                Сохранение...
            {:else}
                <Save class="h-4 w-4 mr-2" />
                Применить изменения
            {/if}
        </Button>
      </div>

    </div>

    <!-- Версия системы в стиле Win95 -->
    <div class="text-center opacity-30">
        <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground">TMS Sucker Pocker Edition v1.0.4</p>
    </div>

  </div>
</div>