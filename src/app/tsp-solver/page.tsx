
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Waypoints, PlayCircle, Settings, Clock, Route, ListTree, CheckCircle, PauseCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface City {
  id: string | number;
  x: number;
  y: number;
}

interface CityPoint { // For worker
  x: number;
  y: number;
}

interface SolverStats {
  iteration: number;
  improvements: number;
  currentK: number;
  bestDistance: number;
  bestPossibleDistance?: number;
}

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
        const id = parts[0]; 
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
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('EOF') || trimmedLine.startsWith('TOUR_SECTION') || trimmedLine.match(/^[A-Z_]+:/i) || trimmedLine === "") continue;
         const parts = trimmedLine.split(/\s+/);
         if (parts.length >= 3) {
            const id = parts[0];
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            if (!isNaN(x) && !isNaN(y)) {
                cities.push({ id, x, y });
            }
         } else if (parts.length === 2) { 
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
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSolverRunning, setIsSolverRunning] = useState(false);
  
  const [cities, setCities] = useState<City[]>([]);
  const [bestRoute, setBestRoute] = useState<number[]>([]);
  const [solverStats, setSolverStats] = useState<SolverStats>({
    iteration: 0,
    improvements: 0,
    currentK: 0,
    bestDistance: Infinity,
  });

  const [maxK, setMaxK] = useState(3);
  const [maxCitiesRegion, setMaxCitiesRegion] = useState(30);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer states
  const solverStartTimeRef = useRef<number>(0); // To store Date.now() when timer starts
  const [currentElapsedTime, setCurrentElapsedTime] = useState<number>(0); // Elapsed time in milliseconds
  const [formattedTime, setFormattedTime] = useState("00:00:00");
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);


  const formatTime = (timeInMillis: number): string => {
    const totalSeconds = Math.floor(timeInMillis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Update formattedTime whenever currentElapsedTime changes
  useEffect(() => {
    setFormattedTime(formatTime(currentElapsedTime));
  }, [currentElapsedTime]);

  const startTimer = () => {
    solverStartTimeRef.current = Date.now();
    setCurrentElapsedTime(0); // Reset for the current run
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (solverStartTimeRef.current > 0) { // Ensure timer was actually started
        setCurrentElapsedTime(Date.now() - solverStartTimeRef.current);
      }
    }, 1000);
  };
  
  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    // Final update to currentElapsedTime to capture the precise moment
    if (solverStartTimeRef.current > 0) {
      setCurrentElapsedTime(Date.now() - solverStartTimeRef.current);
    }
  };

  const resetTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    solverStartTimeRef.current = 0;
    setCurrentElapsedTime(0); // This will trigger useEffect to update formattedTime
  };


  useEffect(() => {
    const loadInstance = async () => {
      setErrorMessage(null);
      setCities([]); 
      setBestRoute([]);
      setSolverStats({ iteration: 0, improvements: 0, currentK: 0, bestDistance: Infinity });
      resetTimer(); // Reset timer when instance changes
      if (workerRef.current) { 
        workerRef.current.terminate();
        workerRef.current = null;
        setIsSolverRunning(false);
      }

      if (selectedInstance && selectedInstance !== "custom") {
        setIsLoadingData(true); 
        try {
          const response = await fetch(`/api/tsp-instance?name=${selectedInstance}`);
          if (!response.ok) {
             const errorData = await response.json().catch(() => ({error: `Failed to fetch TSP instance: ${selectedInstance} (status: ${response.status})`}));
            throw new Error(errorData.error || `Failed to fetch TSP instance: ${selectedInstance} (status: ${response.status})`);
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
          setIsLoadingData(false);
        }
      } else if (selectedInstance === "custom" && customInstanceData) {
        setIsLoadingData(true);
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
          setIsLoadingData(false);
        }
      } else {
        setIsLoadingData(false);
      }
    };
    loadInstance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstance, customInstanceData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (cities.length === 0) {
      return; 
    }

    const padding = 20;
    const drawableWidth = canvas.width - 2 * padding;
    const drawableHeight = canvas.height - 2 * padding;

    const cityCoords = cities.map(c => ({ x: c.x, y: c.y }));

    let minX = Math.min(...cityCoords.map(p => p.x));
    let maxX = Math.max(...cityCoords.map(p => p.x));
    let minY = Math.min(...cityCoords.map(p => p.y));
    let maxY = Math.max(...cityCoords.map(p => p.y));

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

    function getCanvasCoords(city: City | CityPoint) {
        let canvasX = padding + (city.x - minX) * scale;
        let canvasY = canvas!.height - padding - (city.y - minY) * scale;
        if (rangeX === 0) canvasX = canvas!.width / 2;
        if (rangeY === 0) canvasY = canvas!.height / 2;
        return { x: canvasX, y: canvasY };
    }
    
    ctx.fillStyle = 'hsl(var(--primary))'; 
    cities.forEach((city) => {
      const { x: canvasX, y: canvasY } = getCanvasCoords(city);
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    if (bestRoute.length > 0 && cities.length > 0) {
        ctx.beginPath();
        const startPoint = getCanvasCoords(cities[bestRoute[0]]);
        ctx.moveTo(startPoint.x, startPoint.y);
        for (let i = 1; i < bestRoute.length; i++) {
            const point = getCanvasCoords(cities[bestRoute[i]]);
            ctx.lineTo(point.x, point.y);
        }
        ctx.lineTo(startPoint.x, startPoint.y); 
        ctx.strokeStyle = 'hsl(var(--accent))';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

  }, [cities, bestRoute]); 

  const handleRunSolver = () => {
    if (isSolverRunning || cities.length === 0) return;

    setIsSolverRunning(true);
    setErrorMessage(null);
    setBestRoute([]); 
    setSolverStats({ iteration: 0, improvements: 0, currentK: 0, bestDistance: Infinity });
    startTimer();


    if (workerRef.current) {
        workerRef.current.terminate();
    }
    
    workerRef.current = new Worker('/solve-worker.js'); 

    workerRef.current.onmessage = (e) => {
      const { type, iteration, improvements, bestDistance, currentK, route, distance } = e.data;
      
      if (type === 'stats' || type === 'improvement' || type === 'solution') {
        setSolverStats(prevStats => ({
          ...prevStats,
          iteration: iteration !== undefined ? iteration : prevStats.iteration,
          improvements: improvements !== undefined ? improvements : prevStats.improvements,
          currentK: currentK !== undefined ? currentK : prevStats.currentK,
          bestDistance: distance !== undefined ? distance : (bestDistance !== undefined ? bestDistance : prevStats.bestDistance)
        }));

        if (route) {
          setBestRoute(route);
        }
      }
      
      if (type === 'solution') {
        console.log("Solver finished", e.data);
        setIsSolverRunning(false);
        stopTimer();
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      }
    };

    workerRef.current.onerror = (error) => {
      console.error("Worker error:", error);
      setErrorMessage("An error occurred in the solver worker.");
      setIsSolverRunning(false);
      stopTimer();
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
    
    const citiesForWorker: CityPoint[] = cities.map(c => ({ x: c.x, y: c.y }));

    workerRef.current.postMessage({
      type: 'start',
      cities: citiesForWorker,
      id: 'GLOBAL', 
      maxK: maxK,
      debug: false 
    });
  };

  const handleStopSolver = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' }); 
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsSolverRunning(false);
    stopTimer();
  };
  
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);


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
              <Select value={selectedInstance} onValueChange={setSelectedInstance} disabled={isSolverRunning || isLoadingData}>
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
                <Label htmlFor="custom-data" className="text-base">Custom Instance Data (TSPLIB format)</Label>
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
                  disabled={isSolverRunning || isLoadingData}
                />
              </div>
            )}

            <div>
              <Label htmlFor="maxK" className="text-base">Max K (Systematic Alternatives)</Label>
              <Input id="maxK" type="number" value={maxK} onChange={e => setMaxK(parseInt(e.target.value,10) || 0)} placeholder="e.g., 3" disabled={isSolverRunning}/>
            </div>
             <div>
              <Label htmlFor="maxCitiesRegion" className="text-base">Max Cities Per Region (Parallel)</Label>
              <Input id="maxCitiesRegion" type="number" value={maxCitiesRegion} onChange={e => setMaxCitiesRegion(parseInt(e.target.value,10) || 0)} placeholder="e.g., 30" disabled={isSolverRunning} title="For future parallel implementation"/>
            </div>


            <Button 
              onClick={isSolverRunning ? handleStopSolver : handleRunSolver} 
              disabled={isLoadingData || (!selectedInstance && !customInstanceData) || (selectedInstance === "custom" && !customInstanceData.trim()) || (cities.length === 0 && !isLoadingData)} 
              className="w-full text-lg py-6"
            >
              {isSolverRunning ? <PauseCircle className="mr-2 h-6 w-6" /> : <PlayCircle className="mr-2 h-6 w-6" />}
              {isLoadingData ? "Loading Data..." : isSolverRunning ? "Stop Solver" : "Run SAS Solver"}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="shadow-lg min-h-[500px]">
            <CardHeader>
              <CardTitle className="text-2xl">Solution Visualization & Results</CardTitle>
              <CardDescription>
                {solverStats.bestDistance !== Infinity ? `Best path length: ${solverStats.bestDistance.toFixed(2)}` : cities.length > 0 ? "TSP instance cities. Ready to solve." : "Awaiting data or selection."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorMessage && (
                <div className="text-red-500 p-4 border border-red-500 rounded-md bg-destructive/10 mb-4">
                  <p><strong>Error:</strong> {errorMessage}</p>
                </div>
              )}
              {(isLoadingData) && ( 
                <div className="flex flex-col items-center justify-center h-64">
                  <Waypoints className="h-16 w-16 text-primary animate-pulse mb-4" />
                  <p className="text-muted-foreground text-lg">Loading instance data...</p>
                </div>
              )}
              {(!isLoadingData || cities.length > 0) && !errorMessage && (
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="rounded-lg border shadow-md bg-card mb-4" 
                  data-ai-hint="map path points"
                />
              )}
              {!isLoadingData && cities.length === 0 && !selectedInstance && !customInstanceData && !errorMessage && (
                 <div className="flex flex-col items-center justify-center h-64 text-center">
                   <Waypoints className="h-24 w-24 text-muted opacity-30 mb-4" />
                   <p className="text-muted-foreground mt-4 text-lg">
                     Select a TSP instance or provide custom data to visualize.
                   </p>
                 </div>
              )}
              
              { (cities.length > 0 || solverStats.iteration > 0 || isSolverRunning) &&
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Iterations</CardTitle>
                      <ListTree className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">{solverStats.iteration.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Improvements</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">{solverStats.improvements.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                   <Card className="bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Current K</CardTitle>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">{solverStats.currentK}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Elapsed Time</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">{formattedTime}</div>
                    </CardContent>
                  </Card>
                  <Card className="col-span-2 md:col-span-2 bg-muted/30"> 
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Best Path Length</CardTitle>
                      <Route className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">{solverStats.bestDistance === Infinity ? "N/A" : solverStats.bestDistance.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                </div>
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

