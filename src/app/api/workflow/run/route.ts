import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSessionId } from '@/lib/db/session';
import { runFullWorkflow } from '@/lib/langgraph/graph';
import { z } from 'zod';

const RunSchema = z.object({
    projectId: z.string().uuid()
});

export async function POST(req: NextRequest) {
    const sessionId = await getSessionId();
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { projectId } = RunSchema.parse(body);

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.sessionId !== sessionId) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Rate limiting check (simple DB based)
        // Check runs in last minute
        const recentRuns = await prisma.workflowRun.count({
            where: {
                projectId: project.id,
                createdAt: { gt: new Date(Date.now() - 60000) }
            }
        });

        if (recentRuns >= 3) {
            return NextResponse.json({ error: 'Too many runs. Please wait.' }, { status: 429 });
        }

        // Trigger Workflow (Fire and forget, but return runId)
        // runFullWorkflow is async but returns the created run object strictly before starting the async processing loop?
        // Wait, in my implementation runFullWorkflow does:
        // 1. await create run
        // 2. (async () => { ... })()
        // 3. return run
        // So it returns immediately. Good.

        const run = await runFullWorkflow(project.id, project.ideaText, project.domain || undefined);

        return NextResponse.json({ runId: run.id, status: run.status });

    } catch (error) {
        console.error("Workflow Run Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
