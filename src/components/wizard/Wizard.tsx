'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Download } from 'lucide-react';
import IntakeView from './IntakeView';
import FunctionalView from './FunctionalView';
import MorphologicalView from './MorphologicalView';
import RiskView from './RiskView';
import FinalView from './FinalView';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PDFReport } from '@/components/report/PDFReport';

interface WizardProps {
    project: any;
}

const STAGES = ['INTAKE', 'FUNCTIONAL', 'MORPHOLOGICAL', 'RISKS', 'FINAL'];

export default function Wizard({ project }: WizardProps) {
    const queryClient = useQueryClient();
    const [currentRunId, setCurrentRunId] = useState<string | null>(
        project.workflowRuns?.[0]?.id || null
    );

    // Poll for run updates if running
    const { data: run, isLoading, isError } = useQuery({
        queryKey: ['run', currentRunId],
        queryFn: async () => {
            if (!currentRunId) return null;
            const res = await fetch(`/api/workflow/run/${currentRunId}`);
            if (!res.ok) throw new Error('Failed to fetch run');
            const data = await res.json();
            return data.run;
        },
        enabled: !!currentRunId,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return (status === 'RUNNING') ? 2000 : false;
        }
    });

    const runMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/workflow/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: project.id })
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: (data) => {
            setCurrentRunId(data.runId);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });



    // Remove handleExport server-side call
    // const handleExport = () => {
    //    window.open(`/api/export/${project.id}`, '_blank');
    // };

    // Helper to get output for a stage
    const getOutput = (stage: string) => {
        const output = run?.outputs?.find((o: any) => o.stage === stage);
        // Prefer user edits if implementing editing later
        return output?.userEdits || output?.jsonOutput;
    };

    if (!currentRunId && !runMutation.isPending) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Ready to start?</h2>
                <p className="mb-6 text-stone-600">Click below to begin the analysis workflow.</p>
                <Button size="lg" onClick={() => runMutation.mutate()}>Start Analysis</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                    Status: <span className={run?.status === 'COMPLETED' ? 'text-green-600' : 'text-blue-600'}>{run?.status || 'Starting...'}</span>
                </h2>
                <div className="space-x-2">
                    {run?.status === 'COMPLETED' && (
                        <PDFDownloadLink
                            document={
                                <PDFReport
                                    projectTitle={project.title}
                                    date={new Date().toLocaleDateString()}
                                    intake={getOutput('INTAKE')}
                                    functional={getOutput('FUNCTIONAL')}
                                    morphological={getOutput('MORPHOLOGICAL')}
                                    risks={getOutput('RISKS')}
                                    final={getOutput('FINAL')}
                                />
                            }
                            fileName={`${project.title.replace(/\s+/g, '_')}_Report.pdf`}
                        >
                            {({ loading }) => (
                                <Button variant="outline" disabled={loading}>
                                    <Download className="w-4 h-4 mr-2" />
                                    {loading ? 'Generating PDF...' : 'Export PDF'}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    )}
                    <Button
                        onClick={() => runMutation.mutate()}
                        disabled={runMutation.isPending || run?.status === 'RUNNING'}
                    >
                        {(run?.status === 'RUNNING' || runMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {run?.status === 'COMPLETED' ? 'Re-run Analysis' : 'Run Workflow'}
                    </Button>
                </div>
            </div>

            {runMutation.isPending && !currentRunId && (
                <div className="text-center py-10">Starting workflow...</div>
            )}

            <div className="space-y-12">
                {/* INTAKE */}
                {getOutput('INTAKE') && (
                    <section>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold">1</div>
                            <h3 className="text-2xl font-bold">Problem Definition</h3>
                        </div>
                        <IntakeView
                            data={getOutput('INTAKE')}
                            outputId={run?.outputs?.find((o: any) => o.stage === 'INTAKE')?.id}
                        />
                        <Separator className="my-8" />
                    </section>
                )}

                {/* FUNCTIONAL */}
                {getOutput('FUNCTIONAL') && (
                    <section>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold">2</div>
                            <h3 className="text-2xl font-bold">Functional Decomposition</h3>
                        </div>
                        <FunctionalView
                            data={getOutput('FUNCTIONAL')}
                            outputId={run?.outputs?.find((o: any) => o.stage === 'FUNCTIONAL')?.id}
                        />
                        <Separator className="my-8" />
                    </section>
                )}

                {/* MORPHOLOGICAL */}
                {getOutput('MORPHOLOGICAL') && (
                    <section>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold">3</div>
                            <h3 className="text-2xl font-bold">Morphological Analysis</h3>
                        </div>
                        <MorphologicalView
                            data={getOutput('MORPHOLOGICAL')}
                            outputId={run?.outputs?.find((o: any) => o.stage === 'MORPHOLOGICAL')?.id}
                        />
                        <Separator className="my-8" />
                    </section>
                )}

                {/* RISKS */}
                {getOutput('RISKS') && (
                    <section>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold">4</div>
                            <h3 className="text-2xl font-bold">Risks & Trade-offs</h3>
                        </div>
                        <RiskView
                            data={getOutput('RISKS')}
                            outputId={run?.outputs?.find((o: any) => o.stage === 'RISKS')?.id}
                        />
                        <Separator className="my-8" />
                    </section>
                )}

                {/* FINAL */}
                {getOutput('FINAL') && (
                    <section>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">5</div>
                            <h3 className="text-2xl font-bold text-green-700">Final Report</h3>
                        </div>
                        <FinalView
                            data={getOutput('FINAL')}
                            outputId={run?.outputs?.find((o: any) => o.stage === 'FINAL')?.id}
                        />
                    </section>
                )}

                {run?.status === 'RUNNING' && (
                    <div className="py-10 text-center animate-pulse text-stone-500">
                        Thinking and generating next stage...
                    </div>
                )}
            </div>
        </div>
    );
}
