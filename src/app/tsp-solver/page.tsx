"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Waypoints, PlayCircle, Settings, Clock, Route } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// Mock TSP instances for the dropdown
const tspInstances = [
  { id: "berlin52", name: "Berlin52 (TSPLIB)" },
  { id: "eil76", name: "Eil76 (TSPLIB)" },
  { id: "a280", name: "A280 (TSPLIB)" },
  { id: "custom", name: "Custom Input" },
];

export default function TspSolverPage() {
  const [selectedInstance, setSelectedInstance] = useState<string | undefined>(undefined);
  const [customInstanceData, setCustomInstanceData] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{ time: string; pathLength: number; pathImage: string } | null>(null);

  const handleRunSolver = () => {
    setIsRunning(true);
    setResults(null);
    // Simulate solver running
    setTimeout(() => {
      setIsRunning(false);
      // Mock results
      setResults({
        time: (Math.random() * 10 + 1).toFixed(2) + "s",
        pathLength: Math.floor(Math.random() * 500 + 200),
        pathImage: "https://placehold.co/600x400.png?text=TSP+Solution+Path",
      });
    }, 2000);
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-12">
        <div className="flex items-center mb-4">
          <Waypoints className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-4xl font-bold tracking-tight">
            Traveling Salesman Problem (TSP) Solver
          </h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Run the SAS algorithm on TSP instances and visualize the solution.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center"><Settings className="mr-2 h-6 w-6 text-primary"/>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="tsp-instance" className="text-base">TSP Instance</Label>
              <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                <SelectTrigger id="tsp-instance">
                  <SelectValue placeholder="Select an instance" />
                </SelectTrigger>
                <SelectContent>
                  {tspInstances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedInstance === "custom" && (
              <div>
                <Label htmlFor="custom-data" className="text-base">Custom Instance Data (e.g., TSPLIB format)</Label>
                <Textarea
                  id="custom-data"
                  placeholder="Paste your TSPLIB data here..."
                  value={customInstanceData}
                  onChange={(e) => setCustomInstanceData(e.target.value)}
                  rows={8}
                />
              </div>
            )}

            <div>
              <Label htmlFor="iterations" className="text-base">Max Iterations</Label>
              <Input id="iterations" type="number" defaultValue={1000} placeholder="e.g., 1000" />
            </div>

            <div>
              <Label htmlFor="alpha" className="text-base">Learning Rate (Alpha)</Label>
              <Input id="alpha" type="number" step="0.01" defaultValue={0.1} placeholder="e.g., 0.1" />
            </div>
            
            <div>
              <Label htmlFor="beta" className="text-base">Exploration Factor (Beta)</Label>
              <Input id="beta" type="number" step="0.01" defaultValue={0.5} placeholder="e.g., 0.5" />
            </div>

            <Button onClick={handleRunSolver} disabled={isRunning} className="w-full text-lg py-6">
              <PlayCircle className="mr-2 h-6 w-6" />
              {isRunning ? "Running Solver..." : "Run SAS Solver"}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="shadow-lg min-h-[400px]">
            <CardHeader>
              <CardTitle className="text-2xl">Solution Visualization & Results</CardTitle>
              <CardDescription>
                The optimal path found by SAS and performance metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRunning && (
                <div className="flex flex-col items-center justify-center h-64">
                  <PlayCircle className="h-16 w-16 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground text-lg">Calculating optimal path...</p>
                </div>
              )}
              {!isRunning && !results && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                   <Image 
                    src="https://placehold.co/300x200.png" 
                    alt="Waiting for TSP solution" 
                    width={300} 
                    height={200} 
                    className="rounded-md opacity-50"
                    data-ai-hint="map path"
                  />
                  <p className="text-muted-foreground mt-4 text-lg">
                    Configure parameters and run the solver to see results.
                  </p>
                </div>
              )}
              {results && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Solution Path</h3>
                    <Image
                      src={results.pathImage}
                      alt="TSP Solution Path"
                      width={600}
                      height={400}
                      className="rounded-lg border shadow-md object-cover w-full"
                      data-ai-hint="map path"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Computation Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{results.time}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Path Length</CardTitle>
                        <Route className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{results.pathLength.toLocaleString()} units</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
