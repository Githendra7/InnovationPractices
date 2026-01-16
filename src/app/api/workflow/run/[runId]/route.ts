import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSessionId } from '@/lib/db/session';

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
    const sessionId = await getSessionId();
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { runId } = await params;

    const run = await prisma.workflowRun.findUnique({
        where: { id: runId },
        include: {
            project: { select: { sessionId: true } }, // to check ownership
            outputs: {
                orderBy: { createdAt: 'desc' }
                // We usually want one per stage. If multiple, distinct by stage.
                // But Prisma distinct on field is not supported in include?
                // We'll filter in JS or just take all history.
            }
        }
    });

    if (!run || run.project.sessionId !== sessionId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ run });
}
