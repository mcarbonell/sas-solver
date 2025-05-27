
# SAS Solver Suite

The SAS Solver Suite is a Next.js web application designed for visualizing, analyzing, and experimenting with the Systematic Alternatives Search (SAS) meta-algorithm. It is primarily focused on solving the Traveling Salesman Problem (TSP) but is designed with the potential for generalization to other NP-hard problems.

The application provides an interactive interface to load standard TSPLIB instances or custom data, run the SAS algorithm with configurable parameters (like `Max K`), and observe its performance.

## Key Features

*   **TSP Solver with SAS Algorithm:** Implements the core Systematic Alternatives Search algorithm in a web worker for non-blocking execution.
*   **Visualization:**
    *   Displays TSP instances (city coordinates) on an HTML canvas.
    *   Visualizes the solution paths found by the SAS algorithm in real-time.
*   **Interactive Controls:**
    *   Select from a list of TSPLIB instances or input custom data.
    *   Configure `Max K` (number of systematic alternatives).
    *   Run single solver instances or stop the current execution.
*   **Real-time Feedback:**
    *   Displays statistics during solver execution: iterations, improvements, current K value, and best distance found.
    *   Shows elapsed time for solver runs.
*   **Optimal Solution Comparison:**
    *   Loads known optimal solutions for TSPLIB instances.
    *   Compares the SAS algorithm's results against these optima.
    *   Calculates and displays the approximation ratio.
*   **Batch Analysis:**
    *   Execute the solver multiple times (a batch) on a selected instance.
    *   View progress (current run, total runs, estimated time remaining).
    *   Get aggregated statistics for the batch:
        *   Min/Max/Avg distance and approximation ratios.
        *   Total times the optimal solution was found.
        *   Probability of finding the optimal in 10 runs (based on batch success rate).
        *   Average time per run and total batch execution time.
        *   Instance name and `Max K` used for the batch.
    *   **Solution Distribution Histogram:** Visualizes the frequency of different path lengths found across all runs in a batch.
*   **Documentation:**
    *   Overview page explaining the project.
    *   Detailed documentation page for the SAS algorithm, its concepts, observed performance, and usage guide.
*   **Modular Design:** Utilizes ShadCN UI components for a clean and responsive interface, and Recharts for charting.

## SAS Algorithm (Brief Overview)

Systematic Alternatives Search (SAS) is a meta-algorithm that combines systematic search with adaptive learning. For a given problem (e.g., TSP) and a local heuristic (e.g., nearest city):
1.  It explores deviations from the local heuristic up to `K` "alternatives" (non-best choices).
2.  When a globally better solution is found, the local heuristics of the involved components are updated to prioritize choices that led to the improvement. This allows the algorithm to "learn" and find the new best path more easily (with a lower `K`) in subsequent searches.
3.  Stochastic elements, like randomizing the order of starting points, help explore diverse parts of the search space.

## Tech Stack

*   **Frontend:** Next.js, React, TypeScript
*   **UI:** ShadCN UI, Tailwind CSS
*   **Charting:** Recharts
*   **Background Processing:** Web Workers
*   **Styling:** CSS Variables, Geist Font

## Getting Started

*(Instructions for local setup can be added here if needed, e.g., clone repository, npm install, npm run dev)*

The application is structured with different pages accessible via the sidebar:
*   **Overview:** General introduction.
*   **Documentation:** In-depth information about the SAS algorithm.
*   **TSP Solver:** The main interface for running SAS on TSP instances.
*   **Knapsack Solver:** (Placeholder for future development)
*   **Benchmark Analysis:** (Placeholder for future automated benchmarking)
*   **AI Estimation:** (Placeholder for AI-driven performance analysis)

---

This project aims to provide a comprehensive platform for understanding and evaluating the SAS meta-algorithm.
