import { pb } from '$lib/pb';

export const ssr = false;

export async function load({ fetch }) {
    // Если пользователь не залогинен, не пытаемся запрашивать проекты
    if (!pb.authStore.isValid) {
        return { projects: [] };
    }
    
    try {
        // Загружаем список всех доступных проектов
        const projects = await pb.collection('projects').getFullList({
            sort: '-created',
            fetch: fetch 
        });

        return { projects };
    } catch (err) {
        console.error("Layout Load Error:", err);
        return { projects: [] };
    }
}