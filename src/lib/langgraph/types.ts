import {
    IntakeOutput,
    FunctionalDecomposition,
    MorphologicalChart,
    RisksTradeoffs,
    FinalReport
} from '@/lib/schemas/stages';

export interface GraphState {
    // Inputs
    projectId: string; // Used to fetch context if needed, though usually passed via config
    ideaText: string;
    domain?: string | null;

    // Outputs (State)
    intake?: IntakeOutput;
    functional?: FunctionalDecomposition;
    morphological?: MorphologicalChart;
    risks?: RisksTradeoffs;
    final?: FinalReport;

    // Metadata
    currentStage?: string;
    citations: Record<string, string[]>; // stage name -> list of chunk IDs
    promptVersion: string;
    error?: string;
    [key: string]: any;
}
