
/**
 * @file sas-solver.worker.js
 * Web Worker for the Systematic Alternatives Search (SAS) algorithm for TSP.
 */

class SAS_Solver {
  constructor() {
    this.id = ''; // Identifier for the solver instance (e.g., TSP problem name)
    this.cities = []; // Array of city objects { x, y }
    this.numCities = 0;
    this.bestRoute = []; // Stores the indices of cities in the best route found
    this.bestDistance = Infinity; // Length of the best route found

    // Stats
    this.iteration = 0; // Number of routes evaluated
    this.improvements = 0; // Number of times a new best route was found
    this.currentK = 0; // Current number of alternatives being explored
    this.currentCityIndexInLoop = 0; // For detailed progress: current city index in the main k-loop
    // this.totalCitiesInLoop = 0; // For detailed progress: total cities in the main k-loop // Siempre es numCities


    this.maxK = 0; // Maximum number of alternatives to explore
    this.debug = false; // Flag for enabling debug logs

    // Internal data structures
    this.distances = []; // 2D array storing distances between cities
    this.initialHeuristics = []; // Heuristics based on initial distances
    this.localHeuristics = []; // Adaptable heuristics used by the search

    this.isRunning = true; // Flag to control the solver's execution loop
    this.improvedInRound = true; // Flag to track if an improvement was made in the current round for a given K

    // this.statsUpdateInterval = null; // Interval ID for periodic stats updates
  }

  /**
   * Initializes the solver with city data and parameters.
   * @param {object} data - The initialization data.
   * @param {string} data.id - Identifier for this solver run.
   * @param {Array<{x: number, y: number}>} data.cities - Array of city coordinates.
   * @param {number} data.maxK - Maximum K value.
   * @param {boolean} data.debug - Debug flag.
   */
  initialize(data) {

    this.id = data.id;
    this.cities = data.cities;
    this.numCities = this.cities.length;
    this.maxK = data.maxK;
    this.debug = data.debug;

    // Reset all state variables for a new run
    this.bestRoute = [];
    this.bestDistance = Infinity;
    this.iteration = 0;
    this.improvements = 0;
    this.currentK = 0;
    this.currentCityIndexInLoop = 0;
    this.isRunning = true;
    this.improvedInRound = true;

    if (this.numCities === 0) {
        this.isRunning = false;
        // Post a message back if there are no cities to process
        self.postMessage({ type: 'error', id: this.id, message: 'No cities provided to solver.' });
        return;
    }

    this.precomputeDistancesAndHeuristics();

    // Start periodic stats updates
    // if (this.statsUpdateInterval) clearInterval(this.statsUpdateInterval);
    // this.statsUpdateInterval = setInterval(() => this.sendStats(), 1000);

    if (this.debug) console.log(`[${this.id}] Worker initialized. MaxK: ${this.maxK}, Cities: ${this.numCities}`);
    
    // Start solving
    setTimeout(() => this.solve(), 0);
  }

  /**
   * Stops the solver.
   */
  stop() {
    this.isRunning = false;
    // if (this.statsUpdateInterval) clearInterval(this.statsUpdateInterval);
    if (this.debug) console.log(`[${this.id}] Worker stopped by request.`);
  }

  /**
   * Calculates the Euclidean distance between two cities and rounds it.
   * @param {object} city1 - The first city { x, y }.
   * @param {object} city2 - The second city { x, y }.
   * @returns {number} The rounded Euclidean distance.
   */
  calculateEuclideanDistance(city1, city2) {
    return Math.round(Math.sqrt(Math.pow(city2.x - city1.x, 2) + Math.pow(city2.y - city1.y, 2)));
  }

  /**
   * Precomputes the distance matrix and initial local heuristics.
   */
  precomputeDistancesAndHeuristics() {
    this.distances = Array(this.numCities).fill(null).map(() => Array(this.numCities).fill(0));
    this.initialHeuristics = Array(this.numCities).fill(null).map(() => []);
    this.localHeuristics = Array(this.numCities).fill(null).map(() => []);

    for (let i = 0; i < this.numCities; i++) {
      for (let j = i + 1; j < this.numCities; j++) {
        const dist = this.calculateEuclideanDistance(this.cities[i], this.cities[j]);
        this.distances[i][j] = dist;
        this.distances[j][i] = dist;
      }
    }

    for (let i = 0; i < this.numCities; i++) {
      const neighbors = [];
      for (let j = 0; j < this.numCities; j++) {
        if (i === j) continue;
        neighbors.push({ index: j, distance: this.distances[i][j] });
      }
      neighbors.sort((a, b) => a.distance - b.distance);
      this.initialHeuristics[i] = neighbors.map(n => n.index);
      this.localHeuristics[i] = [...this.initialHeuristics[i]];
    }
  }

