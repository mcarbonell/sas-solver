
/**
 * @file sas-solver.worker.js
 * Web Worker for solving the Traveling Salesman Problem (TSP) using the Systematic Alternatives Search (SAS) algorithm.
 * This version is refactored into a class-based structure for better organization and readability.
 */

/**
 * Represents a SAS (Systematic Alternatives Search) solver for TSP.
 */
class SAS_Solver {
  /**
   * Creates an instance of the SAS_Solver.
   * @param {Array<Object>} citiesData - An array of city objects, each with x and y coordinates.
   * @param {number|string} maxK_param - The maximum K value (number of alternatives) to explore.
   * @param {string} [id_param='GLOBAL'] - An identifier for this solver instance (useful for parallel scenarios).
   * @param {boolean} [debug_param=false] - Flag to enable console logging for debugging.
   */
  constructor(citiesData, maxK_param, id_param = 'GLOBAL', debug_param = false) {
    this.id = id_param;
    this.cities = citiesData; // Array of {x, y} objects
    this.maxK = parseInt(maxK_param, 10);
    this.debug = debug_param;

    this.numCities = this.cities.length;
    this.bestRoute = []; // Stores the indices of cities in the best found route
    this.bestDistance = Infinity;
    this.bestPossibleDistance = 0; // A heuristic lower bound on distance

    this.iteration = 0; // Total number of routes checked
    this.improvements = 0; // Number of times a better global solution was found
    this.currentK = 0; // The K value currently being explored

    this.distances = []; // Adjacency matrix for distances between cities
    this.initialHeuristics = []; // Original sorted lists of neighbors by distance (static)
    this.localHeuristics = []; // Adaptable sorted lists of neighbors (dynamic)

    this.isRunning = true; // Flag to control the execution, can be set to false to stop
    this.improvedInRound = true; // Flag used in the main solve loop to continue exploring with current K if improvements are found

    if (this.numCities > 0) {
        this.initialize();
    } else {
        // Handle case with no cities gracefully
        this.bestDistance = 0;
        this.bestPossibleDistance = 0;
    }
  }

  /**
   * Initializes the solver by calculating the distance matrix and initial heuristics.
   */
  initialize() {
    // Calculate distance matrix: distances[i][j] = distance between city i and city j
    this.distances = this.cities.map((city1) =>
      this.cities.map((city2) => this._calculateEuclideanDistance(city1, city2))
    );

    // Initialize heuristics: for each city, a list of other city indices sorted by distance
    this.initialHeuristics = this.cities.map((_, i) =>
      this.cities.map((_, j) => j) // Array of city indices [0, 1, ..., numCities-1]
        .filter(j => j !== i) // Exclude self
        .sort((a, b) => this.distances[i][a] - this.distances[i][b]) // Sort by distance from city i
    );

    // Local heuristics start as a deep copy of initial heuristics and will be adapted during the search
    this.localHeuristics = this.initialHeuristics.map(heuristic => [...heuristic]);

    // Calculate a heuristic bestPossibleDistance (sum of distances to two nearest distinct neighbors for each city / 2)
    let tempBestPossible = 0;
    if (this.numCities > 1) {
        for (let i = 0; i < this.numCities; i++) {
            if (this.initialHeuristics[i].length >= 2) {
                // City has at least two other distinct neighbors
                const neighbor1 = this.initialHeuristics[i][0];
                const neighbor2 = this.initialHeuristics[i][1];
                tempBestPossible += this.distances[i][neighbor1] + this.distances[i][neighbor2];
            } else if (this.initialHeuristics[i].length === 1) {
                // City has only one other distinct neighbor (e.g., for numCities = 2)
                const neighbor1 = this.initialHeuristics[i][0];
                tempBestPossible += this.distances[i][neighbor1] * 2; // Each city connects to the other, so count twice
            }
        }
        this.bestPossibleDistance = tempBestPossible / 2;
    } else {
        this.bestPossibleDistance = 0; // No distance if 0 or 1 city
    }
  }

