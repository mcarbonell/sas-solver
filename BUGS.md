
# SAS Solver Suite - Bug Tracker

This document lists bugs encountered during the development of the SAS Solver Suite and their resolutions.

## Resolved Bugs

1.  **Bug:** Incorrect Geist font import and usage.
    *   **Symptom:** Next.js build error `Module not found: Can't resolve 'next/font/google/target.css'` and runtime `TypeError: GeistSans is not a function`.
    *   **Cause:** `GeistSans` and `GeistMono` were being imported and used as if they were Google Fonts, but they are provided by the `geist` package.
    *   **Solution:**
        *   Changed imports to `import { GeistSans } from 'geist/font/sans';` and `import { GeistMono } from 'geist/font/mono';`.
        *   Added `"geist": "^1.3.0"` to `package.json`.
        *   Updated `<body>` className to use `GeistSans.variable` and `GeistMono.variable` directly.
    *   **Status:** Resolved.

2.  **Bug:** `next/image` component `Image` constructor error.
    *   **Symptom:** Runtime error `Error: Image constructor: 'new' is required` on pages using the `Image` component.
    *   **Cause:** Missing import for the `Image` component.
    *   **Solution:** Added `import Image from 'next/image';` to the affected files (e.g., `src/app/ai-estimation/estimation-form.tsx`).
    *   **Status:** Resolved.

3.  **Bug:** TSP instance files (e.g., `att48.tsp`) not found (404 error).
    *   **Symptom:** Fetch requests to `/k-search/tsplib/*.tsp` failed with a 404.
    *   **Cause:** Files outside the `public` directory are not directly fetchable from the client-side.
    *   **Solution:** Created a Next.js API route (`src/app/api/tsp-instance/route.ts`) to read TSP files from `k-search/tsplib` on the server and send their content to the client. Updated client-side fetch to use this API route.
    *   **Status:** Resolved.

4.  **Bug:** "No coordinates found in TSP file" (e.g., `st70.tsp`).
    *   **Symptom:** Error message indicating no coordinates were parsed from valid TSPLIB files.
    *   **Cause:** Incorrect line splitting in the `parseTSPLIB` function (`\\n` instead of `\n`).
    *   **Solution:** Changed `textData.split('\\n')` to `textData.split('\n')` in `src/app/tsp-solver/page.tsx`.
    *   **Status:** Resolved.

5.  **Bug:** Syntax error in `handleStopSolver` function.
    *   **Symptom:** Next.js build error `Parenthesized expression cannot be empty` pointing to `() = > {`.
    *   **Cause:** Extra space in the arrow function definition.
    *   **Solution:** Corrected `() = > {` to `() => {` in `src/app/tsp-solver/page.tsx`.
    *   **Status:** Resolved.

6.  **Bug:** Timer issues:
    *   Initial large time display on page load.
    *   Timer continued running after selecting a new TSP instance.
    *   Total Batch Time in summary was incorrect (e.g., showed 3 seconds when it took over a minute).
    *   **Cause (Initial large time & continuation):** Interaction of `startTime` and `elapsedTime` state during initial reset; timer interval not being cleared properly.
    *   **Cause (Incorrect Total Batch Time):** `currentElapsedTime` state not being updated synchronously before `setAggregatedBatchStats` was called OR `solverStartTimeRef` being reset/stale.
    *   **Solution:**
        *   Refactored timer logic to use `currentElapsedTime` (numeric ms), `solverStartTimeRef` (Date.now() timestamp), and a `useEffect` for `formattedTime`.
        *   Ensured `clearInterval` and state resets in `resetSolverState` and instance loading `useEffect`.
        *   For "Total Batch Time", ensured `finalBatchDuration` is calculated using a locally captured timestamp from the beginning of `handleRunBatchSolver` (`actualBatchStartTime`) to avoid issues with `solverStartTimeRef` potentially being stale or reset.
    *   **Status:** Resolved.

7.  **Bug:** Batch runs executed only one iteration, sometimes showing "Batch run stopped by user."
    *   **Symptom:** Regardless of "Number of Runs" input, only the first run of a batch would complete.
    *   **Cause:**
        *   Initial issue: Stale closure of `isBatchRunning` inside the `for` loop of `handleRunBatchSolver`.
        *   Later, a `useEffect` hook for loading TSP instances (dependent on `optimalSolutionsData`) was inadvertently terminating active workers and resetting batch state when `optimalSolutionsData` finished loading during a batch.
    *   **Solution:**
        *   Separated `useEffect` hooks for instance loading (which can stop workers) and optimal distance updates (which should not).
        *   Introduced `isBatchRunIntentActiveRef = useRef(false);` to manage the batch continuation intent, avoiding stale closures in the batch loop. Ensured this ref is set/reset correctly in `handleRunBatchSolver` and `handleStopSolver`.
        *   The `finally` block in `handleRunBatchSolver` now robustly resets `isBatchRunIntentActiveRef.current` and `setIsBatchRunning(false)`.
    *   **Status:** Resolved.

## Monitored Issues / Potential Future Bugs

*   **Batch Stop Robustness:** The "Stop Solver" button during a batch run currently relies on `isBatchRunIntentActiveRef.current` being checked at the start of each iteration. If an individual solver run is very long, the stop might not feel immediate. (Minor)
*   **Histogram Binning for Extreme Distributions:** The `prepareHistogramData` function uses a heuristic for binning. For datasets with very unusual distributions or extreme outliers, the binning might not be optimal. (Minor)
*   **Performance of `runSingleSolverInstance` Error Handling:** Wrapping worker creation in a try-catch inside the Promise in `runSingleSolverInstance` adds a small overhead. For very high-frequency, short-duration runs, this could be revisited if profiling shows it as a bottleneck. (Very Minor)

*(This file will be updated as new bugs are found and resolved.)*