  /**
   * Calculates the total distance of a given route.
   * @param {number[]} route - An array of city indices representing the route.
   * @returns {number} The total distance of the route.
   */
  calculateTotalDistance(route) {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += this.distances[route[i]][route[i + 1]];
    }
    totalDistance += this.distances[route[route.length - 1]][route[0]]; // Return to start
    return totalDistance;
  }

  /**
   * Sends statistics to the main thread.
   */
  sendStats() {
    self.postMessage({
      type: 'stats',
      id: this.id,
      iteration: this.iteration,
      improvements: this.improvements,
      bestDistance: this.bestDistance,
      currentK: this.currentK,
      improvedInRound: this.improvedInRound,
      currentCityIndexInLoop: this.currentCityIndexInLoop,
      totalCitiesInLoop: this.numCities,
    });
  }

  /**
   * Updates the best route if a shorter one is found.
   * @param {number} routeDistance - The distance of the current route.
   * @param {number[]} currentRoute - The current route array.
   */
  updateBestRoute(routeDistance, currentRoute) {
    this.improvedInRound = true;
    this.improvements++;
    this.bestDistance = routeDistance;
    this.bestRoute = [...currentRoute];
    this.adaptLocalHeuristics(this.bestRoute);

    if (this.debug) console.log(`[${this.id}] Improvement #${this.improvements}: K=${this.currentK}, Dist=${this.bestDistance}`);
    
    // Send immediate improvement message
    self.postMessage({
      type: 'improvement',
      id: this.id,
      route: this.bestRoute,
      distance: this.bestDistance,
      iteration: this.iteration,
      improvements: this.improvements,
      currentK: this.currentK,
      improvedInRound: this.improvedInRound,
      currentCityIndexInLoop: this.currentCityIndexInLoop,
      totalCitiesInLoop: this.numCities,
    });
    // Also send general stats
    this.sendStats();
  }

  /**
   * Checks if the current route is better than the best one found so far.
   * @param {number[]} currentRoute - The route to check.
   */
  checkRoute(currentRoute) {
    this.iteration++;
    const routeDistance = this.calculateTotalDistance(currentRoute);
    if (routeDistance < this.bestDistance) {
      this.updateBestRoute(routeDistance, currentRoute);
    }

    // Send stats periodically even if no improvement (handled by interval now)
    if (this.iteration % 500000 === 0) { // Reduced frequency as interval handles it
      this.sendStats();
    }
  }

  /**
   * The core recursive search function.
   * @param {Set<number>} remainingCities - A Set of indices of cities yet to be visited.
   * @param {number[]} currentRoute - The route built so far.
   * @param {number} alternativesLeft - Number of non-heuristic choices allowed.
   */
  systematicAlternativesSearch(remainingCities, currentRoute, alternativesLeft) {
    if (!this.isRunning) return;

    if (remainingCities.size === 0) {
      this.checkRoute(currentRoute);
      return;
    }

    const currentCity = currentRoute[currentRoute.length - 1];
    const heuristicOrder = this.localHeuristics[currentCity];
    let validCitiesFound = 0;

    for (let i = 0; i < heuristicOrder.length; i++) {
      const nextCity = heuristicOrder[i];
      if (remainingCities.has(nextCity)) {
        validCitiesFound++;
        currentRoute.push(nextCity);
        remainingCities.delete(nextCity);
        
        this.systematicAlternativesSearch(remainingCities, currentRoute, alternativesLeft - (validCitiesFound - 1));
        
        remainingCities.add(nextCity); // Backtrack
        currentRoute.pop(); // Backtrack

        if (validCitiesFound > alternativesLeft) { // Optimization: if we've used more alternatives than allowed for this path
            break;
        }
      }
       if (!this.isRunning) return; // Check frequently for stop signal
    }
  }

  /**
   * Adapts local heuristics based on an improved route.
   * Connections in the new best route are prioritized.
   * @param {number[]} improvedRoute - The new best route.
   */
  adaptLocalHeuristics(improvedRoute) {
    for (let i = 0; i < improvedRoute.length; i++) {
      const city1 = improvedRoute[i];
      const city2 = improvedRoute[(i + 1) % this.numCities]; // Next city in cycle

      // For city1, prioritize city2
      let currentHeuristicCity1 = this.localHeuristics[city1];
      if (currentHeuristicCity1[0] !== city2) {
        this.localHeuristics[city1] = [city2, ...currentHeuristicCity1.filter(c => c !== city2)];
      }

      // For city2, prioritize city1
      let currentHeuristicCity2 = this.localHeuristics[city2];
      if (currentHeuristicCity2[0] !== city1) {
         this.localHeuristics[city2] = [city1, ...currentHeuristicCity2.filter(c => c !== city1)];
      }
    }
  }
  
  /**
   * Shuffles an array in place.
   * @param {Array} array - The array to shuffle.
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * The main solving loop. Iterates through K values and starting cities.
   */
  solve() {
    if (!this.isRunning) {
      if (this.debug) console.log(`[${this.id}] Solve called but isRunning is false. Exiting.`);
      this.sendFinalSolution();
      return;
    }

    this.currentK = 0;
    let cityOrder = Array.from({ length: this.numCities }, (_, i) => i);
    this.shuffleArray(cityOrder);
    
    // Initial greedy solution (K=0) if no route exists yet
    if (this.bestRoute.length === 0 && this.numCities > 0) {
        
        this.currentCityIndexInLoop = 1; // Indicate start of loop
        this.sendStats(); // Send initial K state

        const initialStartCity = cityOrder[0];
        const initialRemaining = new Set(this.cities.map((_, idx) => idx).filter(j => j !== initialStartCity));
        this.systematicAlternativesSearch(initialRemaining, [initialStartCity], 0);
        if (!this.isRunning) { this.sendFinalSolution(); return; }
    }

    // Main loop: iterate K and then iterate starting cities
    
    let round = 0;
    this.currentK = 1;

    while (this.currentK <= this.maxK && this.isRunning) {
      
      this.improvedInRound = false; // Reset for this K value
      round++;
      if (this.debug) console.log(`[${this.id}] Starting K = ${this.currentK}`);
      
      // Create a shuffled order of starting cities      
      this.shuffleArray(cityOrder);

      for (this.currentCityIndexInLoop = 1; this.currentCityIndexInLoop <= this.numCities; this.currentCityIndexInLoop++) {
        if (!this.isRunning) break;
        
        if (this.debug) {
          let sign = (this.improvedInRound) ? '+' : '';
          console.log(`[${this.id}] K=${this.currentK}/${this.maxK}, Round ${round}${sign}, city ${this.currentCityIndexInLoop}/${this.numCities}.`);
        }
        
        const startCity = cityOrder[this.currentCityIndexInLoop -1];
        // this.sendStats(); // Send progress within the city loop
       
        let remainingCities = new Set(this.cities.map((_, index) => index).filter(j => j !== startCity));
        this.systematicAlternativesSearch(remainingCities, [startCity], this.currentK);
      }
      
      if (!this.improvedInRound && this.isRunning) { // If no improvement in this K round, increment K
        this.currentK++;
        round = 0;
      }
      // If there was an improvement, improvedInRound is true, so the while loop continues with the same K
      // or resets K if we want a different strategy (e.g. K=0 again, but current keeps K)
    }
    
    if (this.isRunning) { // If loop finished naturally (not stopped)
        if (this.debug) console.log(`[${this.id}] Solve loop finished. MaxK reached or no further improvements. Iterations: ${this.iteration.toLocaleString()}`);
    }
    this.sendFinalSolution();
  }

  /**
   * Sends the final solution message to the main thread.
   */
  sendFinalSolution() {
    // if (this.statsUpdateInterval) clearInterval(this.statsUpdateInterval);
    this.statsUpdateInterval = null;

    // Ensure a final stats update is sent before the solution
    this.currentCityIndexInLoop = 0; // Clear city loop progress
    this.sendStats(); 

    self.postMessage({
      type: 'solution',
      id: this.id,
      route: this.bestRoute,
      distance: this.bestDistance,
      iteration: this.iteration,
      improvements: this.improvements,
      currentK: this.maxK, // The K at which the process concluded
    });
     if (this.debug) console.log(`[${this.id}] Final solution sent.`);
  }
}

// --- Worker Message Handling ---
const solverInstance = new SAS_Solver();

self.onmessage = function(e) {
  if (e.data.type === 'start') {
    solverInstance.initialize(e.data);
  } else if (e.data.type === 'stop') {
    solverInstance.stop();
  }
};
