<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { pb } from '$lib/pb';
  
  let { children } = $props();

  let isLoginPage = $derived($page.url.pathname === '/login');
  let userTheme = $derived(pb.authStore.model?.theme || 'modern');

  $effect(() => {
    if (typeof document !== 'undefined') {
      const themes = ['theme-modern', 'theme-win95', 'theme-dark'];
      document.body.classList.remove(...themes);
      document.body.classList.add(`theme-${userTheme}`);
    }
  });

  onMount(() => {
    if (!pb.authStore.isValid && !isLoginPage) goto('/login');
  });

  pb.authStore.onChange(() => {
    if (!pb.authStore.isValid && !isLoginPage) goto('/login');
  });
</script>

<div class="h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
  <main class="h-full w-full relative">
    {@render children()}
  </main>
</div>

<style>
  :global(body) {
    transition: background-color 0.3s ease, color 0.3s ease;
  }
</style>