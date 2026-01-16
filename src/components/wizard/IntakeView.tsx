import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IntakeOutput, IntakeOutputSchema } from '@/lib/schemas/stages';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Edit2, Save, X, Loader2, Plus, Trash2 } from 'lucide-react';

interface IntakeViewProps {
    data: IntakeOutput;
    outputId?: string;
}

export default function IntakeView({ data, outputId }: IntakeViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<IntakeOutput>({
        resolver: zodResolver(IntakeOutputSchema),
        defaultValues: data
    });

    const saveMutation = useMutation({
        mutationFn: async (values: IntakeOutput) => {
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

    const onSubmit = (values: IntakeOutput) => {
        saveMutation.mutate(values);
    };

    if (isEditing) {
        return (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Refine Problem Definition</CardTitle>
                        <CardDescription>Edit the AI's understanding of your idea.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cleaned Idea</Label>
                            <Textarea {...form.register('cleanedIdea')} rows={3} />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-1 gap-4">
                    {/* Objectives */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Objectives</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {form.watch('objectives').map((_, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input {...form.register(`objectives.${index}`)} />
                                        <Button
                                            type="button" variant="ghost" size="icon"
                                            onClick={() => {
                                                const current = form.getValues('objectives');
                                                form.setValue('objectives', current.filter((_, i) => i !== index));
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button" variant="outline" size="sm" className="w-full"
                                    onClick={() => {
                                        const current = form.getValues('objectives');
                                        form.setValue('objectives', [...current, ""]);
                                    }}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Objective
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Constraints */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Constraints</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {form.watch('constraints').map((_, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input {...form.register(`constraints.${index}`)} />
                                        <Button
                                            type="button" variant="ghost" size="icon"
                                            onClick={() => {
                                                const current = form.getValues('constraints');
                                                form.setValue('constraints', current.filter((_, i) => i !== index));
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button" variant="outline" size="sm" className="w-full"
                                    onClick={() => {
                                        const current = form.getValues('constraints');
                                        form.setValue('constraints', [...current, ""]);
                                    }}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Constraint
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assumptions */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Assumptions</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {form.watch('assumptions').map((_, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input {...form.register(`assumptions.${index}`)} />
                                        <Button
                                            type="button" variant="ghost" size="icon"
                                            onClick={() => {
                                                const current = form.getValues('assumptions');
                                                form.setValue('assumptions', current.filter((_, i) => i !== index));
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button" variant="outline" size="sm" className="w-full"
                                    onClick={() => {
                                        const current = form.getValues('assumptions');
                                        form.setValue('assumptions', [...current, ""]);
                                    }}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Assumption
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <div className="space-y-6 relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Refined Problem Definition</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg font-medium">{data.cleanedIdea}</p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader><CardTitle className="text-base">Objectives</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-1">
                            {data.objectives.map((o, i) => <li key={i}>{o}</li>)}
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Constraints</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-1">
                            {data.constraints.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Assumptions</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-1">
                            {data.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
