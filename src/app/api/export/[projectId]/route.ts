import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSessionId } from '@/lib/db/session';
import { generateMarkdown } from '@/lib/report/generateMarkdown';

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const sessionId = await getSessionId();
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            workflowRuns: {
                where: { status: 'COMPLETED' },
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: { outputs: true }
            }
        }
    });

    if (!project || project.sessionId !== sessionId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const latestRun = project.workflowRuns[0];
    if (!latestRun) {
        return NextResponse.json({ error: 'No completed run found to export.' }, { status: 400 });
    }

    const md = generateMarkdown(project.title, project.ideaText, latestRun.outputs, project.domain);

    return new NextResponse(md, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown',
            'Content-Disposition': `attachment; filename="${project.title.replace(/\s+/g, '_')}_Report.md"`
        }
    });
}
