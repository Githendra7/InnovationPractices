import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FunctionalDecomposition, FunctionalDecompositionSchema } from '@/lib/schemas/stages';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Edit2, Save, X, Loader2, Plus, Trash2 } from 'lucide-react';

interface FunctionalViewProps {
    data: FunctionalDecomposition;
    outputId?: string;
}

export default function FunctionalView({ data, outputId }: FunctionalViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<FunctionalDecomposition>({
        resolver: zodResolver(FunctionalDecompositionSchema),
        defaultValues: data
    });

    const saveMutation = useMutation({
        mutationFn: async (values: FunctionalDecomposition) => {
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

    const onSubmit = (values: FunctionalDecomposition) => {
        saveMutation.mutate(values);
    };

    if (isEditing) {
        return (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="p-4 bg-slate-100 rounded-lg space-y-2">
                    <Label htmlFor="overallFunction">Overall Function</Label>
                    <Input {...form.register('overallFunction')} className="bg-white" />
                </div>

                <div className="space-y-4">
                    {form.watch('subFunctions').map((_, index) => (
                        <Card key={index}>
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Sub-Function {index + 1}</CardTitle>
                                <Button
                                    type="button" variant="ghost" size="icon"
                                    onClick={() => {
                                        const current = form.getValues('subFunctions');
                                        form.setValue('subFunctions', current.filter((_, i) => i !== index));
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label>ID (short)</Label>
                                        <Input {...form.register(`subFunctions.${index}.id`)} placeholder="e.g. heat_water" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Function Name</Label>
                                        <Input {...form.register(`subFunctions.${index}.function`)} placeholder="Verb + Noun" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Description</Label>
                                    <Textarea {...form.register(`subFunctions.${index}.description`)} rows={2} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Button
                        type="button" variant="outline" className="w-full"
                        onClick={() => {
                            const current = form.getValues('subFunctions');
                            form.setValue('subFunctions', [...current, { id: '', function: '', description: '' }]);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Sub-Function
                    </Button>
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

            <div className="p-4 bg-slate-100 rounded-lg text-center">
                <h3 className="text-lg font-semibold">Overall Function</h3>
                <p className="text-xl text-blue-700">{data.overallFunction}</p>
            </div>

            <div className="space-y-4">
                {data.subFunctions.map((sf, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex justify-between">
                                <span>{sf.function}</span>
                                <span className="text-sm font-mono text-stone-400">{sf.id}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-stone-600">{sf.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
