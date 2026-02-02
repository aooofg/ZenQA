// src\routes\project\[id]\runs\[runId]\+page.ts
import { pb } from '$lib/pb';

export const ssr = false;

export async function load({ params, fetch }) {
    const runId = params.runId;
    const projectId = params.id; // Берем ID проекта из URL

    // Параллельная загрузка данных для скорости
    const [run, project, results] = await Promise.all([
        pb.collection('runs').getOne(runId, { fetch }),
        pb.collection('projects').getOne(projectId, { fetch }), // <-- Загружаем проект с настройками
        pb.collection('run_results').getFullList({
            filter: `run_id="${runId}"`,
            expand: 'case_id',
            sort: 'created',
            fetch: fetch
        })
    ]);

    return { run, project, results };
}