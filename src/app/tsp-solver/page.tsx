
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Waypoints, PlayCircle, Settings, Clock, Route, ListTree, CheckCircle, PauseCircle, Target, Percent, BarChartBig, Activity, FileCog, Timer, BarChart as BarChartIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";


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
  currentCityIndexInLoop?: number;
  totalCitiesInLoop?: number;
  improvedInRound?: boolean;
}

interface BatchRunResult {
  runNumber: number;
  distance: number;
  time: number; // in milliseconds
  iterations: number;
  improvements: number;
  k: number;
}

interface AggregatedBatchStats {
  numberOfRuns: number;
  minDistance: number;
  maxDistance: number;
  avgDistance: number;
  avgTimePerRun: number; // in milliseconds
  totalBatchTime: number; // in milliseconds
  totalTimesOptimalFound: number;
  avgApproximationRatio: number | null;
  probOptimalInTenRuns: number | null;
  probOptimalInNRuns: number | null;
  numberOfCitiesInBatch: number | null;
}

interface HistogramBin {
  range: string;
  count: number;
}


const tspInstances = [
  { id: "att48.tsp", name: "att48.tsp (48 cities)" },
  { id: "berlin52.tsp", name: "berlin52.tsp (52 cities)" },
  { id: "eil51.tsp", name: "eil51.tsp (51 cities)" },
  { id: "st70.tsp", name: "st70.tsp (70 cities)" },
  { id: "pr76.tsp", name: "pr76.tsp (76 cities)" },
  { id: "eil76.tsp", name: "eil76.tsp (76 cities)" },
  { id: "kroA100.tsp", name: "kroA100.tsp (100 cities)" },
  { id: "eil101.tsp", name: "eil101.tsp (101 cities)" },
  { id: "lin105.tsp", name: "lin105.tsp (105 cities)" },
  { id: "ch130.tsp", name: "ch130.tsp (130 cities)" },
  { id: "ch150.tsp", name: "ch150.tsp (150 cities)" },
  { id: "d198.tsp", name: "d198.tsp (198 cities)" },
  { id: "kroA200.tsp", name: "kroA200.tsp (200 cities)" },
  { id: "a280.tsp", name: "a280.tsp (280 cities)" },
  { id: "fl417.tsp", name: "fl417.tsp (417 cities)" },
  { id: "pr439.tsp", name: "pr439.tsp (439 cities)" },
  { id: "pcb442.tsp", name: "pcb442.tsp (442 cities)" },
  { id: "gr431.tsp", name: "gr431.tsp (431 cities)" },
  { id: "d493.tsp", name: "d493.tsp (493 cities)" },
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
  if (cities.length === 0 && readingCoords === false && instanceName !== "Custom Input" && !instanceName.startsWith("Optimal solutions")) {
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
         } else if (parts.length === 2) { // Fallback for simple X Y format
            const x = parseFloat(parts[0]);
            const y = parseFloat(parts[1]);
            if (!isNaN(x) && !isNaN(y)) {
                cities.push({ id: (cities.length + 1).toString(), x, y }); // Assign a sequential ID
            }
         }
      }
  }
  return cities;
}


