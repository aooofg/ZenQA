import { pb } from '$lib/pb';

export const ssr = false;

export async function load({ params, fetch }) {
    const { id: projectId, planId } = params;

    const [plan, suites, cases] = await Promise.all([
        pb.collection('test_plans').getOne(planId, { fetch }),
        pb.collection('suites').getFullList({
            filter: `project_id="${projectId}"`,
            fetch: fetch
        }),
        pb.collection('cases').getFullList({
            filter: `project_id="${projectId}"`,
            fetch: fetch
        })
    ]);

    return { plan, suites, cases, projectId };
}