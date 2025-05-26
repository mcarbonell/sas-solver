
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Waypoints, PlayCircle, Settings, Clock, Route } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface City {
  id: string | number;
  x: number;
  y: number;
}

// TSP instances for the dropdown, names include .tsp extension for fetching
const tspInstances = [
  { id: "att48.tsp", name: "att48.tsp (48 cities)" },
  { id: "berlin52.tsp", name: "berlin52.tsp (52 cities)" },
  { id: "eil51.tsp", name: "eil51.tsp (51 cities)" },
  { id: "eil76.tsp", name: "eil76.tsp (76 cities)" },
  { id: "kroA100.tsp", name: "kroA100.tsp (100 cities)" },
  { id: "lin105.tsp", name: "lin105.tsp (105 cities)" },
  { id: "pr76.tsp", name: "pr76.tsp (76 cities)" },
  { id: "st70.tsp", name: "st70.tsp (70 cities)" },
  { id: "a280.tsp", name: "a280.tsp (280 cities)" },
  { id: "custom", name: "Custom Input" },
];

// Function to parse TSPLIB text data
function parseTSPLIB(textData: string, instanceName: string): City[] {
  const lines = textData.split('\n');
  const cities: City[] = [];
  let readingCoords = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('EOF') || trimmedLine.startsWith('TOUR_SECTION')) break;

    if (readingCoords) {
      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 3) {
        const id = parts[0]; // Keep as string or number based on input
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        if (!isNaN(x) && !isNaN(y)) {
          cities.push({ id, x, y });
        }
      }
    } else {
      if (trimmedLine.startsWith('NODE_COORD_SECTION') || trimmedLine.startsWith('DISPLAY_DATA_SECTION')) {
        readingCoords = true;
      }
    }
  }
  if (cities.length === 0 && readingCoords === false && instanceName !== "Custom Input") {
      // Fallback for files that might just list coordinates without a section header
      // This is a simplified parser, production use might need more robust TSPLIB parsing
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('EOF') || trimmedLine.startsWith('TOUR_SECTION') || trimmedLine.match(/^[A-Z_]+:/i)) continue; // Skip headers or specific sections
         const parts = trimmedLine.split(/\s+/);
         if (parts.length >= 3) {
            const id = parts[0];
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            if (!isNaN(x) && !isNaN(y)) {
                cities.push({ id, x, y });
            }
         } else if (parts.length === 2) { // Sometimes ID is implicit
            const x = parseFloat(parts[0]);
            const y = parseFloat(parts[1]);
            if (!isNaN(x) && !isNaN(y)) {
                cities.push({ id: cities.length + 1, x, y });
            }
         }
      }
  }
  return cities;
}


