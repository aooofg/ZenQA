// src/routes/project/[id]/runs/+page.ts
import { pb } from '$lib/pb';

export const ssr = false;

export async function load({ params, fetch }) {
    const projectId = params.id;
    
    try {
        const [runsResponse, plans] = await Promise.all([
            // Ограничиваем выдачу 40 последними прогонами
            pb.collection('runs').getList(1, 40, {
                filter: `project_id="${projectId}"`,
                sort: '-created',
                fetch: fetch
            }),
            pb.collection('test_plans').getFullList({
                filter: `project_id="${projectId}"`,
                sort: 'name',
                fetch: fetch
            })
        ]);

        return { 
            // Обрати внимание: теперь берем .items из ответа getList
            runs: runsResponse.items, 
            plans, 
            projectId 
        };
    } catch (err) {
        console.error("Ошибка загрузки:", err);
        return { runs: [], plans: [], projectId };
    }
}