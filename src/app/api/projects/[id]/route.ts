import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSessionId } from '@/lib/db/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const sessionId = await getSessionId();
    if (!sessionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            workflowRuns: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                    outputs: true
                }
            }
        }
    });

    if (!project) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (project.sessionId !== sessionId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ project });
}
