<script lang="ts">
    import { page } from "$app/stores";
    import { cn, getInitials } from "$lib/utils";
    import { pb } from "$lib/pb";
    import { onMount } from "svelte";
    import { invalidateAll } from "$app/navigation";

    import {
        ChevronLeft,
        LogOut,
        LayoutGrid,
        ChevronDown,
    } from "lucide-svelte";

    let { data, children } = $props();

    let projectId = $derived($page.params.id);
    let currentPath = $derived($page.url.pathname);
    let currentUser = pb.authStore.model;
    let allProjects = $derived($page.data?.projects || []);
    let currentProject = $derived(allProjects.find((p) => p.id === projectId));

    let tabs = $derived([
        { name: "Dashboard", href: `/project/${projectId}` },
        { name: "Library", href: `/project/${projectId}/library` },
        { name: "Test Plans", href: `/project/${projectId}/plans` },
        { name: "Runs", href: `/project/${projectId}/runs` },
        { name: "Settings", href: `/project/${projectId}/settings` },
    ]);

    function isActive(href: string) {
        if (href.endsWith(projectId))
            return currentPath === href || currentPath === href + "/";
        return currentPath.includes(href);
    }

    function logout() {
        pb.authStore.clear();
        window.location.href = "/login";
    }

    onMount(() => {
        // Подписка живет всё время, пока мы внутри любого экрана проекта
        pb.collection("cases").subscribe("*", () => invalidateAll());
        pb.collection("suites").subscribe("*", () => invalidateAll());

        return () => {
            // Отписываемся только когда ПОЛНОСТЬЮ выходим из проекта (в Хаб)
            if (pb.realtime.clientId) {
                pb.collection("cases")
                    .unsubscribe("*")
                    .catch(() => {});
                pb.collection("suites")
                    .unsubscribe("*")
                    .catch(() => {});
            }
        };
    });
</script>

<div class="flex flex-col h-screen w-screen bg-background overflow-hidden">
    <!-- HEADER -->
    <header
        class="relative h-14 border-b border-border bg-panel shrink-0 z-40 px-4 flex items-center justify-between shadow-sm"
    >
        <!-- Left: Project Info -->
        <div class="flex items-center gap-2 z-10">
            <div class="relative group">
                <button
                    class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/5 transition-colors"
                >
                    <div
                        class="h-6 w-6 bg-primary text-white text-[10px] font-bold rounded flex items-center justify-center shadow-sm"
                    >
                        {currentProject?.key || "??"}
                    </div>
                    <span class="font-bold text-sm truncate max-w-[150px]"
                        >{currentProject?.name || "Loading..."}</span
                    >
                    <ChevronDown class="h-3.5 w-3.5 text-muted" />
                </button>

                <!-- Dropdown -->
                <div
                    class="absolute left-0 top-full mt-1 w-64 bg-surface border border-border rounded-lg shadow-xl opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50 p-1"
                >
                    <div
                        class="text-[9px] font-black text-muted uppercase px-3 py-2 tracking-widest opacity-50"
                    >
                        Switch Project
                    </div>
                    <div class="max-h-60 overflow-y-auto custom-scrollbar">
                        {#each allProjects as p}
                            <a
                                href="/project/{p.id}"
                                class="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-panel transition-colors {p.id ===
                                projectId
                                    ? 'bg-primary/5 text-primary font-bold'
                                    : ''}"
                            >
                                <div
                                    class="h-5 w-5 bg-panel border border-border text-[9px] font-bold rounded flex items-center justify-center"
                                >
                                    {p.key}
                                </div>
                                <span class="truncate">{p.name}</span>
                            </a>
                        {/each}
                    </div>
                    <div class="border-t border-border mt-1 pt-1">
                        <a
                            href="/"
                            class="flex items-center gap-3 px-3 py-2 text-xs text-primary font-bold hover:bg-panel rounded-md"
                        >
                            <LayoutGrid class="h-3.5 w-3.5" /> All Projects
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Center: Tabs (Fixed Positioning) -->
        <nav
            class="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none"
        >
            <div class="flex items-end gap-1 pointer-events-auto">
                {#each tabs as tab}
                    <a
                        href={tab.href}
                        class={cn(
                            "h-9 flex items-center px-4 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all rounded-t-md",
                            isActive(tab.href)
                                ? "border-primary text-primary bg-surface shadow-[0_-2px_10px_rgba(0,0,0,0.05)] translate-y-[1px]"
                                : "border-transparent text-muted hover:text-foreground hover:bg-white/10",
                        )}
                    >
                        {tab.name}
                    </a>
                {/each}
            </div>
        </nav>

        <!-- Right: User -->
        <div class="flex items-center gap-1 z-10">
            <a
                href="/settings/profile"
                class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/5 transition-colors group"
            >
                <div class="flex flex-col items-end mr-1 hidden sm:flex">
                    <span class="text-[11px] font-bold leading-none"
                        >{currentUser?.email?.split("@")[0]}</span
                    >
                    <span
                        class="text-[8px] text-success font-black uppercase tracking-tighter mt-1"
                        >Online</span
                    >
                </div>
                <div
                    class="h-7 w-7 rounded-full bg-panel border border-border flex items-center justify-center font-bold text-[10px] shadow-sm group-hover:border-primary transition-colors"
                >
                    {getInitials(currentUser?.email || "??")}
                </div>
            </a>
            <button
                onclick={logout}
                class="p-2 text-muted hover:text-danger transition-colors"
                title="Logout"
            >
                <LogOut class="h-4 w-4" />
            </button>
        </div>
    </header>

    <!-- CONTENT AREA -->
    <main class="flex-1 overflow-hidden relative bg-bg-main">
        {@render children()}
    </main>
</div>
