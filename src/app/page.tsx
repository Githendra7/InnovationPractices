'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Lightbulb, ShieldCheck, Layers } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize session automatically
    fetch('/api/session/init', { method: 'POST' }).catch(console.error);
  }, []);

  const handleStart = () => {
    setLoading(true);
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center">
      <div className="max-w-4xl space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-stone-900">
          Turn Ideas into Engineered Products
        </h1>
        <p className="text-xl text-stone-600 max-w-2xl mx-auto">
          AI-assisted support for early-stage innovators. Systematically structure, explore, and evaluate your product ideas using proven frameworks.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left py-8">
          <Card>
            <CardHeader>
              <Lightbulb className="w-8 h-8 text-amber-500 mb-2" />
              <CardTitle>Structured Thinking</CardTitle>
              <CardDescription>
                Guided workflow from idea intake to final report.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Layers className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle>Engineering Rigor</CardTitle>
              <CardDescription>
                Functional Decomposition, Morphological Analysis, and Risk Assessment.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <ShieldCheck className="w-8 h-8 text-green-500 mb-2" />
              <CardTitle>Private & Anonymous</CardTitle>
              <CardDescription>
                No login required. Your intellectual property stays within your session.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Button size="lg" onClick={handleStart} disabled={loading} className="text-lg px-8 py-6">
          {loading ? 'Loading...' : 'Start Innovating'} <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
