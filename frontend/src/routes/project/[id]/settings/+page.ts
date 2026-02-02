import { pb } from '$lib/pb';

export const ssr = false;

export async function load({ params, fetch }) {
    // Получаем проект по ID
    const project = await pb.collection('projects').getOne(params.id, { fetch });
    return { project };
}