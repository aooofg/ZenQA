<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { pb } from '$lib/pb';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { LayoutGrid, Loader2, AlertCircle } from 'lucide-svelte';

  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let error = $state('');

  async function handleLogin() {
    if (!email || !password) return;
    isLoading = true;
    error = '';

    try {
      // Пытаемся залогиниться как обычный пользователь или админ
      // В PocketBase по умолчанию используем коллекцию users
      await pb.collection('users').authWithPassword(email, password);
      goto('/'); // Уходим на главную
    } catch (e: any) {
      console.error(e);
      error = 'Неверный логин или пароль';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="h-screen w-screen flex items-center justify-center bg-panel">
  <div class="w-full max-w-sm space-y-8 p-8 bg-surface border border-border rounded-2xl shadow-neo">
    
    <!-- Logo & Header -->
    <div class="text-center space-y-2">
      <div class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white mb-2">
        <LayoutGrid class="h-8 w-8" />
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-foreground">Вход в TMS</h1>
      <p class="text-sm text-muted">Введите свои данные для доступа</p>
    </div>

    <!-- Form -->
    <form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
      {#if error}
        <div class="p-3 rounded-md bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2 animate-in fade-in zoom-in-95">
          <AlertCircle class="h-4 w-4" />
          {error}
        </div>
      {/if}

      <div class="space-y-1">
        <label for="email" class="text-[10px] font-bold text-muted uppercase tracking-wider">Email</label>
        <Input 
          id="email"
          type="email" 
          bind:value={email} 
          placeholder="admin@tms.local" 
          required 
        />
      </div>

      <div class="space-y-1">
        <label for="password" class="text-[10px] font-bold text-muted uppercase tracking-wider">Пароль</label>
        <Input 
          id="password"
          type="password" 
          bind:value={password} 
          placeholder="••••••••" 
          required 
        />
      </div>

      <Button type="submit" class="w-full h-11 text-base" disabled={isLoading}>
        {#if isLoading}
          <Loader2 class="h-5 w-5 animate-spin mr-2" />
        {/if}
        Войти
      </Button>
    </form>

    <div class="text-center">
        <p class="text-[10px] text-muted-foreground uppercase opacity-50">Sucker Pocker TMS v1.0</p>
    </div>
  </div>
</div>