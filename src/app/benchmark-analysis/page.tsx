"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart3, PlayCircle, Activity, TrendingUp } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

// Mock data for charts
const mockComputationTimeData = [
  { name: 'Berlin52', SAS: 0.5, 'Greedy': 0.1, '2-Opt': 0.3 },
  { name: 'Eil76', SAS: 1.2, 'Greedy': 0.2, '2-Opt': 0.8 },
  { name: 'A280', SAS: 5.8, 'Greedy': 1.0, '2-Opt': 4.5 },
  { name: 'KroA100', SAS: 2.1, 'Greedy': 0.3, '2-Opt': 1.5 },
  { name: 'D198', SAS: 4.0, 'Greedy': 0.7, '2-Opt': 3.0 },
];

const mockSolutionQualityData = [
  { size: 52, qualitySAS: 1.02, qualityHeuristic: 1.10 }, // quality = found / optimal
  { size: 76, qualitySAS: 1.03, qualityHeuristic: 1.12 },
  { size: 100, qualitySAS: 1.01, qualityHeuristic: 1.08 },
  { size: 198, qualitySAS: 1.04, qualityHeuristic: 1.15 },
  { size: 280, qualitySAS: 1.05, qualityHeuristic: 1.18 },
];

const chartConfig = {
  SAS: { label: "SAS", color: "hsl(var(--chart-1))" },
  Greedy: { label: "Greedy", color: "hsl(var(--chart-2))" },
  "2-Opt": { label: "2-Opt", color: "hsl(var(--chart-3))" },
  qualitySAS: { label: "SAS Quality", color: "hsl(var(--chart-1))" },
  qualityHeuristic: { label: "Std. Heuristic Quality", color: "hsl(var(--chart-2))" },
};


export default function BenchmarkAnalysisPage() {
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkComplete, setBenchmarkComplete] = useState(false);

  const handleRunBenchmarks = () => {
    setIsBenchmarking(true);
    setBenchmarkComplete(false);
    // Simulate benchmark running
    setTimeout(() => {
      setIsBenchmarking(false);
      setBenchmarkComplete(true);
    }, 3000);
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-12">
        <div className="flex items-center mb-4">
          <BarChart3 className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-4xl font-bold tracking-tight">
            Benchmark Analysis
          </h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Analyze the performance of the SAS algorithm through automated testing and data visualization.
        </p>
      </header>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Run Benchmarks</CardTitle>
          <CardDescription>
            Execute a suite of tests on various problem instances to collect performance data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRunBenchmarks} disabled={isBenchmarking} size="lg" className="text-lg py-6">
            <PlayCircle className="mr-2 h-6 w-6" />
            {isBenchmarking ? "Running Benchmarks..." : "Start Benchmark Suite"}
          </Button>
        </CardContent>
      </Card>

      {isBenchmarking && (
        <div className="flex flex-col items-center justify-center my-12">
          <Activity className="h-16 w-16 text-primary animate-pulse mb-4" />
          <p className="text-muted-foreground text-lg">Benchmarks in progress, please wait...</p>
        </div>
      )}

      {!isBenchmarking && !benchmarkComplete && (
         <div className="text-center py-12">
            <Image 
              src="https://placehold.co/400x300.png" 
              alt="Awaiting benchmark results" 
              width={400} 
              height={300} 
              className="mx-auto rounded-lg mb-6 shadow-md opacity-60"
              data-ai-hint="chart graph"
            />
            <p className="text-xl text-muted-foreground">
              Click "Start Benchmark Suite" to generate and view performance data.
            </p>
          </div>
      )}

      {benchmarkComplete && (
        <div className="space-y-12">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Computation Time Comparison (seconds)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockComputationTimeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="SAS" fill="var(--color-SAS)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Greedy" fill="var(--color-Greedy)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="2-Opt" fill="var(--color-2-Opt)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Solution Quality (Approximation Ratio)</CardTitle>
              <CardDescription>Lower values are better (closer to optimal).</CardDescription>
            </CardHeader>
            <CardContent>
               <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="size" name="Problem Size" unit="" />
                    <YAxis type="number" dataKey="qualitySAS" name="Approximation Ratio" unit="" domain={['dataMin - 0.01', 'dataMax + 0.01']}/>
                    <ZAxis type="number" range={[60, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent />}/>
                    <Legend />
                    <Scatter name="SAS" data={mockSolutionQualityData} fill="var(--color-qualitySAS)" />
                    <Scatter name="Std. Heuristic" data={mockSolutionQualityData.map(d => ({...d, qualityHeuristic: d.qualityHeuristic}))} 
                             yAxisId={0} dataKey="qualityHeuristic" fill="var(--color-qualityHeuristic)" />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-primary"/>Key Metrics Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-card">
                    <h4 className="text-sm font-medium text-muted-foreground">Avg. SAS Speedup vs 2-Opt</h4>
                    <p className="text-2xl font-bold text-primary">1.5x</p>
                </div>
                <div className="p-4 border rounded-lg bg-card">
                    <h4 className="text-sm font-medium text-muted-foreground">Avg. SAS Quality Improvement</h4>
                    <p className="text-2xl font-bold text-primary">8%</p>
                </div>
                <div className="p-4 border rounded-lg bg-card">
                    <h4 className="text-sm font-medium text-muted-foreground">Optimal Found (Berlin52)</h4>
                    <p className="text-2xl font-bold text-primary">Yes</p>
                </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
