import { z } from 'zod';

// Stage 1: Idea Intake
export const IntakeOutputSchema = z.object({
    cleanedIdea: z.string().describe("A clear, concise, and professional restatement of the user's idea."),
    objectives: z.array(z.string()).describe("List of key objectives or goals for the product."),
    constraints: z.array(z.string()).describe("List of technical or market constraints."),
    assumptions: z.array(z.string()).describe("List of assumptions made about the user or context."),
});

// Stage 2: Functional Decomposition
export const SubFunctionSchema = z.object({
    id: z.string().describe("Unique short ID for the sub-function (e.g., 'heat_water')."),
    function: z.string().describe("Name of the function (Verb + Noun)."),
    description: z.string().describe("Brief description of what this function achieves."),
});

export const FunctionalDecompositionSchema = z.object({
    overallFunction: z.string().describe("The main top-level function of the product."),
    subFunctions: z.array(SubFunctionSchema).describe("List of sub-functions that make up the system."),
});

// Stage 3: Morphological Chart
export const MorphologicalOptionSchema = z.object({
    option: z.string().describe("A specific solution or means to achieve the function."),
    pros: z.array(z.string()).describe("Advantages of this option."),
    cons: z.array(z.string()).describe("Disadvantages or limitations."),
});

export const FunctionAlternativesSchema = z.object({
    functionId: z.string().describe("The ID of the sub-function this row corresponds to."),
    function: z.string().describe("The name of the sub-function."),
    alternatives: z.array(MorphologicalOptionSchema).describe("3-5 different ways to implement this function."),
});

export const MorphologicalSchema = z.object({
    functionAlternatives: z.array(FunctionAlternativesSchema).describe("The morphological chart rows."),
});

// Stage 4: Risk & Trade-off
export const RiskSchema = z.object({
    category: z.string().describe("Category of risk (e.g., Technical, Market, Safety)."),
    risk: z.string().describe("Description of the risk."),
    mitigation: z.string().describe("Proposed strategy to mitigate the risk."),
});

export const TradeoffSchema = z.object({
    decision: z.string().describe("The decision being weighed."),
    optionA: z.string().describe("First option."),
    optionB: z.string().describe("Alternative option."),
    notes: z.string().describe("Analysis of the trade-off."),
});

export const RisksSchema = z.object({
    risks: z.array(RiskSchema).describe("List of identified risks."),
    tradeoffs: z.array(TradeoffSchema).describe("List of key design trade-offs."),
});

// Stage 5: Final Report
export const FinalReportSchema = z.object({
    summary: z.string().describe("Executive summary of the product concept."),
    recommendedNextSteps: z.array(z.string()).describe("Actionable next steps for the innovator."),
});

export type IntakeOutput = z.infer<typeof IntakeOutputSchema>;
export type FunctionalDecomposition = z.infer<typeof FunctionalDecompositionSchema>;
export type MorphologicalChart = z.infer<typeof MorphologicalSchema>;
export type RisksTradeoffs = z.infer<typeof RisksSchema>;
export type FinalReport = z.infer<typeof FinalReportSchema>;
