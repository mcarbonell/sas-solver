
# SAS Solver Suite - TODO List

This document outlines planned features, improvements, and areas for future development for the SAS Solver Suite.

## Core Algorithm & Solver Enhancements

*   [ ] **TSP Solver - Advanced Controls:**
    *   [ ] Allow dynamic adjustment of `K` during a run or between batch runs.
    *   [ ] Implement different initial tour generation strategies (e.g., nearest neighbor, random insertion, user-defined).
    *   [ ] Option to set a time limit for solver runs.
    *   [ ] Option to stop after a certain number of non-improving iterations.
*   [ ] **Parallel Solving (TSP):**
    *   [ ] Implement the experimental QuadTree-based parallel decomposition and solving (from `ksolver3.html`).
    *   [ ] UI to configure parallel execution parameters (e.g., number of regions/workers).
*   [ ] **Generalize SAS:**
    *   [ ] Refactor `solve-worker.js` to better separate TSP-specific logic from the core SAS meta-algorithm.
    *   [ ] Define a clear interface/API for applying SAS to new problems.
*   [ ] **Knapsack Problem Solver:**
    *   [ ] Design and implement the Knapsack problem solver page.
    *   [ ] Adapt or apply SAS to the Knapsack problem (define local heuristic, alternatives).
    *   [ ] UI for inputting Knapsack instance data (items, weights, values, capacity).
    *   [ ] Visualization of Knapsack solutions.

## User Interface & Experience (UX)

*   [ ] **TSP Solver - Canvas Interaction:**
    *   [ ] Allow users to click on the canvas to add cities.
    *   [ ] Allow users to select and delete cities from the canvas.
    *   [ ] Display city IDs or indices on the canvas (toggleable).
*   [ ] **Data Management:**
    *   [ ] Allow users to save their custom TSP instances (e.g., to local storage or Firebase).
    *   [ ] Allow users to load previously saved custom instances.
    *   [ ] Export batch run results (e.g., as CSV or JSON).
*   [ ] **Visualizations:**
    *   [ ] More sophisticated charts for batch analysis (e.g., scatter plot of time vs. quality, convergence graphs).
    *   [ ] Visual cues for optimal solution found (e.g., highlight path in green).
    *   [ ] "Solution found" notification/toast.
*   [ ] **Settings Persistence:** Persist user settings like last used `Max K`, selected instance, theme (dark/light) using local storage.
*   [ ] **Error Handling:** More user-friendly error messages and recovery options.
*   [ ] **Accessibility (a11y):** Review and improve accessibility of all components.

## Benchmark Analysis Page

*   [ ] **Automated Benchmarking:**
    *   [ ] Implement functionality to run SAS against a suite of TSPLIB instances automatically.
    *   [ ] Allow selection of algorithms to compare against (e.g., simple Greedy, 2-Opt, LKH if possible to integrate).
    *   [ ] Collect and store benchmark results.
*   [ ] **Data Visualization:**
    *   [ ] Display comparison charts (e.g., average approximation ratio vs. problem size, time vs. problem size).
    *   [ ] Statistical significance tests for comparisons.
*   [ ] **Replace Mock Data:** Use actual collected benchmark data instead of current mock data.

## AI Performance Estimation Page

*   [ ] **Data Input:** Allow users to upload or paste their own algorithm benchmark data.
*   [ ] **Flow Integration:** Ensure the Genkit flow `estimateAlgorithmPerformance` can correctly process user-provided data.
*   [ ] **Result Presentation:** Refine the presentation of AI-generated estimations, insights, and confidence levels.
*   [ ] **Image Generation:** Explore using Genkit image generation for illustrative graphics based on AI insights (if applicable).

## Documentation & Content

*   [ ] **Expand Documentation:**
    *   [ ] More detailed explanations of SAS algorithm variants or advanced parameters.
    *   [ ] In-depth analysis of experimental results and their implications.
    *   [ ] Comparison with other metaheuristics (theoretical and/or empirical).
*   [ ] **User Guides:** Create detailed user guides for each section of the application.
*   [ ] **Project Write-up:** Prepare a comprehensive document or paper detailing the SAS algorithm, its implementation, and experimental evaluation.

## Technical Debt & Refinements

*   [ ] **Code Refactoring:**
    *   [ ] Review and refactor `TspSolverPage` component for better state management and separation of concerns.
    *   [ ] Improve modularity of `solve-worker.js`.
*   [ ] **Performance Optimization:**
    *   [ ] Further optimize communication between the main thread and the web worker.
    *   [ ] Profile and optimize canvas drawing if it becomes a bottleneck for very large instances.
*   [ ] **Testing:**
    *   [ ] Add unit tests for critical functions (e.g., TSPLIB parsing, distance calculations).
    *   [ ] Add integration tests for solver functionality and batch analysis.
*   [ ] **Build & Deployment:** Streamline build process and configure for Firebase App Hosting.
*   [ ] **Robust Stop for Batch:** Implement a more immediate stop mechanism for batch runs that can interrupt between iterations cleanly.
*   [ ] **State Management:** Consider a more robust state management solution if component complexity grows significantly (e.g., Zustand, Jotai).
