
/**
 * @fileOverview SAS (Systematic Alternatives Search) Solver Web Worker
 *
 * This worker implements the SAS algorithm for solving TSP instances.
 * It receives city data and parameters from the main thread, runs the
 * SAS algorithm, and posts back progress (stats, improvements) and the
 * final solution.
 *
 * Original concept by M. Carbonell, refactored into a class structure.
 */

class SAS_Solver {
  constructor() {
    this.id = ''; // Identifier for the current task/instance
    this.cities = []; // Array of city objects { x: number, y: number }
    this.numCities = 0;
    this.maxK = 0; // Max K for systematic alternatives
    this.debug = false;

    this.bestRoute = [];
    this.bestPossibleDistance = 0; // Theoretical lower bound (sum of 2 nearest for each city / 2)

    this.stats = {
      iteration: 0,
      improvements: 0,
      currentK: 0, // K value currently being processed / reported
      bestDistance: Infinity,
    };

    this.currentK = 0; // Actual K value used in the main solve loop controller
    this.distances = []; // 2D array for precomputed distances
    this.initialHeuristics = []; // Heuristics based on initial distances
    this.localHeuristics = []; // Adaptive heuristics, modified during search

    this.isRunning = false;
    this.improved = false; // Flag to track if an improvement was made in a pass

    // For detailed progress reporting
    this.currentCityIndexInLoop = undefined;
    this.totalCitiesInLoop = undefined;

    // Bind self for postMessage context if needed, or ensure it's used correctly
    this.postMessage = self.postMessage.bind(self);
    self.onmessage = this.onmessage.bind(this);
  }

  /**
   * Handles messages from the main thread.
   * @param {MessageEvent} event - The message event.
   */
  onmessage(event) {
    const payload = event.data;

    if (payload.type === 'start') {
      this.id = payload.id;
      this.cities = payload.cities;
      this.numCities = this.cities.length;
      
      // Defensively parse maxK, default to 0 if undefined or NaN
      const parsedMaxK = parseInt(payload.maxK, 10);
      this.maxK = isNaN(parsedMaxK) ? 0 : parsedMaxK;

      this.debug = payload.debug;

      this.resetState();
      this.isRunning = true;

      if (this.numCities > 0) {
        this.initializeData();
        this.solve();
      } else {
        // Handle case with no cities if necessary, e.g., send back an empty solution
        this.postMessage({
          type: 'solution',
          id: this.id,
          route: [],
          distance: 0,
          iteration: 0,
          improvements: 0,
          currentK: 0,
        });
        this.isRunning = false;
      }
    } else if (payload.type === 'stop') {
      this.onStop();
    }
  }

  /**
   * Resets the solver's internal state for a new run.
   */
  resetState() {
    this.bestRoute = [];
    this.stats = {
      iteration: 0,
      improvements: 0,
      currentK: 0,
      bestDistance: Infinity,
    };
    this.currentK = 0;
    this.isRunning = false;
    this.improved = false;
    this.currentCityIndexInLoop = undefined;
    this.totalCitiesInLoop = undefined;
  }

  /**
   * Initializes data structures like distance matrix and heuristics.
   */
  initializeData() {
    // Precompute distances between all pairs of cities
    this.distances = this.cities.map((city1, i) =>
      this.cities.map((city2, j) => (i === j ? 0 : this.calculateEuclideanDistance(city1, city2)))
    );

    // Initialize heuristics (sorted list of neighbors by distance)
    this.initialHeuristics = this.cities.map((_, i) =>
      this.cities
        .map((_, j) => j)
        .filter((j) => j !== i)
        .sort((a, b) => this.distances[i][a] - this.distances[i][b])
    );
    this.localHeuristics = JSON.parse(JSON.stringify(this.initialHeuristics)); // Deep copy

    // Calculate a simple lower bound for best possible distance
    this.bestPossibleDistance = 0;
    const minPossiblePerCity = [];
    for (let i = 0; i < this.numCities; i++) {
      if (this.initialHeuristics[i].length >= 2) {
        const neighbor1 = this.initialHeuristics[i][0];
        const neighbor2 = this.initialHeuristics[i][1];
        minPossiblePerCity[i] = this.distances[i][neighbor1] + this.distances[i][neighbor2];
        this.bestPossibleDistance += minPossiblePerCity[i];
      } else if (this.initialHeuristics[i].length === 1) {
        // If only one other city, distance is to it (doubled then halved)
         const neighbor1 = this.initialHeuristics[i][0];
         minPossiblePerCity[i] = this.distances[i][neighbor1] * 2; // Approximation
         this.bestPossibleDistance += minPossiblePerCity[i];
      }
    }
    this.bestPossibleDistance /= 2;
  }