export default function TspSolverPage() {
  const [selectedInstance, setSelectedInstance] = useState<string | undefined>("berlin52.tsp");
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
    currentCityIndexInLoop: undefined,
    totalCitiesInLoop: undefined,
    improvedInRound: false,
  });

  const [maxK, setMaxK] = useState(3);
  const [maxCitiesRegion, setMaxCitiesRegion] = useState(30);
  const [isDebugMode, setIsDebugMode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const solverStartTimeRef = useRef<number>(0); // For main timer display
  const [currentElapsedTime, setCurrentElapsedTime] = useState<number>(0); // For main timer display (numeric ms)
  const [formattedTime, setFormattedTime] = useState("00:00:00"); // For main timer display (string)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [optimalSolutionsData, setOptimalSolutionsData] = useState<Record<string, number> | null>(null);
  const [currentOptimalDistance, setCurrentOptimalDistance] = useState<number | null>(null);

  // Batch execution states
  const [numberOfRuns, setNumberOfRuns] = useState(10);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const isBatchRunIntentActiveRef = useRef(false);
  const [currentBatchRunNumber, setCurrentBatchRunNumber] = useState(0);
  const [batchRunResults, setBatchRunResults] = useState<BatchRunResult[]>([]);
  const [aggregatedBatchStats, setAggregatedBatchStats] = useState<AggregatedBatchStats | null>(null);
  const [batchInstanceName, setBatchInstanceName] = useState<string | null>(null);
  const [batchEtrFormatted, setBatchEtrFormatted] = useState<string>("");
  const [batchMaxKUsed, setBatchMaxKUsed] = useState<number | null>(null);
  const [histogramData, setHistogramData] = useState<HistogramBin[] | null>(null);


  useEffect(() => {
    const fetchOptimalSolutions = async () => {
      try {
        const response = await fetch('/api/optimal-solutions');
        if (!response.ok) {
          throw new Error('Failed to fetch optimal solutions');
        }
        const data = await response.json();
        setOptimalSolutionsData(data);
      } catch (error) {
        console.error("Error fetching optimal solutions:", error);
        setOptimalSolutionsData({}); // Set to empty object on error to avoid null checks everywhere
      }
    };
    fetchOptimalSolutions();
  }, []);

  const formatTime = (timeInMillis: number): string => {
    if (timeInMillis < 0) timeInMillis = 0;
    const totalSeconds = Math.floor(timeInMillis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Effect for main timer display
  useEffect(() => {
    setFormattedTime(formatTime(currentElapsedTime));
  }, [currentElapsedTime]);

  const startTimer = () => {
    solverStartTimeRef.current = Date.now(); // Record start time for THIS timer instance
    setCurrentElapsedTime(0); // Reset numeric elapsed time
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (solverStartTimeRef.current > 0) { // Check if this timer instance is active
        setCurrentElapsedTime(Date.now() - solverStartTimeRef.current);
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if(solverStartTimeRef.current > 0){ // If timer was started
        const finalElapsedTime = Date.now() - solverStartTimeRef.current;
        setCurrentElapsedTime(finalElapsedTime); // Set final numeric elapsed time
    }
  };
  
  const resetSolverState = (fullResetForNewInstance = false) => {
    setSolverStats({
        iteration: 0,
        improvements: 0,
        currentK: 0,
        bestDistance: Infinity,
        currentCityIndexInLoop: undefined,
        totalCitiesInLoop: undefined,
        improvedInRound: false,
    });
    setBestRoute([]);

    if (fullResetForNewInstance) {
      if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
      }
      setCurrentElapsedTime(0); // Reset numeric time
      solverStartTimeRef.current = 0; // Ensure timer is marked as not running
    }
  };

  // Effect for loading instance data
  useEffect(() => {
    const loadInstanceData = async () => {
      if (!selectedInstance) {
        setCities([]);
        resetSolverState(true);
        setErrorMessage(null);
        return;
      }
  
      // If a worker exists AND we are NOT in an active batch run intent, terminate it.
      if (workerRef.current && !isBatchRunIntentActiveRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
  
      // If we are NOT in an active batch run intent, reset solver and batch states.
      if (!isBatchRunIntentActiveRef.current) {
          setIsSolverRunning(false);
          setIsBatchRunning(false); // Reset batch running state as well
          setBatchEtrFormatted(""); // Clear ETR
      }
      
      resetSolverState(true); // Always reset solver state including timer for new instance
      setErrorMessage(null);
  
      let newCities: City[] = [];
      let errorMsg: string | null = null;
  
      if (selectedInstance && selectedInstance !== "custom") {
        setIsLoadingData(true);
        try {
          const response = await fetch(`/api/tsp-instance?name=${selectedInstance}`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Failed to fetch TSP instance: ${selectedInstance} (status: ${response.status})` }));
            throw new Error(errorData.error || `Failed to fetch TSP instance: ${selectedInstance} (status: ${response.status})`);
          }
          const text = await response.text();
          const parsedCities = parseTSPLIB(text, selectedInstance);
          if (parsedCities.length === 0) {
            throw new Error(`No coordinates found in ${selectedInstance}. Check file format or NODE_COORD_SECTION.`);
          }
          newCities = parsedCities;
        } catch (error: any) {
          console.error("Error loading TSP instance:", error);
          errorMsg = error.message || "Could not load or parse TSP file.";
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
          newCities = parsedCities;
        } catch (error: any) {
          console.error("Error parsing custom TSP data:", error);
          errorMsg = error.message || "Could not parse custom TSP data.";
        } finally {
          setIsLoadingData(false);
        }
      } else {
         newCities = []; // For the "Select an instance" case or empty custom data
      }
      setCities(newCities);
      setSolverStats(prev => ({...prev, totalCitiesInLoop: newCities.length}));
      setErrorMessage(errorMsg);
    };
    
    // Only run loadInstanceData if not in an active batch intent to prevent disruption
    if (!isBatchRunIntentActiveRef.current) {
        loadInstanceData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstance, customInstanceData]); // Removed optimalSolutionsData from deps to avoid premature stops


  // Effect for updating optimal distance when cities or optimal data changes
  useEffect(() => {
    let problemNameForOptimalLookup: string | null = null;
    if (selectedInstance && selectedInstance !== "custom") {
      problemNameForOptimalLookup = selectedInstance.replace('.tsp', '');
    } else if (selectedInstance === "custom" && cities.length > 0) {
      // For custom instances, we don't know the optimal
      setCurrentOptimalDistance(null);
      return;
    }

    if (problemNameForOptimalLookup && optimalSolutionsData && optimalSolutionsData[problemNameForOptimalLookup]) {
      setCurrentOptimalDistance(optimalSolutionsData[problemNameForOptimalLookup]);
    } else {
      setCurrentOptimalDistance(null);
    }
  }, [cities, selectedInstance, optimalSolutionsData]); // This effect should not stop workers


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

    if (bestRoute.length > 0 && cities.length > 0 && bestRoute.every(idx => idx < cities.length)) {
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


  const runSingleSolverInstance = (): Promise<BatchRunResult> => {
    return new Promise((resolve, reject) => {
      try {
        if (workerRef.current) {
          console.warn("runSingleSolverInstance: workerRef.current was not null, terminating existing worker.");
          workerRef.current.terminate();
          workerRef.current = null;
        }

        const localWorker = new Worker('/sas-solver.worker.js');
        workerRef.current = localWorker; // Assign to ref immediately

        const runStartTime = Date.now();

        localWorker.onmessage = (e) => {
          const { type, iteration, improvements, bestDistance, currentK, route, distance: solutionDistance, currentCityIndexInLoop, totalCitiesInLoop, improvedInRound } = e.data;

          if (type === 'stats' || type === 'improvement' || type === 'solution') {
            setSolverStats(prevStats => ({
              ...prevStats,
              iteration: iteration !== undefined ? iteration : prevStats.iteration,
              improvements: improvements !== undefined ? improvements : prevStats.improvements,
              currentK: currentK !== undefined ? currentK : prevStats.currentK,
              bestDistance: solutionDistance !== undefined ? solutionDistance : (bestDistance !== undefined ? bestDistance : prevStats.bestDistance),
              currentCityIndexInLoop: currentCityIndexInLoop !== undefined ? currentCityIndexInLoop : prevStats.currentCityIndexInLoop,
              totalCitiesInLoop: totalCitiesInLoop !== undefined ? totalCitiesInLoop : prevStats.totalCitiesInLoop,
              improvedInRound: improvedInRound !== undefined ? improvedInRound : prevStats.improvedInRound,
            }));
            if (route) {
              setBestRoute(route);
            }
          }

          if (type === 'solution') {
            const runEndTime = Date.now();
            localWorker.terminate(); // Terminate this specific worker
            if (workerRef.current === localWorker) { // Only nullify ref if it's still THIS worker
              workerRef.current = null;
            }
            resolve({
              runNumber: 0, // Will be set by batch runner
              distance: solutionDistance,
              time: runEndTime - runStartTime,
              iterations: iteration,
              improvements: improvements,
              k: currentK,
            });
          }
        };

        localWorker.onerror = (error) => {
          console.error("Worker error in runSingleSolverInstance:", error);
          localWorker.terminate();
          if (workerRef.current === localWorker) { workerRef.current = null; }
          reject(new Error(`Worker error: ${error.message || 'Unknown worker error'}`));
        };

        const citiesForWorker: CityPoint[] = cities.map(c => ({ x: c.x, y: c.y }));
        if (!citiesForWorker || citiesForWorker.length === 0) {
           // Ensure worker is terminated before rejecting if it was created
           localWorker.terminate();
           if (workerRef.current === localWorker) workerRef.current = null;
           reject(new Error("Cannot start worker: cities list is empty for runSingleSolverInstance."));
           return;
        }
        localWorker.postMessage({
          type: 'start',
          cities: citiesForWorker,
          id: selectedInstance || 'custom',
          maxK: maxK,
          debug: isDebugMode,
        });

      } catch (promiseSetupError: any) {
        console.error("Error setting up worker promise in runSingleSolverInstance:", promiseSetupError);
        // If localWorker was created and assigned to workerRef.current, terminate it
        if (workerRef.current) { // Check workerRef.current as localWorker might not be in scope
            workerRef.current.terminate();
            workerRef.current = null;
        }
        reject(new Error(`Failed to initialize worker for runSingleSolverInstance: ${promiseSetupError.message || 'Unknown setup error'}`));
      }
    });
  };

  const handleRunSolver = async () => {
    if (isSolverRunning || cities.length === 0 || isBatchRunning) return;

    setIsSolverRunning(true);
    isBatchRunIntentActiveRef.current = false; // Ensure no batch intent
    setErrorMessage(null);
    resetSolverState(false); // Reset stats, but not full timer reset for single runs if desired (current behavior: resets specific stats, keeps timer logic isolated)
    setAggregatedBatchStats(null); // Clear any previous batch stats
    setHistogramData(null);
    setBatchInstanceName(null);
    setBatchEtrFormatted("");
    setBatchMaxKUsed(null);

    startTimer(); // Start the main timer

    try {
      await runSingleSolverInstance();
    } catch (error: any) {
      setErrorMessage(error.message || "Solver run failed.");
    } finally {
      stopTimer(); // Stop the main timer
      setIsSolverRunning(false);
    }
  };

  const handleStopSolver = () => {
    isBatchRunIntentActiveRef.current = false; // Signal to stop any ongoing batch intent
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop', id: selectedInstance || 'custom' });
      // Give worker a moment to process stop message before terminating hard
      setTimeout(() => {
        if (workerRef.current) { // Check again as it might have self-terminated
          workerRef.current.terminate();
          workerRef.current = null;
        }
      }, 100); // 100ms delay
    }
    setIsSolverRunning(false);
    setIsBatchRunning(false); // Ensure batch running state is also false
    setBatchEtrFormatted(""); // Clear ETR
    stopTimer(); // Stop main timer
  };

  const prepareHistogramData = (results: BatchRunResult[], numBins: number = 15): HistogramBin[] => {
    if (results.length === 0) return [];

    const distances = results.map(r => r.distance);
    const minVal = Math.min(...distances);
    const maxVal = Math.max(...distances);

    if (minVal === maxVal) {
      // Handle case where all distances are the same
      return [{ range: `${minVal.toFixed(0)}`, count: distances.length }];
    }

    // Ensure binWidth is at least 1 and produces a reasonable number of bins
    const binWidth = Math.max(1, Math.ceil((maxVal - minVal +1) / numBins)); // +1 to ensure maxVal is included
    const bins: HistogramBin[] = [];

    // Adjust start of first bin to be a multiple of binWidth, or minVal if smaller
    let currentBinStart = Math.floor(minVal / binWidth) * binWidth;
    if (currentBinStart > minVal && binWidth > 1) currentBinStart -= binWidth; // Ensure minVal is in first bin if not perfectly aligned


    for (let i = 0; ; i++) {
        const binStart = currentBinStart + (i * binWidth);
        const binEnd = binStart + binWidth -1; // Inclusive end

        const count = distances.filter(d => d >= binStart && d <= binEnd).length;
        let rangeLabel = `${binStart.toFixed(0)}-${binEnd.toFixed(0)}`;
        if (binWidth === 1) rangeLabel = `${binStart.toFixed(0)}`; // Simpler label if bin width is 1

         // Add bin if it has items, or if it's the first bin and part of the overall range,
         // or if the previous bin had items and this one is still within the overall range.
         // This helps to show empty bins between populated ones if desired.
         if (count > 0 || (bins.length === 0 && binStart <= maxVal) || (bins.length > 0 && bins[bins.length-1].count > 0 && binStart <= maxVal)) {
            bins.push({
              range: rangeLabel,
              count: count,
            });
        }
        if (binEnd >= maxVal || bins.length >= numBins * 2 ) break; // Stop if we've covered the max value or have too many bins
    }

    // Prune trailing empty bins (unless it's the only bin)
    while (bins.length > 1 && bins[bins.length - 1].count === 0) {
        bins.pop();
    }
    
    // Attempt to refine binning if too many "significant" bins (bins with count > 0)
    // or if the number of distinct values is very small.
    let significantBins = bins.filter(b => b.count > 0);
    if (significantBins.length === 0 && bins.length > 0) significantBins = [bins[0]]; // Handle all-empty bins case (e.g., after pruning)

    const distinctValues = new Set(distances).size;
    if (significantBins.length > numBins * 1.5 && significantBins.length > Math.min(5, distinctValues) ) { // Heuristic for "too many" bins
        // If too many bins are generated, try again with fewer bins
        // This can happen if initial numBins was too high for the data distribution
        return prepareHistogramData(results, Math.max(Math.min(5, distinctValues), Math.floor(numBins / 1.5)));
    }


    return bins;
  };


 const handleRunBatchSolver = async () => {
    if (isBatchRunning || cities.length === 0 || isSolverRunning || numberOfRuns <= 0) return;

    const actualBatchStartTime = Date.now(); // Capture start time for the entire batch

    setIsBatchRunning(true);
    isBatchRunIntentActiveRef.current = true; // Set intent to run batch
    setErrorMessage(null);
    const tempBatchResults: BatchRunResult[] = []; // Use a local temporary array first
    setBatchRunResults(tempBatchResults); // Initialize with empty array
    setAggregatedBatchStats(null); // Clear previous aggregated stats
    setHistogramData(null); // Clear previous histogram
    setBatchEtrFormatted(""); // Clear ETR

    const currentTSPInstance = tspInstances.find(inst => inst.id === selectedInstance);
    const currentInstanceName = currentTSPInstance ? currentTSPInstance.name.split(' (')[0] : (selectedInstance === "custom" ? "Custom Input" : "Unknown Instance");
    setBatchInstanceName(currentInstanceName);
    setBatchMaxKUsed(maxK);


    const resultsCollector: BatchRunResult[] = [];
    let totalBatchProcessingTime = 0; // Sum of individual run times reported by worker
    const currentLoopNumberOfRuns = numberOfRuns; // Capture at start of batch

    startTimer(); // Start the main timer display

    try {
        for (let i = 1; i <= currentLoopNumberOfRuns; i++) {
            if (!isBatchRunIntentActiveRef.current) { // Check the ref to allow interruption
                // setErrorMessage("Batch run stopped by user."); // Avoid this generic message
                break;
            }

            setCurrentBatchRunNumber(i);
            resetSolverState(false); // Reset stats for the individual run display

            try {
                const result = await runSingleSolverInstance(); // This function now handles its own worker

                resultsCollector.push({ ...result, runNumber: i });
                totalBatchProcessingTime += result.time; // Accumulate individual run processing times
                setBatchRunResults([...resultsCollector]); // Update UI with current results

                // ETR Calculation
                const runsCompleted = i;
                const runsRemaining = currentLoopNumberOfRuns - runsCompleted;
                if (runsCompleted > 0 && runsRemaining > 0 && totalBatchProcessingTime > 0) {
                    const avgTimePerIndividualRun = totalBatchProcessingTime / runsCompleted;
                    const etrMs = runsRemaining * avgTimePerIndividualRun;
                    setBatchEtrFormatted(`${formatTime(etrMs)}`);
                } else {
                    setBatchEtrFormatted(""); // Clear ETR if not applicable
                }

            } catch (error: any) {
                setErrorMessage(`Error in batch run ${i}: ${error.message || 'Unknown error'}`);
                isBatchRunIntentActiveRef.current = false; // Stop further runs on error
                break; // Exit batch loop on error
            }
        }
    } finally {
        stopTimer(); // Stop the main timer display

        const finalBatchDuration = Date.now() - actualBatchStartTime; // Definitive total batch duration

        if (resultsCollector.length > 0) {
            const totalDistance = resultsCollector.reduce((sum, r) => sum + r.distance, 0);
            const minDistance = Math.min(...resultsCollector.map(r => r.distance));
            const maxDistance = Math.max(...resultsCollector.map(r => r.distance));
            let totalTimesOptimalFound = 0;
            let sumApproximationRatios = 0;
            let validRatiosCount = 0;
            let probOptimalInTenRuns = null;
            let probOptimalInNRuns = null;
            const numCitiesInProblem = cities.length; // Get N for Prob. Opt. in N Runs


            if (currentOptimalDistance !== null && currentOptimalDistance > 0) {
                resultsCollector.forEach(r => {
                    // Use Math.round for comparison with integer optimal values
                    if (Math.round(r.distance) === currentOptimalDistance) {
                        totalTimesOptimalFound++;
                    }
                    const ratio = r.distance / currentOptimalDistance!; // Use ! as we checked for null
                    sumApproximationRatios += ratio;
                    validRatiosCount++;
                });
            }

            // Calculate Prob. Opt. in 10 Runs and N Runs
            if (resultsCollector.length > 0 && totalTimesOptimalFound > 0 && currentOptimalDistance !== null) {
                const singleRunSuccessRate = totalTimesOptimalFound / resultsCollector.length;
                // Ensure success rate is within [0, 1] to avoid Math.pow errors or nonsensical results
                if (singleRunSuccessRate > 0 && singleRunSuccessRate <=1) {
                    probOptimalInTenRuns = 1 - Math.pow(1 - singleRunSuccessRate, 10);
                    if (numCitiesInProblem > 0) { // Ensure N is positive
                        probOptimalInNRuns = 1 - Math.pow(1 - singleRunSuccessRate, numCitiesInProblem);
                    }
                } else if (singleRunSuccessRate > 1) { // Should not happen, but defensive
                    probOptimalInTenRuns = 1; 
                    if (numCitiesInProblem > 0) probOptimalInNRuns = 1;
                } else { // singleRunSuccessRate is 0 or invalid
                    probOptimalInTenRuns = 0;
                    if (numCitiesInProblem > 0) probOptimalInNRuns = 0;
                }
            }


            setAggregatedBatchStats({
                numberOfRuns: resultsCollector.length,
                minDistance,
                maxDistance,
                avgDistance: totalDistance / resultsCollector.length,
                avgTimePerRun: totalBatchProcessingTime / resultsCollector.length, // Avg of worker-reported times
                totalBatchTime: finalBatchDuration, // Use the directly calculated total duration
                totalTimesOptimalFound,
                avgApproximationRatio: validRatiosCount > 0 ? sumApproximationRatios / validRatiosCount : null,
                probOptimalInTenRuns,
                probOptimalInNRuns,
                numberOfCitiesInBatch: numCitiesInProblem > 0 ? numCitiesInProblem : null,
            });
            setHistogramData(prepareHistogramData(resultsCollector));
        }
        isBatchRunIntentActiveRef.current = false; // Ensure intent is reset
        setIsBatchRunning(false); // Reset batch running UI state
        setCurrentBatchRunNumber(0); // Reset current run number for UI
        setBatchEtrFormatted(""); // Clear ETR for UI
    }
};


  useEffect(() => {
    // Cleanup worker on component unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      isBatchRunIntentActiveRef.current = false; // Reset batch intent on unmount
    };
  }, []);

  const approximationRatio = currentOptimalDistance && solverStats.bestDistance !== Infinity && currentOptimalDistance > 0
    ? (solverStats.bestDistance / currentOptimalDistance)
    : null;

  const canRun = !isLoadingData && cities.length > 0;
  const chartConfigSolutions = { solutions: { label: "Solutions", color: "hsl(var(--chart-1))" } };

  const currentKDisplay = solverStats.currentK +
    (solverStats.improvedInRound ? "+" : "") +
    (solverStats.currentCityIndexInLoop !== undefined && solverStats.totalCitiesInLoop !== undefined && (isSolverRunning || isBatchRunning) && solverStats.totalCitiesInLoop > 0
      ? ` (City ${solverStats.currentCityIndexInLoop + 1}/${solverStats.totalCitiesInLoop})`
      : "");


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
          Run the SAS algorithm on TSP instances and visualize the solution. Compare with known optimal values.
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
              <Select
                value={selectedInstance}
                onValueChange={setSelectedInstance}
                disabled={isSolverRunning || isLoadingData || isBatchRunning}
              >
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
                  placeholder="Paste your TSPLIB data here..."
                  value={customInstanceData}
                  onChange={(e) => setCustomInstanceData(e.target.value)}
                  rows={8}
                  disabled={isSolverRunning || isLoadingData || isBatchRunning}
                />
              </div>
            )}

            <div>
              <Label htmlFor="maxK" className="text-base">Max K (Systematic Alternatives)</Label>
              <Input id="maxK" type="number" value={maxK} onChange={e => setMaxK(parseInt(e.target.value,10) || 0)} placeholder="e.g., 3" disabled={isSolverRunning || isBatchRunning}/>
            </div>
             <div>
              <Label htmlFor="maxCitiesRegion" className="text-base">Max Cities Per Region (Parallel)</Label>
              <Input id="maxCitiesRegion" type="number" value={maxCitiesRegion} onChange={e => setMaxCitiesRegion(parseInt(e.target.value,10) || 0)} placeholder="e.g., 30" disabled={isSolverRunning || isBatchRunning || true} title="For future parallel implementation"/>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="debugMode"
                checked={isDebugMode}
                onCheckedChange={(checked) => setIsDebugMode(Boolean(checked))}
                disabled={isSolverRunning || isBatchRunning}
              />
              <Label htmlFor="debugMode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Enable Worker Debug Logging
              </Label>
            </div>


            <Button
              onClick={isSolverRunning ? handleStopSolver : handleRunSolver}
              disabled={!canRun || isBatchRunning}
              className="w-full text-lg py-6"
            >
              {isSolverRunning ? <PauseCircle className="mr-2 h-6 w-6" /> : <PlayCircle className="mr-2 h-6 w-6" />}
              {isLoadingData ? "Loading Data..." : isSolverRunning ? "Stop Solver" : "Run SAS Solver"}
            </Button>

            <hr className="my-4" />

            <div>
              <Label htmlFor="numberOfRuns" className="text-base">Number of Runs (Batch)</Label>
              <Input id="numberOfRuns" type="number" value={numberOfRuns} onChange={e => setNumberOfRuns(Math.max(1, parseInt(e.target.value,10) || 1))} placeholder="e.g., 10" disabled={isSolverRunning || isBatchRunning}/>
            </div>
             <Button
              onClick={isBatchRunning ? handleStopSolver : handleRunBatchSolver}
              disabled={!canRun || isSolverRunning}
              className="w-full text-lg py-6"
              variant="outline"
            >
              {isBatchRunning ? <PauseCircle className="mr-2 h-6 w-6" /> : <BarChartBig className="mr-2 h-6 w-6" />}
              {isBatchRunning ? `Stop Batch (${currentBatchRunNumber}/${numberOfRuns})...` : "Run Batch Analysis"}
            </Button>

          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg min-h-[500px]">
            <CardHeader>
              <CardTitle className="text-2xl">Solution Visualization & Results</CardTitle>
              <CardDescription>
                {solverStats.bestDistance !== Infinity ? `SAS path length: ${solverStats.bestDistance.toFixed(0)}` : cities.length > 0 ? "TSP instance cities. Ready to solve." : "Awaiting data or selection."}
                {currentOptimalDistance && ` Optimal: ${currentOptimalDistance}.`}
                 {approximationRatio && ` Ratio: ${approximationRatio.toFixed(4)}.`}
                 {isBatchRunning && batchEtrFormatted && ` (Run ${currentBatchRunNumber} of ${numberOfRuns} - ETR: ${batchEtrFormatted})`}
                 {isBatchRunning && !batchEtrFormatted && currentBatchRunNumber > 0 && ` (Run ${currentBatchRunNumber} of ${numberOfRuns})`}
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

              { (cities.length > 0 || solverStats.iteration > 0 || isSolverRunning || isBatchRunning) &&
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                      <FileCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">{currentKDisplay}</div>
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
                  <Card className="bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium uppercase text-muted-foreground">SAS Path Length</CardTitle>
                      <Route className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">{solverStats.bestDistance === Infinity ? "N/A" : solverStats.bestDistance.toFixed(0)}</div>
                    </CardContent>
                  </Card>
                   <Card className="bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Optimal Path</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">{currentOptimalDistance === null ? "N/A" : currentOptimalDistance}</div>
                    </CardContent>
                  </Card>
                  <Card className="col-span-2 md:col-span-2 bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Approximation Ratio</CardTitle>
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">
                        {approximationRatio === null ? "N/A" : approximationRatio.toFixed(4)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              }

              {isBatchRunning && !aggregatedBatchStats && (
                <div className="flex flex-col items-center justify-center my-6">
                    <Activity className="h-12 w-12 text-primary animate-spin mb-3" />
                    <p className="text-muted-foreground text-md">
                        Batch analysis in progress... Run {currentBatchRunNumber} of {numberOfRuns}{batchEtrFormatted && ` (ETR: ${batchEtrFormatted})`}
                    </p>
                </div>
              )}

              {aggregatedBatchStats && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center"><BarChartBig className="mr-2 h-5 w-5 text-primary"/>Batch Analysis Summary</CardTitle>
                     <CardDescription>
                        Results for {batchInstanceName || 'Selected Instance'}{batchMaxKUsed !== null ? ` (Max K: ${batchMaxKUsed})` : ''} from {aggregatedBatchStats.numberOfRuns} executions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 border rounded-md bg-muted/20">
                      <h4 className="text-xs font-medium text-muted-foreground">Min Distance</h4>
                      <p className="text-lg font-bold">
                        {aggregatedBatchStats.minDistance.toFixed(0)}
                        {currentOptimalDistance && currentOptimalDistance > 0 && aggregatedBatchStats.minDistance !== Infinity && (
                            <span className="text-sm text-muted-foreground ml-1">
                                ({(aggregatedBatchStats.minDistance / currentOptimalDistance).toFixed(4)})
                            </span>
                        )}
                      </p>
                    </div>
                    <div className="p-3 border rounded-md bg-muted/20">
                      <h4 className="text-xs font-medium text-muted-foreground">Max Distance</h4>
                      <p className="text-lg font-bold">
                        {aggregatedBatchStats.maxDistance.toFixed(0)}
                        {currentOptimalDistance && currentOptimalDistance > 0 && aggregatedBatchStats.maxDistance !== Infinity && (
                            <span className="text-sm text-muted-foreground ml-1">
                                ({(aggregatedBatchStats.maxDistance / currentOptimalDistance).toFixed(4)})
                            </span>
                        )}
                      </p>
                    </div>
                    <div className="p-3 border rounded-md bg-muted/20">
                      <h4 className="text-xs font-medium text-muted-foreground">Avg Distance</h4>
                      <p className="text-lg font-bold">{aggregatedBatchStats.avgDistance.toFixed(2)}</p>
                    </div>
                     <div className="p-3 border rounded-md bg-muted/20">
                      <h4 className="text-xs font-medium text-muted-foreground">Total Batch Time</h4>
                      <p className="text-lg font-bold">{formatTime(aggregatedBatchStats.totalBatchTime)}</p>
                    </div>
                    <div className="p-3 border rounded-md bg-muted/20">
                      <h4 className="text-xs font-medium text-muted-foreground">Avg Time/Run</h4>
                      <p className="text-lg font-bold">{formatTime(aggregatedBatchStats.avgTimePerRun)}</p>
                    </div>
                     <div className="p-3 border rounded-md bg-muted/20">
                      <h4 className="text-xs font-medium text-muted-foreground">Optimal Found</h4>
                      <p className="text-lg font-bold">
                        {aggregatedBatchStats.totalTimesOptimalFound} / {aggregatedBatchStats.numberOfRuns}
                         {currentOptimalDistance !== null ? ` (${((aggregatedBatchStats.totalTimesOptimalFound / aggregatedBatchStats.numberOfRuns) * 100).toFixed(1)}%)` : ''}
                      </p>
                    </div>
                    <div className="p-3 border rounded-md bg-muted/20">
                      <h4 className="text-xs font-medium text-muted-foreground">Avg Approx. Ratio</h4>
                      <p className="text-lg font-bold">
                        {aggregatedBatchStats.avgApproximationRatio === null ? "N/A" : aggregatedBatchStats.avgApproximationRatio.toFixed(4)}
                      </p>
                    </div>
                    {aggregatedBatchStats.probOptimalInTenRuns !== null && (
                      <div className="p-3 border rounded-md bg-muted/20">
                        <h4 className="text-xs font-medium text-muted-foreground">Prob. Opt. in 10 Runs</h4>
                        <p className="text-lg font-bold">
                          {(aggregatedBatchStats.probOptimalInTenRuns * 100).toFixed(2)}%
                        </p>
                      </div>
                    )}
                    {aggregatedBatchStats.probOptimalInNRuns !== null && aggregatedBatchStats.numberOfCitiesInBatch !== null && (
                      <div className="p-3 border rounded-md bg-muted/20">
                        <h4 className="text-xs font-medium text-muted-foreground">Prob. Opt. in N Runs (N={aggregatedBatchStats.numberOfCitiesInBatch})</h4>
                        <p className="text-lg font-bold">
                          {(aggregatedBatchStats.probOptimalInNRuns * 100).toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            </CardContent>
          </Card>

          {aggregatedBatchStats && histogramData && histogramData.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <BarChartIcon className="mr-2 h-5 w-5 text-primary" />
                  Solution Distribution Histogram
                </CardTitle>
                <CardDescription>
                  Frequency of path lengths found in the batch run for {batchInstanceName || 'Selected Instance'}{batchMaxKUsed !== null ? ` (Max K: ${batchMaxKUsed})` : ''}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigSolutions} className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogramData} margin={{ top: 5, right: 30, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" angle={-45} textAnchor="end" height={70} interval={0} />
                      <YAxis allowDecimals={false} label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="top" />
                      <Bar dataKey="count" fill="var(--color-solutions)" name="Solutions in Range " radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

