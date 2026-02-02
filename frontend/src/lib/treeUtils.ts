// src/lib/treeUtils.ts
export interface TreeNode {
    id: string;
    name: string;
    type: 'suite' | 'case';
    parentId: string | null;
    children: TreeNode[];
    data?: any;
}

export function buildTree(suites: any[] = [], cases: any[] = []): TreeNode[] {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // 1. Регистрируем все папки
    suites.forEach(s => {
        nodeMap.set(s.id, {
            id: s.id,
            name: s.name,
            type: 'suite',
            parentId: (s.parent_id && s.parent_id !== "") ? s.parent_id : null,
            children: [],
            data: s
        });
    });

    // 2. Связываем папки друг с другом
    suites.forEach(s => {
        const node = nodeMap.get(s.id)!;
        if (node.parentId && nodeMap.has(node.parentId)) {
            nodeMap.get(node.parentId)!.children.push(node);
        } else {
            // Если родителя нет или он не в нашем списке — это корень
            rootNodes.push(node);
        }
    });

    // 3. Добавляем кейсы в папки или в корень
    cases.forEach(c => {
        const caseNode: TreeNode = {
            id: c.id,
            name: c.title,
            type: 'case',
            parentId: (c.suite_id && c.suite_id !== "") ? c.suite_id : null,
            children: [],
            data: c
        };

        if (caseNode.parentId && nodeMap.has(caseNode.parentId)) {
            nodeMap.get(caseNode.parentId)!.children.push(caseNode);
        } else {
            rootNodes.push(caseNode);
        }
    });

    return rootNodes;
}

export function isDescendant(nodes: TreeNode[], sourceId: string, targetId: string): boolean {
    for (const node of nodes) {
        if (node.id === sourceId) {
            return checkChildren(node, targetId);
        }
        if (node.children.length > 0) {
            if (isDescendant(node.children, sourceId, targetId)) return true;
        }
    }
    return false;
}

function checkChildren(parent: TreeNode, targetId: string): boolean {
    for (const child of parent.children) {
        if (child.id === targetId) return true;
        if (checkChildren(child, targetId)) return true;
    }
    return false;
}