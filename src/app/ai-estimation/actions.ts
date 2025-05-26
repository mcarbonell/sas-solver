"use server";

import { estimateAlgorithmPerformance, type EstimateAlgorithmPerformanceInput, type EstimateAlgorithmPerformanceOutput } from "@/ai/flows/estimate-algorithm-performance";

export async function runEstimateAlgorithmPerformance(
  input: EstimateAlgorithmPerformanceInput
): Promise<EstimateAlgorithmPerformanceOutput> {
  try {
    const result = await estimateAlgorithmPerformance(input);
    return result;
  } catch (error) {
    console.error("Error calling estimateAlgorithmPerformance flow:", error);
    // It's good practice to throw a more generic error or a custom one
    // to avoid leaking sensitive details to the client.
    throw new Error("Failed to get estimation from AI service. Please check the input data or try again later.");
  }
}