  /**
   * Calculates the Euclidean distance between two cities and rounds it.
   * @param {Object} city1 - The first city object {x, y}.
   * @param {Object} city2 - The second city object {x, y}.
   * @returns {number} The rounded Euclidean distance.
   */
  _calculateEuclideanDistance(city1, city2) {
    const dx = city2.x - city1.x;
    const dy = city2.y - city1.y;
    return Math.round(Math.sqrt(dx * dx + dy * dy));
  }

  /**
   * Calculates the total distance of a given route.
   * @param {Array<number>} routeIndices - An array of city indices representing the route.
   * @returns {number} The total distance of the route.
   */
  _calculateTotalDistance(routeIndices) {
    if (routeIndices.length < 2) return 0;
    let totalDistance = 0;
    // Sum distances between consecutive cities in the route
    for (let i = 0; i < routeIndices.length - 1; i++) {
      totalDistance += this.distances[routeIndices[i]][routeIndices[i + 1]];
    }
    // Add distance from the last city back to the first city to close the tour
    totalDistance += this.distances[routeIndices[routeIndices.length - 1]][routeIndices[0]];
    return totalDistance;
  }

  /**
   * Sends current solver statistics to the main thread.
   */
  _sendStats() {
    self.postMessage({
      type: 'stats',
      id: this.id,
      iteration: this.iteration,
      improvements: this.improvements,
      bestDistance: this.bestDistance,
      currentK: this.currentK,
      bestPossibleDistance: this.bestPossibleDistance
    });
  }

  /**
   * Updates the best known route if a better one is found.
   * Modifies local heuristics to favor the new best route.
   * Sends an 'improvement' message to the main thread.
   * @param {number} routeDistance - The distance of the newly found route.
   * @param {Array<number>} currentRouteIndices - The city indices of the new route.
   */
  _updateBestRoute(routeDistance, currentRouteIndices) {
    this.improvedInRound = true; // Signal that an improvement was made in the current K-round
    this.improvements += 1;
    this.bestDistance = routeDistance;
    this.bestRoute = [...currentRouteIndices]; // Store a copy of the route
    this._updateLocalHeuristics(this.bestRoute); // Adapt heuristics based on the new best route

    // Notify the main thread about the improvement
    self.postMessage({
      type: 'improvement',
      id: this.id,
      route: this.bestRoute,
      distance: this.bestDistance,
      iteration: this.iteration,
      improvements: this.improvements,
      currentK: this.currentK
    });
  }

  /**
   * Checks if a completed route is better than the current best route.
   * Increments the iteration count and periodically sends stats.
   * @param {Array<number>} currentRouteIndices - The city indices of the route to check.
   */
  _checkRoute(currentRouteIndices) {
    const routeDistance = this._calculateTotalDistance(currentRouteIndices);
    if (routeDistance < this.bestDistance) {
      this._updateBestRoute(routeDistance, currentRouteIndices);
    }

    this.iteration++;
    // Send stats update every 100,000 iterations to avoid flooding the main thread
    if ((this.iteration % 100000) === 0) {
      this._sendStats();
    }
  }

