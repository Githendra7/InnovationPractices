import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSessionId } from '@/lib/db/session';
import { z } from 'zod';
import * as Schemas from '@/lib/schemas/stages';

export const dynamic = 'force-dynamic';

const SaveEditsSchema = z.object({
    outputId: z.string().uuid(),
    userEdits: z.record(z.string(), z.any()) // Validation tailored to stage?
});

export async function POST(req: NextRequest) {
    const sessionId = await getSessionId();
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { outputId, userEdits } = SaveEditsSchema.parse(body);

        const output = await prisma.workflowOutput.findUnique({
            where: { id: outputId },
            include: { workflowRun: { include: { project: true } } }
        });

        if (!output || output.workflowRun.project.sessionId !== sessionId) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // Validate edits against schema based on stage
        // try {
        //  if (output.stage === 'INTAKE') Schemas.IntakeOutputSchema.parse(userEdits);
        //  ... etc.
        // } catch (e) { return 400 }

        // Save
        await prisma.workflowOutput.update({
            where: { id: outputId },
            data: { userEdits }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Save Edits Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
