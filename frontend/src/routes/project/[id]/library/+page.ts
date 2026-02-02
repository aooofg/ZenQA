// src/routes/project/[id]/library/+page.ts
import { pb } from '$lib/pb';

export const ssr = false;

export async function load({ params, fetch }) {
    const projectId = params.id;

    try {
        // Мы запрашиваем ТРИ вещи: папки, кейсы и данные самого проекта
        const [suites, cases, project] = await Promise.all([
            // 1. Папки проекта
            pb.collection('suites').getFullList({
                filter: `project_id="${projectId}"`,
                sort: 'created',
                fetch: fetch
            }),
            // 2. Кейсы проекта
            pb.collection('cases').getFullList({
                filter: `project_id="${projectId}"`,
                sort: 'created',
                fetch: fetch
            }),
            // 3. Сам проект (для селекторов и настроек)
            pb.collection('projects').getOne(projectId, { fetch })
        ]);

        return {
            suites,
            cases,
            project,
            projectId
        };
    } catch (err) {
        console.error("Library Load Error:", err);
        return { 
            suites: [], 
            cases: [], 
            project: null, 
            projectId 
        };
    }
}