  /**
   * The core recursive SAS algorithm.
   * Explores routes systematically, allowing for 'alternativesLeft' deviations from the local heuristic.
   * @param {Set<number>} remainingCitiesIndices - A Set of indices of cities yet to be visited.
   * @param {Array<number>} currentRouteIndices - An array of city indices forming the current partial route.
   * @param {number} alternativesLeft - The number of "alternative" choices (non-best heuristic moves) still allowed.
   */
  _systematicAlternativesSearch(remainingCitiesIndices, currentRouteIndices, alternativesLeft) {
    if (!this.isRunning) return; // Stop if the worker has been signaled to stop

    // Base case: if all cities have been visited, check the completed route
    if (remainingCitiesIndices.size === 0) {
      this._checkRoute(currentRouteIndices);
      return;
    }

    const currentCityIndex = currentRouteIndices[currentRouteIndices.length - 1];
    const heuristicForCurrentCity = this.localHeuristics[currentCityIndex];
    let validCitiesFoundInThisStep = 0; // Tracks how many alternatives are used at this step

    // Iterate through neighbors of the current city according to its local heuristic
    for (let i = 0; i < heuristicForCurrentCity.length && validCitiesFoundInThisStep <= alternativesLeft; i++) {
      if (!this.isRunning) return;

      const nextCityIndex = heuristicForCurrentCity[i];
      // If the neighbor is in the set of remaining cities
      if (remainingCitiesIndices.has(nextCityIndex)) {
        validCitiesFoundInThisStep++; // Increment count of valid (alternative) choices made at this step

        // Add next city to route and remove from remaining set
        currentRouteIndices.push(nextCityIndex);
        remainingCitiesIndices.delete(nextCityIndex);

        // Recursive call: alternativesLeft is reduced by the number of "extra" alternatives used (validCitiesFoundInThisStep - 1)
        this._systematicAlternativesSearch(remainingCitiesIndices, currentRouteIndices, alternativesLeft - (validCitiesFoundInThisStep - 1));

        // Backtrack: remove next city from route and add back to remaining set
        remainingCitiesIndices.add(nextCityIndex);
        currentRouteIndices.pop();
      }
    }
  }

  /**
   * Updates the local heuristics based on an improved route.
   * For each segment in the improved route, it prioritizes that connection by moving
   * the connected city to the beginning of the other city's heuristic list.
   * @param {Array<number>} improvedRouteIndices - The city indices of the new best route.
   */
  _updateLocalHeuristics(improvedRouteIndices) {
    for (let i = 0; i < improvedRouteIndices.length; i++) {
      const city1_idx = improvedRouteIndices[i];
      // The next city in the tour, wrapping around for the last segment
      const city2_idx = improvedRouteIndices[(i + 1) % improvedRouteIndices.length];

      // Update heuristic for city1_idx to prioritize city2_idx
      if (this.localHeuristics[city1_idx].length > 0 && this.localHeuristics[city1_idx][0] !== city2_idx) {
        this.localHeuristics[city1_idx] = [city2_idx, ...this.localHeuristics[city1_idx].filter(c => c !== city2_idx)];
      } else if (this.localHeuristics[city1_idx].length === 0 && this.numCities > 1) {
        // Handles cases where heuristic list might be empty (e.g. very small N)
        this.localHeuristics[city1_idx] = [city2_idx];
      }

      // Update heuristic for city2_idx to prioritize city1_idx
      if (this.localHeuristics[city2_idx].length > 0 && this.localHeuristics[city2_idx][0] !== city1_idx) {
        this.localHeuristics[city2_idx] = [city1_idx, ...this.localHeuristics[city2_idx].filter(c => c !== city1_idx)];
      } else if (this.localHeuristics[city2_idx].length === 0 && this.numCities > 1) {
        this.localHeuristics[city2_idx] = [city1_idx];
      }
    }
  }