export default function TspSolverPage() {
  const [selectedInstance, setSelectedInstance] = useState<string | undefined>(undefined);
  const [customInstanceData, setCustomInstanceData] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{ time: string; pathLength: number; pathImage?: string } | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadInstance = async () => {
      setErrorMessage(null);
      if (selectedInstance && selectedInstance !== "custom") {
        setIsRunning(true); // Indicate loading
        try {
          const response = await fetch(`/k-search/tsplib/${selectedInstance}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch TSP instance: ${selectedInstance} (status: ${response.status})`);
          }
          const text = await response.text();
          const parsedCities = parseTSPLIB(text, selectedInstance);
          if (parsedCities.length === 0) {
            throw new Error(`No coordinates found in ${selectedInstance}. Check file format or NODE_COORD_SECTION.`);
          }
          setCities(parsedCities);
        } catch (error: any) {
          console.error("Error loading TSP instance:", error);
          setCities([]);
          setErrorMessage(error.message || "Could not load or parse TSP file.");
        } finally {
          setIsRunning(false);
        }
      } else if (selectedInstance === "custom" && customInstanceData) {
        setIsRunning(true);
        try {
          const parsedCities = parseTSPLIB(customInstanceData, "Custom Input");
           if (parsedCities.length === 0 && customInstanceData.trim() !== "") {
            throw new Error(`No coordinates found in custom data. Ensure data is in a recognized TSPLIB format.`);
          }
          setCities(parsedCities);
        } catch (error: any) {
          console.error("Error parsing custom TSP data:", error);
          setCities([]);
          setErrorMessage(error.message || "Could not parse custom TSP data.");
        } finally {
          setIsRunning(false);
        }
      } else {
        setCities([]); // Clear cities if no instance or custom data
      }
    };
    loadInstance();
  }, [selectedInstance, customInstanceData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (cities.length === 0) {
      return; // Don't draw if no cities
    }

    const padding = 20;
    const drawableWidth = canvas.width - 2 * padding;
    const drawableHeight = canvas.height - 2 * padding;

    const cityCoords = cities.map(c => ({ x: c.x, y: c.y }));

    let minX = Math.min(...cityCoords.map(p => p.x));
    let maxX = Math.max(...cityCoords.map(p => p.x));
    let minY = Math.min(...cityCoords.map(p => p.y));
    let maxY = Math.max(...cityCoords.map(p => p.y));

    // Handle case of single city to prevent division by zero
    if (cities.length === 1) {
      minX -= 1; maxX += 1;
      minY -= 1; maxY += 1;
    }
    
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    
    const effectiveRangeX = rangeX === 0 ? 1 : rangeX;
    const effectiveRangeY = rangeY === 0 ? 1 : rangeY;

    const scaleX = drawableWidth / effectiveRangeX;
    const scaleY = drawableHeight / effectiveRangeY;
    const scale = Math.min(scaleX, scaleY);

    ctx.fillStyle = 'hsl(var(--primary))'; // Use themed color

    cities.forEach((city) => {
      let canvasX = padding + (city.x - minX) * scale;
      // TSPLIB Y often assumes origin at bottom-left, canvas is top-left
      let canvasY = canvas.height - padding - (city.y - minY) * scale;

       // If all points are on a line (or single point), center them within the drawing area
      if (rangeX === 0) canvasX = canvas.width / 2;
      if (rangeY === 0) canvasY = canvas.height / 2;

      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

  }, [cities]); // Redraw when cities data changes

  const handleRunSolver = () => {
    // Solver logic will be implemented in a future step
    setIsRunning(true);
    setResults(null);
    setTimeout(() => {
      setIsRunning(false);
      setResults({
        time: (Math.random() * 10 + 1).toFixed(2) + "s",
        pathLength: Math.floor(Math.random() * 500 + 200),
        // pathImage will be replaced by drawing on canvas
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
                  placeholder="Paste your TSPLIB data here... e.g.,
NODE_COORD_SECTION
1 10 20
2 30 40
3 50 15
EOF"
                  value={customInstanceData}
                  onChange={(e) => setCustomInstanceData(e.target.value)}
                  rows={8}
                />
              </div>
            )}

            <div>
              <Label htmlFor="iterations" className="text-base">Max K (Systematic Alternatives)</Label>
              <Input id="iterations" type="number" defaultValue={3} placeholder="e.g., 3" />
            </div>
             <div>
              <Label htmlFor="maxCitiesRegion" className="text-base">Max Cities Per Region (Parallel)</Label>
              <Input id="maxCitiesRegion" type="number" defaultValue={30} placeholder="e.g., 30" />
            </div>


            <Button onClick={handleRunSolver} disabled={isRunning || (!selectedInstance && !customInstanceData) || (selectedInstance === "custom" && !customInstanceData) } className="w-full text-lg py-6">
              <PlayCircle className="mr-2 h-6 w-6" />
              {isRunning && cities.length === 0 ? "Loading Data..." : isRunning ? "Running Solver..." : "Run SAS Solver"}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="shadow-lg min-h-[400px]">
            <CardHeader>
              <CardTitle className="text-2xl">Solution Visualization & Results</CardTitle>
              <CardDescription>
                {results ? "The optimal path found by SAS and performance metrics." : "TSP instance visualization."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorMessage && (
                <div className="text-red-500 p-4 border border-red-500 rounded-md">
                  <p><strong>Error:</strong> {errorMessage}</p>
                </div>
              )}
              {(isRunning && cities.length === 0 && !errorMessage) && ( // Loading state
                <div className="flex flex-col items-center justify-center h-64">
                  <PlayCircle className="h-16 w-16 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground text-lg">Loading instance data...</p>
                </div>
              )}
              {(!isRunning || cities.length > 0) && !errorMessage && (
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="rounded-lg border shadow-md bg-card" // Added bg-card for better visibility if no drawing
                  data-ai-hint="map path points"
                />
              )}
              {!isRunning && cities.length === 0 && !selectedInstance && !customInstanceData && !errorMessage && (
                 <div className="flex flex-col items-center justify-center h-64 text-center">
                   <Waypoints className="h-24 w-24 text-muted opacity-30 mb-4" />
                   <p className="text-muted-foreground mt-4 text-lg">
                     Select a TSP instance or provide custom data to visualize.
                   </p>
                 </div>
              )}
              
              {results && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    