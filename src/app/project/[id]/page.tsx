import prisma from '@/lib/db/prisma';
import Wizard from '@/components/wizard/Wizard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { getSessionId } from '@/lib/db/session';
import { notFound, redirect } from 'next/navigation';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const sessionId = await getSessionId();
    if (!sessionId) {
        redirect('/');
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

    if (!project) notFound();
    if (project.sessionId !== sessionId) notFound(); // Should be 403 but 404 is safer for anonymity

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon"><ChevronLeft /></Button>
                    </Link>
                    <div>
                        <h1 className="font-semibold text-lg">{project.title}</h1>
                        <p className="text-xs text-stone-500">{project.domain || 'General Domain'}</p>
                    </div>
                </div>
                <div>
                    {/* Controls */}
                </div>
            </header>

            <main className="flex-1 bg-stone-50 p-6">
                <Wizard project={project} />
            </main>
        </div>
    );
}