  /**
   * Calculates the Euclidean distance between two cities, rounded to the nearest integer.
   * @param {object} city1 - The first city {x, y}.
   * @param {object} city2 - The second city {x, y}.
   * @returns {number} The rounded Euclidean distance.
   */
  calculateEuclideanDistance(city1, city2) {
    return Math.round(
      Math.sqrt(Math.pow(city2.x - city1.x, 2) + Math.pow(city2.y - city1.y, 2))
    );
  }

  /**
   * Calculates the total distance of a given route.
   * @param {number[]} route - An array of city indices.
   * @returns {number} The total distance of the route.
   */
  calculateTotalRouteDistance(route) {
    if (route.length < 2) return 0;
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += this.distances[route[i]][route[i + 1]];
    }
    // Add distance from last city back to the first
    totalDistance += this.distances[route[route.length - 1]][route[0]];
    return totalDistance;
  }

  /**
   * Shuffles an array in place.
   * @param {Array} array - The array to shuffle.
   */
  shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex !== 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
  }

  /**
   * Sends statistics to the main thread.
   * @param {number} [currentCityIndexInLoop] - Optional: current city index in the main solve loop.
   * @param {number} [totalCitiesInLoop] - Optional: total cities in the main solve loop.
   */
  sendStats(currentCityIndexInLoop, totalCitiesInLoop) {
    this.currentCityIndexInLoop = currentCityIndexInLoop; // Can be undefined if called from checkRoute or end
    this.totalCitiesInLoop = totalCitiesInLoop;   // Can be undefined
    this.stats.currentK = this.currentK;          // Make sure reported K is the true K

    this.postMessage({
      type: 'stats',
      id: this.id,
      iteration: this.stats.iteration,
      improvements: this.stats.improvements,
      bestDistance: this.stats.bestDistance,
      currentK: this.stats.currentK,
      bestPossibleDistance: this.bestPossibleDistance,
      currentCityIndexInLoop: this.currentCityIndexInLoop,
      totalCitiesInLoop: this.totalCitiesInLoop,
    });
  }

  /**
   * Updates the best route found so far and notifies the main thread.
   * @param {number} routeDistance - The distance of the new best route.
   * @param {number[]} currentRoute - The new best route.
   */
  updateBestRoute(routeDistance, currentRoute) {
    this.improved = true; // Set flag that an improvement was made in this pass
    this.stats.improvements += 1;
    this.stats.bestDistance = routeDistance;
    this.bestRoute = [...currentRoute];

    // Update local heuristics based on the new best route
    this.updateLocalHeuristics(this.bestRoute);

    // Send an 'improvement' message to the main thread
    this.postMessage({
      type: 'improvement',
      id: this.id,
      route: this.bestRoute,
      distance: this.stats.bestDistance,
      iteration: this.stats.iteration,
      improvements: this.stats.improvements,
      currentK: this.stats.currentK,
      currentCityIndexInLoop: this.currentCityIndexInLoop,
      totalCitiesInLoop: this.totalCitiesInLoop,
    });
  }

  /**
   * Checks if a new route is better than the current best and updates if so.
   * Also handles periodic stats updates.
   * @param {number[]} currentRoute - The route to check.
   */
  checkRoute(currentRoute) {
    this.stats.iteration += 1;
    const routeDistance = this.calculateTotalRouteDistance(currentRoute);

    if (routeDistance < this.stats.bestDistance) {
      this.updateBestRoute(routeDistance, currentRoute);
    }

    // Send stats periodically.
    // Consider if this is too frequent or should be less often,
    // as stats are also sent per city in the main `solve` loop.
    if (this.stats.iteration > 0 && (this.stats.iteration % 100000 === 0)) {
      this.sendStats(this.currentCityIndexInLoop, this.totalCitiesInLoop);
    }
  }

  /**
   * Updates the local heuristics by promoting connections from the improved route.
   * @param {number[]} improvedRoute - The route that led to an improvement.
   */
  updateLocalHeuristics(improvedRoute) {
    if (improvedRoute.length < 2) return;
    for (let i = 0; i < improvedRoute.length; i++) {
      const city1 = improvedRoute[i];
      const city2 = improvedRoute[(i + 1) % improvedRoute.length]; // Next city, wraps around

      // For city1, if city2 is not already its top heuristic, make it so.
      if (this.localHeuristics[city1][0] !== city2) {
        this.localHeuristics[city1] = [
          city2,
          ...this.localHeuristics[city1].filter((c) => c !== city2),
        ];
      }
      // For city2, if city1 is not already its top heuristic, make it so.
      if (this.localHeuristics[city2][0] !== city1) {
        this.localHeuristics[city2] = [
          city1,
          ...this.localHeuristics[city2].filter((c) => c !== city1),
        ];
      }
    }
  }

  /**
   * The core recursive search function.
   * @param {Set<number>} remainingCities - Set of city indices yet to be visited.
   * @param {number[]} currentRoute - Array of city indices forming the current path.
   * @param {number} alternativesLeft - Number of non-best heuristic choices allowed.
   */
  systematicAlternativesSearch(remainingCities, currentRoute, alternativesLeft) {
    if (!this.isRunning) return;

    if (remainingCities.size === 0) {
      this.checkRoute(currentRoute);
      return;
    }

    const currentCity = currentRoute[currentRoute.length - 1];
    const heuristicOrder = this.localHeuristics[currentCity];
    let validCitiesFound = 0; // Tracks how many valid heuristic choices we've tried from this node

    for (let i = 0; i < heuristicOrder.length; i++) {
      if (!this.isRunning) return;

      const nextCity = heuristicOrder[i];
      if (remainingCities.has(nextCity)) {
        validCitiesFound++; // This is the 'k-th' valid choice we are making
        
        // If we've used more alternatives than allowed (validCitiesFound > 1 means we are not taking the 0-th alternative)
        if ((validCitiesFound - 1) > alternativesLeft) {
            break; // Stop exploring further alternatives from this city
        }

        currentRoute.push(nextCity);
        remainingCities.delete(nextCity);

        this.systematicAlternativesSearch(
          remainingCities,
          currentRoute,
          alternativesLeft - (validCitiesFound - 1) // Alternatives consumed by this choice
        );

        remainingCities.add(nextCity); // Backtrack
        currentRoute.pop();            // Backtrack
      }
    }
  }

  /**
   * Main solving loop. Iterates through K values and manages search passes.
   */
  async solve() {
    if (this.numCities === 0) {
        this.isRunning = false;
        this.postMessage({ type: 'solution', id: this.id, route: [], distance: 0, iteration: 0, improvements: 0, currentK: 0 });
        return;
    }

    // Initial greedy solution (K=0)
    // Often the first improvement comes from the first full pass with K=0
    this.currentK = 0; // Controller for K
    this.stats.currentK = this.currentK; // Set initial reported K

    // Loop for K, from 0 up to maxK
    while (this.isRunning && this.currentK <= this.maxK) {
      this.stats.currentK = this.currentK; // Update reported K for this K-level
      this.improved = true; // Assume improvement for this K value to start the inner loop
      let round = 0; // Counter for rounds within the same K

      // Inner loop: iterate while improvements are found for the current K
      while (this.isRunning && this.improved) {
        this.improved = false; // Reset 'improved' flag for this new pass/round
        round++;
        
        const order = [...Array(this.numCities).keys()];
        this.shuffle(order); // Randomize order of starting cities for this pass

        // Loop through each city as a potential starting point for the current K and round
        for (let i = 0; i < this.numCities; i++) {
          if (!this.isRunning) break; // Check if stop was requested

          // Send stats for the current city in the loop
          this.sendStats(i + 1, this.numCities);

          const startCity = order[i];
          const remainingCities = new Set(
            [...Array(this.numCities).keys()].filter((j) => j !== startCity)
          );
          this.systematicAlternativesSearch(
            remainingCities,
            [startCity],
            this.currentK // Pass the current K
          );
        }
        if (!this.isRunning) break; // Check if stop was requested during the city loop
      } // End of inner while loop (no more improvements for current K)

      if (!this.isRunning) break; // If master instructed to stop during K processing

      this.currentK++; // Increment K to explore deeper alternatives
    } // End of outer while loop for K

    // All K values explored up to maxK, or stopped early
    if (this.isRunning) {
      this.sendStats(); // Send final stats before concluding
      this.postMessage({
        type: 'solution',
        id: this.id,
        route: this.bestRoute,
        distance: this.stats.bestDistance,
        iteration: this.stats.iteration,
        improvements: this.stats.improvements,
        currentK: this.stats.currentK, 
      });
    }
    this.isRunning = false; // Ensure worker state is set to not running
  }

  /**
   * Handles a 'stop' message from the main thread.
   */
  onStop() {
    this.isRunning = false;
    if (this.debug) console.log(`Worker ${this.id} received stop command.`);
  }
}

// Instantiate the solver when the worker is created.
// The actual start command will come via onmessage.
new SAS_Solver();
