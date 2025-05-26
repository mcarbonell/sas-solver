"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useTransition } from "react";
import { type EstimateAlgorithmPerformanceInput, type EstimateAlgorithmPerformanceOutput } from "@/ai/flows/estimate-algorithm-performance";
import { runEstimateAlgorithmPerformance } from "./actions";
import { AlertCircle, CheckCircle2, Lightbulb, Cpu } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

const formSchema = z.object({
  algorithmName: z.string().min(2, {
    message: "Algorithm name must be at least 2 characters.",
  }).default("SAS"),
  problemType: z.string().min(2, {
    message: "Problem type must be at least 2 characters.",
  }).default("TSP"),
  datasetDescription: z.string().min(10, {
    message: "Dataset description must be at least 10 characters.",
  }).default("TSPLIB standard instances, e.g., berlin52, eil76."),
  performanceData: z.string().min(20, {
    message: "Performance data must be at least 20 characters.",
  }).default("Example: berlin52 - size 52, time 0.5s, quality 7542; eil76 - size 76, time 1.2s, quality 538"),
  estimationObjective: z.string().min(10, {
    message: "Estimation objective must be at least 10 characters.",
  }).default("Estimate time vs problem size, and approximation ratio vs problem size."),
});

export function EstimationForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<EstimateAlgorithmPerformanceOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      algorithmName: "SAS",
      problemType: "TSP",
      datasetDescription: "TSPLIB standard instances (e.g., berlin52, eil76, a280).",
      performanceData: "Problem, Size, Time(s), Quality (Path Length)\nberlin52, 52, 0.5, 7542\neil76, 76, 1.2, 538\na280, 280, 5.8, 2579",
      estimationObjective: "Estimate functional relationship for Time vs Problem Size, and Solution Quality vs Problem Size.",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      setError(null);
      setResult(null);
      try {
        const estimationInput: EstimateAlgorithmPerformanceInput = values;
        const output = await runEstimateAlgorithmPerformance(estimationInput);
        setResult(output);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      }
    });
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Input Benchmark Data</CardTitle>
          <CardDescription>
            Provide details about the algorithm, problem, dataset, and performance metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="algorithmName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Algorithm Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SAS, Genetic Algorithm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="problemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Problem Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TSP, Knapsack, VRP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="datasetDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dataset Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the dataset used for benchmarking."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="performanceData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Performance Data</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter performance data (e.g., CSV format: problem_size, time, quality)"
                        {...field}
                        rows={6}
                      />
                    </FormControl>
                    <FormDescription>
                      Include problem size, execution time, solution quality, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimationObjective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimation Objective</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Estimate time vs problem size" {...field} />
                    </FormControl>
                    <FormDescription>
                      What performance aspect do you want to estimate?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending} className="w-full text-lg py-6">
                {isPending ? "Estimating..." : "Estimate Performance"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">AI Estimation Results</CardTitle>
          <CardDescription>
            Insights and functional estimations provided by the AI model.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isPending && (
             <div className="flex flex-col items-center justify-center h-64">
                <Cpu className="h-16 w-16 text-primary animate-pulse mb-4" />
                <p className="text-muted-foreground text-lg">AI is processing your data...</p>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {result && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center"><Cpu className="mr-2 h-5 w-5 text-primary" />Estimated Function</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                    <code>{result.estimatedFunction}</code>
                  </pre>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-primary" />Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{result.insights}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center"><CheckCircle2 className="mr-2 h-5 w-5 text-primary" />Confidence Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{result.confidenceLevel}</p>
                </CardContent>
              </Card>
            </div>
          )}
          {!isPending && !result && !error && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <Image 
                  src="https://placehold.co/300x200.png" 
                  alt="AI waiting for input" 
                  width={300} 
                  height={200} 
                  className="rounded-md opacity-50"
                  data-ai-hint="artificial intelligence brain"
                />
                <p className="text-muted-foreground mt-4 text-lg">
                    Submit your data to get AI-powered performance estimations.
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