  /**
   * Shuffles an array in place using the Fisher-Yates algorithm.
   * @param {Array} array - The array to shuffle.
   */
  _shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Starts the main solving process.
   * It iterates through K values (from 0 to maxK), performing searches for each K.
   * The process yields to the event loop between K-iterations using setTimeout.
   */
  solve() {
    if (this.numCities === 0) {
        if (this.debug) console.log("END (no cities)", this.id, this.iteration, this.improvements);
        this._sendStats(); // Send initial stats if no cities
        self.postMessage({
            type: 'solution',
            id: this.id,
            route: [],
            distance: 0,
            iteration: 0,
            improvements: 0,
            currentK: 0,
        });
        return;
    }
    if (this.numCities === 1) {
        if (this.debug) console.log("END (1 city)", this.id, this.iteration, this.improvements);
        this.bestRoute = [0];
        this.bestDistance = 0;
        this._sendStats();
        self.postMessage({
            type: 'solution',
            id: this.id,
            route: [0],
            distance: 0,
            iteration: 0,
            improvements: 0,
            currentK: 0,
        });
        return;
    }


    this.currentK = 0; // Start exploration with K=0

    const solveLoop = () => {
      // Termination condition: either explicitly stopped or explored up to maxK
      if (!this.isRunning || this.currentK > this.maxK) {
        if (this.debug) console.log("END", this.id, this.iteration.toLocaleString('es-ES'), this.improvements);
        this._sendStats(); // Send final stats
        self.postMessage({
          type: 'solution',
          id: this.id,
          route: this.bestRoute,
          distance: this.bestDistance,
          iteration: this.iteration,
          improvements: this.improvements,
          // Report the K value for which the last full search was completed.
          // If currentK is 0 (no search done yet) or 1 (search for K=0 done), report 0.
          // Otherwise, currentK has been incremented, so K just completed was currentK-1.
          currentK: (this.currentK === 0 ? 0 : this.currentK - 1),
        });
        return;
      }

      this.improvedInRound = true; // Assume improvement for the first round with current K, or reset if K just incremented
      let round = 0;
      // Keep exploring with the current K as long as improvements are being found in a round
      while (this.improvedInRound && this.isRunning) {
        this.improvedInRound = false; // Reset for this round; will be set true by _updateBestRoute if improvement found
        round++;
        if (this.debug) console.log("K:", this.currentK, "Round:", round, "InstanceID:", this.id);

        // Create a shuffled order of city indices to start exploration from
        // This introduces the stochastic element.
        const cityOrderToExplore = [...Array(this.numCities).keys()];
        this._shuffleArray(cityOrderToExplore);

        for (let i = 0; i < this.numCities; i++) {
          if (!this.isRunning) break; // Check for stop signal within the loop
          const startCityIndex = cityOrderToExplore[i];
          // Initialize set of remaining cities for this exploration path
          const remainingCities = new Set(this.cities.map((_, index) => index).filter(j => j !== startCityIndex));
          // Start the systematic search from this startCity
          this._systematicAlternativesSearch(remainingCities, [startCityIndex], this.currentK);
        }
      }

      this.currentK++; // Move to the next K value
      setTimeout(solveLoop, 0); // Yield to event loop, then continue with the next K
    };

    setTimeout(solveLoop, 0); // Start the first iteration of the solve loop
  }

  /**
   * Signals the solver to stop its current execution.
   */
  stop() {
    this.isRunning = false;
    if (this.debug) console.log('Solver stop called for ID:', this.id);
  }
}

// --- Worker Global Scope ---

let solverInstance = null; // Holds the current SAS_Solver instance
let statsInterval = null;  // Interval ID for periodic stat updates

/**
 * Handles messages received by the worker from the main thread.
 * @param {MessageEvent} e - The message event.
 */
self.onmessage = function (e) {
  const messageData = e.data;

  if (messageData.type === 'start') {
    if (solverInstance) {
      solverInstance.stop(); // Ensure any previous instance is stopped
    }
    if (statsInterval) {
      clearInterval(statsInterval); // Clear any existing stats interval
    }

    if (messageData.cities && messageData.cities.length > 0) {
        // Create and start a new solver instance
        solverInstance = new SAS_Solver(messageData.cities, messageData.maxK, messageData.id, messageData.debug);
        solverInstance.solve();

        // Set up an interval to periodically send stats back to the main thread
        statsInterval = setInterval(() => {
            if (solverInstance && solverInstance.isRunning) {
            solverInstance._sendStats();
            }
        }, 1000); // Send stats every 1 second
    } else {
        // Handle cases with no cities or invalid input
        console.warn('Worker received start command with no cities for ID:', messageData.id);
        // Send a 'solution' message indicating no solution/work done
         self.postMessage({
            type: 'solution',
            id: messageData.id || 'UNKNOWN',
            route: [],
            distance: 0,
            iteration: 0,
            improvements: 0,
            currentK: 0,
        });
    }


  } else if (messageData.type === 'stop') {
    if (solverInstance) {
      solverInstance.stop(); // Signal the current solver instance to stop
    }
    if (statsInterval) {
      clearInterval(statsInterval); // Stop sending periodic stats
      statsInterval = null;
    }
    if (solverInstance && solverInstance.debug) console.log('Worker received stop message for ID:', messageData.id);
  }
};
