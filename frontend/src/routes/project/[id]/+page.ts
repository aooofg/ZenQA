// src/routes/project/[id]/+page.ts
import { pb } from '$lib/pb';

export const ssr = false;

export async function load({ params, fetch }) {
    const projectId = params.id;

    try {
        // Добавляем 3-м параметром запрос проекта
        const [cases, runs, project] = await Promise.all([
            pb.collection('cases').getFullList({
                filter: `project_id="${projectId}"`,
                fetch: fetch
            }),
            pb.collection('runs').getList(1, 5, {
                filter: `project_id="${projectId}"`,
                sort: '-created',
                fetch: fetch
            }),
            // ЗАГРУЖАЕМ ДАННЫЕ ПРОЕКТА
            pb.collection('projects').getOne(projectId, { fetch })
        ]);

        let lastRunResults: any[] = [];
        if (runs.items.length > 0) {
            lastRunResults = await pb.collection('run_results').getFullList({
                filter: `run_id="${runs.items[0].id}"`,
                fetch: fetch
            });
        }

        return {
            cases,           
            runs: runs.items, 
            lastRunResults,  
            projectId,
            project // <--- Теперь данные проекта доступны в Svelte компоненте
        };
    } catch (err) {
        console.error("Dashboard Load Error:", err);
        return { 
            cases: [], 
            runs: [], 
            lastRunResults: [], 
            projectId, 
            project: null // Возвращаем null при ошибке, чтобы интерфейс не упал
        };
    }
}