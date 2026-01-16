import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RisksTradeoffs, RisksSchema } from '@/lib/schemas/stages';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Edit2, Save, X, Loader2, Plus, Trash2 } from 'lucide-react';

interface RiskViewProps {
    data: RisksTradeoffs;
    outputId?: string;
}

export default function RiskView({ data, outputId }: RiskViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<RisksTradeoffs>({
        resolver: zodResolver(RisksSchema),
        defaultValues: data
    });

    const saveMutation = useMutation({
        mutationFn: async (values: RisksTradeoffs) => {
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

    const onSubmit = (values: RisksTradeoffs) => {
        saveMutation.mutate(values);
    };

    if (isEditing) {
        return (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Edit Risks & Trade-offs</CardTitle>
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
                </Card>

                {/* Risks Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Risk Analysis</h3>
                        <Button
                            type="button" variant="outline" size="sm"
                            onClick={() => {
                                const current = form.getValues('risks');
                                form.setValue('risks', [...current, { category: 'Market', risk: '', mitigation: '' }]);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Risk
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {form.watch('risks').map((_, index) => (
                            <Card key={index} className="border-l-4 border-l-amber-500">
                                <CardContent className="pt-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="grid grid-cols-3 gap-2 w-full mr-4">
                                            <div className="col-span-2 space-y-1">
                                                <Label>Risk Description</Label>
                                                <Input {...form.register(`risks.${index}.risk`)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Category</Label>
                                                <Input {...form.register(`risks.${index}.category`)} placeholder="e.g. Technical" />
                                            </div>
                                        </div>
                                        <Button
                                            type="button" variant="ghost" size="icon"
                                            onClick={() => {
                                                const current = form.getValues('risks');
                                                form.setValue('risks', current.filter((_, i) => i !== index));
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Mitigation Strategy</Label>
                                        <Textarea {...form.register(`risks.${index}.mitigation`)} rows={2} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Trade-offs Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Key Trade-offs</h3>
                        <Button
                            type="button" variant="outline" size="sm"
                            onClick={() => {
                                const current = form.getValues('tradeoffs');
                                form.setValue('tradeoffs', [...current, { decision: '', optionA: '', optionB: '', notes: '' }]);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Trade-off
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {form.watch('tradeoffs').map((_, index) => (
                            <Card key={index} className="border-l-4 border-l-blue-500">
                                <CardContent className="pt-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1 w-full mr-4">
                                            <Label>Decision / Dilemma</Label>
                                            <Input {...form.register(`tradeoffs.${index}.decision`)} />
                                        </div>
                                        <Button
                                            type="button" variant="ghost" size="icon"
                                            onClick={() => {
                                                const current = form.getValues('tradeoffs');
                                                form.setValue('tradeoffs', current.filter((_, i) => i !== index));
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>Option A</Label>
                                            <Input {...form.register(`tradeoffs.${index}.optionA`)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Option B</Label>
                                            <Input {...form.register(`tradeoffs.${index}.optionB`)} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Analysis Notes</Label>
                                        <Textarea {...form.register(`tradeoffs.${index}.notes`)} rows={2} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </form>
        );
    }

    return (
        <div className="space-y-8 relative group">
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
            </div>

            <div>
                <h3 className="text-lg font-bold mb-4">Risk Analysis</h3>
                <div className="space-y-3">
                    {data.risks.map((risk, i) => (
                        <Card key={i} className="border-l-4 border-l-amber-500">
                            <CardContent className="pt-6">
                                <div className="flex justify-between mb-2">
                                    <span className="font-semibold">{risk.risk}</span>
                                    <Badge variant="outline">{risk.category}</Badge>
                                </div>
                                <p className="text-sm text-stone-600"><strong>Mitigation:</strong> {risk.mitigation}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold mb-4">Key Trade-offs</h3>
                <div className="space-y-3">
                    {data.tradeoffs.map((tradeoff, i) => (
                        <Card key={i} className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-6">
                                <div className="font-semibold text-lg mb-2">{tradeoff.decision}</div>
                                <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                                    <div className="p-2 bg-stone-100 rounded">Option A: {tradeoff.optionA}</div>
                                    <div className="p-2 bg-stone-100 rounded">Option B: {tradeoff.optionB}</div>
                                </div>
                                <p className="text-sm text-stone-600 italic">{tradeoff.notes}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
