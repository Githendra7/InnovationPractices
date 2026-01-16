'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Fix import: react-query is @tanstack/react-query
import { Plus } from 'lucide-react';
// import { toast } from 'sonner'; // No sonner yet, use console or alert

export default function CreateProjectDialog() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        title: '',
        ideaText: '',
        domain: ''
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: (data) => {
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            router.push(`/project/${data.project.id}`);
        },
        onError: (err) => {
            alert("Failed to create project: " + err.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> New Project</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Start New Innovation Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Project Title</Label>
                        <Input
                            id="title"
                            required
                            placeholder="e.g. Smart Coffee Maker"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="domain">Domain (Optional)</Label>
                        <Input
                            id="domain"
                            placeholder="e.g. Consumer Electronics"
                            value={formData.domain}
                            onChange={e => setFormData({ ...formData, domain: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="idea">Initial Idea</Label>
                        <Textarea
                            id="idea"
                            required
                            placeholder="Describe your product idea in a few sentences..."
                            className="h-32"
                            value={formData.ideaText}
                            onChange={e => setFormData({ ...formData, ideaText: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Creating...' : 'Create Project'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
