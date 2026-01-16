import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSessionId } from '@/lib/db/session';
import { z } from 'zod';

const CreateProjectSchema = z.object({
    title: z.string().min(1).max(80),
    ideaText: z.string().min(1).max(4000),
    domain: z.string().optional()
});

export async function GET(req: NextRequest) {
    const sessionId = await getSessionId();
    if (!sessionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
        where: { sessionId },
        orderBy: { updatedAt: 'desc' },
        include: {
            workflowRuns: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
    const sessionId = await getSessionId();
    if (!sessionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, ideaText, domain } = CreateProjectSchema.parse(body);

        // Limit projects per session (e.g. 10)
        const count = await prisma.project.count({ where: { sessionId } });
        if (count >= 20) {
            return NextResponse.json({ error: 'Project limit reached for this session.' }, { status: 429 });
        }

        const project = await prisma.project.create({
            data: {
                sessionId,
                title,
                ideaText,
                domain
            }
        });

        return NextResponse.json({ project });
    } catch (error) {
        console.error("Create Project Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as z.ZodError).errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
