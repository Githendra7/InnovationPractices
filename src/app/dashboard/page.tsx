'use client';

import { useQuery } from '@tanstack/react-query';
import CreateProjectDialog from '@/components/project/CreateProjectDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight } from 'lucide-react';

async function fetchProjects() {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Failed to fetch projects');
    const data = await res.json();
    return data.projects;
}

export default function DashboardPage() {
    const { data: projects, isLoading, error } = useQuery({
        queryKey: ['projects'],
        queryFn: fetchProjects
    });

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
                    <p className="text-stone-500">Manage and continue your innovation sessions.</p>
                </div>
                <CreateProjectDialog />
            </div>

            {isLoading && <div>Loading projects...</div>}

            {error && <div className="text-red-500">Error loading projects.</div>}

            {!isLoading && projects?.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-lg bg-stone-50">
                    <p className="text-stone-500 mb-4">No projects yet.</p>
                    <CreateProjectDialog />
                </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects?.map((project: any) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="truncate">{project.title}</CardTitle>
                            <CardDescription>
                                {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-stone-600 line-clamp-3 mb-4">
                                {project.ideaText}
                            </p>
                            <Link href={`/project/${project.id}`}>
                                <Button variant="secondary" className="w-full">
                                    Open Project <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
