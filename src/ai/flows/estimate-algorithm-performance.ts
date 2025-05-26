// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Estimates algorithm performance based on benchmark data using GenAI.
 *
 * - estimateAlgorithmPerformance - Estimates performance functions based on input data.
 * - EstimateAlgorithmPerformanceInput - The input type for the estimateAlgorithmPerformance function.
 * - EstimateAlgorithmPerformanceOutput - The return type for the estimateAlgorithmPerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateAlgorithmPerformanceInputSchema = z.object({
  algorithmName: z.string().describe('The name of the algorithm being analyzed.'),
  problemType: z.string().describe('The type of problem the algorithm solves (e.g., TSP, Knapsack).'),
  datasetDescription: z.string().describe('A description of the dataset used for benchmarking.'),
  performanceData: z
    .string()
    .describe(
      'Performance data from algorithm benchmarks, including problem size, execution time, and solution quality. Should be formatted as a string.'
    ),
  estimationObjective: z
    .string()
    .describe(
      'The objective of the estimation, e.g., estimate time vs problem size, or approximation ratio vs configuration.'
    ),
});

export type EstimateAlgorithmPerformanceInput = z.infer<typeof EstimateAlgorithmPerformanceInputSchema>;

const EstimateAlgorithmPerformanceOutputSchema = z.object({
  estimatedFunction: z
    .string()
    .describe(
      'An estimation of the performance function, described as a mathematical expression or code snippet.'
    ),
  insights: z.string().describe('Key insights about the algorithm performance based on the data.'),
  confidenceLevel: z
    .string()
    .describe('A qualitative assessment of the confidence level in the estimated function.'),
});

export type EstimateAlgorithmPerformanceOutput = z.infer<typeof EstimateAlgorithmPerformanceOutputSchema>;

export async function estimateAlgorithmPerformance(
  input: EstimateAlgorithmPerformanceInput
): Promise<EstimateAlgorithmPerformanceOutput> {
  return estimateAlgorithmPerformanceFlow(input);
}

const estimateAlgorithmPerformancePrompt = ai.definePrompt({
  name: 'estimateAlgorithmPerformancePrompt',
  input: {schema: EstimateAlgorithmPerformanceInputSchema},
  output: {schema: EstimateAlgorithmPerformanceOutputSchema},
  prompt: `You are an expert data scientist specializing in algorithm performance analysis.

You will analyze performance data from algorithm benchmarks to estimate performance functions.

Here's the information about the algorithm and the benchmarks:

Algorithm Name: {{{algorithmName}}}
Problem Type: {{{problemType}}}
Dataset Description: {{{datasetDescription}}}
Performance Data: {{{performanceData}}}
Estimation Objective: {{{estimationObjective}}}

Based on this data, estimate the performance function, provide key insights, and assess the confidence level.
`,
});

const estimateAlgorithmPerformanceFlow = ai.defineFlow(
  {
    name: 'estimateAlgorithmPerformanceFlow',
    inputSchema: EstimateAlgorithmPerformanceInputSchema,
    outputSchema: EstimateAlgorithmPerformanceOutputSchema,
  },
  async input => {
    const {output} = await estimateAlgorithmPerformancePrompt(input);
    return output!;
  }
);
