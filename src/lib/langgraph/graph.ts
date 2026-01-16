import { StateGraph, END } from '@langchain/langgraph';
import { GraphState } from './types';
import { intakeNode, functionalNode, morphologicalNode, riskNode, finalNode } from './nodes';
import prisma from '../db/prisma';

// Define the Graph
// @ts-ignore
const workflow = new StateGraph({
    channels: {
        projectId: { value: (a: any, b: any) => b ?? a, default: () => "" },
        ideaText: { value: (a: any, b: any) => b ?? a, default: () => "" },
        domain: { value: (a: any, b: any) => b ?? a, default: () => null },
        intake: { value: (a: any, b: any) => b ?? a },
        functional: { value: (a: any, b: any) => b ?? a },
        morphological: { value: (a: any, b: any) => b ?? a },
        risks: { value: (a: any, b: any) => b ?? a },
        final: { value: (a: any, b: any) => b ?? a },
        citations: { value: (a: any, b: any) => ({ ...a, ...b }), default: () => ({}) },
        promptVersion: { value: (a: any, b: any) => b ?? a, default: () => "v1" },
        error: { value: (a: any, b: any) => b ?? a },
    }
})
    .addNode("INTAKE", intakeNode as any)
    .addNode("FUNCTIONAL", functionalNode as any)
    .addNode("MORPHOLOGICAL", morphologicalNode as any)
    .addNode("RISKS", riskNode as any)
    .addNode("FINAL", finalNode as any)
    .addEdge("INTAKE", "FUNCTIONAL")
    .addEdge("FUNCTIONAL", "MORPHOLOGICAL")
    .addEdge("MORPHOLOGICAL", "RISKS")
    .addEdge("RISKS", "FINAL")
    .addEdge("FINAL", END);

workflow.setEntryPoint("INTAKE");

export const graph = workflow.compile();

// Helper to save output to DB
async function saveOutput(runId: string, stage: string, output: any, citations: string[]) {
    if (!output) return;
    try {
        // Unique constraint not enforced in DB yet, so manual check:
        const existing = await prisma.workflowOutput.findFirst({
            where: { runId, stage: stage as any }
        });
        if (existing) {
            await prisma.workflowOutput.update({
                where: { id: existing.id },
                data: { jsonOutput: output, citations }
            });
        } else {
            await prisma.workflowOutput.create({
                data: {
                    runId,
                    stage: stage as any,
                    jsonOutput: output,
                    citations
                }
            });
        }

    } catch (err) {
        console.error(`Failed to save output for ${stage}:`, err);
    }
}

export async function runFullWorkflow(projectId: string, ideaText: string, domain?: string) {
    // 1. Create Run in DB
    const run = await prisma.workflowRun.create({
        data: {
            projectId,
            version: 1, // simplified versioning logic
            status: 'RUNNING',
            startedAt: new Date()
        }
    });

    const initialState: GraphState = {
        projectId,
        ideaText,
        domain,
        citations: {},
        promptVersion: '1.0'
    };

    // Run asynchronously
    (async () => {
        try {
            // We manually invoke the graph or iterate.
            // LangGraph stream() allows us to see steps.
            const stream = await graph.stream(initialState);

            for await (const chunk of stream) {
                // chunk is like { INTAKE: { ...stateUpdate } }
                const c = chunk as any;
                const stageName = Object.keys(c)[0];
                const stateUpdate = c[stageName];

                console.log(`Finished Stage: ${stageName}`);

                // Save to DB
                if (stageName === "INTAKE") await saveOutput(run.id, "INTAKE", stateUpdate.intake, stateUpdate.citations?.INTAKE ?? []);
                if (stageName === "FUNCTIONAL") await saveOutput(run.id, "FUNCTIONAL", stateUpdate.functional, stateUpdate.citations?.FUNCTIONAL ?? []);
                if (stageName === "MORPHOLOGICAL") await saveOutput(run.id, "MORPHOLOGICAL", stateUpdate.morphological, stateUpdate.citations?.MORPHOLOGICAL ?? []);
                if (stageName === "RISKS") await saveOutput(run.id, "RISKS", stateUpdate.risks, stateUpdate.citations?.RISKS ?? []);
                if (stageName === "FINAL") await saveOutput(run.id, "FINAL", stateUpdate.final, stateUpdate.citations?.FINAL ?? []);
            }

            await prisma.workflowRun.update({
                where: { id: run.id },
                data: { status: 'COMPLETED', finishedAt: new Date() }
            });

        } catch (e: any) {
            console.error("Workflow failed:", e);
            await prisma.workflowRun.update({
                where: { id: run.id },
                data: {
                    status: 'FAILED',
                    errorMessage: e.message || 'Unknown error',
                    finishedAt: new Date()
                }
            });
        }
    })();

    return run;
}
