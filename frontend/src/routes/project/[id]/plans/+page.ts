import { pb } from '$lib/pb';

export const ssr = false;

export async function load({ params, fetch }) {
    const plans = await pb.collection('test_plans').getFullList({
        filter: `project_id="${params.id}"`,
        sort: '-created',
        fetch: fetch
    });

    return { plans, projectId: params.id };
}