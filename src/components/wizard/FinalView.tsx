import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FinalReport, FinalReportSchema } from '@/lib/schemas/stages';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Edit2, Save, X, Loader2, Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface FinalViewProps {
    data: FinalReport;
    outputId?: string;
}

export default function FinalView({ data, outputId }: FinalViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<FinalReport>({
        resolver: zodResolver(FinalReportSchema),
        defaultValues: data
    });

    const saveMutation = useMutation({
        mutationFn: async (values: FinalReport) => {
            if (!outputId) throw new Error("No output ID");
            const res = await fetch('/api/workflow/saveEdits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    outputId,
                    userEdits: values
                })
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['run'] });
        }
    });

    const onSubmit = (values: FinalReport) => {
        saveMutation.mutate(values);
    };

    if (isEditing) {
        return (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Executive Summary</CardTitle>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                                <X className="w-4 h-4 mr-2" /> Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Save className="w-4 h-4 mr-2" /> Save
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Label>Summary Text</Label>
                        <Textarea {...form.register('summary')} rows={6} className="mt-2 bg-white" />
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Recommended Next Steps</h3>
                        <Button
                            type="button" variant="outline" size="sm"
                            onClick={() => {
                                const current = form.getValues('recommendedNextSteps');
                                form.setValue('recommendedNextSteps', [...current, ""]);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Step
                        </Button>
                    </div>
                    {form.watch('recommendedNextSteps').map((_, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                            <Input {...form.register(`recommendedNextSteps.${index}`)} className="flex-1" />
                            <Button
                                type="button" variant="ghost" size="icon"
                                onClick={() => {
                                    const current = form.getValues('recommendedNextSteps');
                                    form.setValue('recommendedNextSteps', current.filter((_, i) => i !== index));
                                }}
                            >
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>
            </form>
        );
    }

    return (
        <div className="space-y-6 relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
            </div>

            <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
                <CardHeader>
                    <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{data.summary}</p>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-lg font-bold">Recommended Next Steps</h3>
                {data.recommendedNextSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-white border rounded-lg shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                        <span>{step}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
