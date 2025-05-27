
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Cpu, Puzzle, Settings, ListChecks, BarChart2, Lightbulb } from "lucide-react";
import Image from "next/image";

export default function DocumentationPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-12">
        <div className="flex items-center mb-4">
          <BookOpen className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-4xl font-bold tracking-tight">
            SAS Algorithm Documentation
          </h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Understanding the Systematic Alternatives Search (SAS) Meta-Algorithm.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Cpu className="mr-2 h-6 w-6 text-primary"/>What is SAS?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-4">
                The Systematic Alternatives Search (SAS) is a sophisticated meta-algorithm designed to tackle NP-hard optimization problems. It distinguishes itself by intelligently navigating vast solution spaces. SAS combines principles of systematic search (exploring deviations from a local heuristic) with an adaptive, learning-based mechanism that refines its search strategy over time.
              </p>
              <p className="text-lg mb-4">
                Its core strength lies in its ability to balance exploration of new solution areas with exploitation of promising regions. When a globally better solution is found, SAS updates its local heuristics, effectively "learning" to favor choices that led to the improvement. This makes it particularly effective for problems where traditional heuristics might get stuck in local optima.
              </p>
               <p className="text-lg">
                The depth of systematic exploration is controlled by a parameter 'K', representing the number of "alternatives" or non-best heuristic choices allowed. Increasing 'K' allows for a deeper search at a higher computational cost (roughly N^(K+2) for TSP).
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Puzzle className="mr-2 h-6 w-6 text-primary"/>Core Concepts</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-lg font-semibold">Systematic Search & Alternatives (K)</AccordionTrigger>
                  <AccordionContent className="text-base">
                    SAS utilizes a structured approach, exploring the solution space by systematically allowing a certain number (`K`) of deviations from the best local heuristic choice (e.g., nearest city in TSP). `K=0` represents a greedy approach. Increasing `K` allows deeper exploration of alternatives.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-lg font-semibold">Adaptive Learning Heuristics</AccordionTrigger>
                  <AccordionContent className="text-base">
                    A key feature is its ability to learn and adapt. When a new best global solution is found, the local heuristics of the involved components (e.g., cities in TSP) are updated. Specifically, the connections forming the new best path are prioritized (e.g., moved to the top of an ordered list of neighbors), making it easier for the algorithm to find this improved path with a lower `K` in subsequent searches.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-lg font-semibold">Stochastic Element</AccordionTrigger>
                  <AccordionContent className="text-base">
                    The algorithm incorporates a stochastic element, for example, by shuffling the order in which starting points for local searches are chosen. This helps in exploring diverse parts of the search space over multiple runs and contributes to escaping local optima.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-lg font-semibold">Application to NP-Hard Problems</AccordionTrigger>
                  <AccordionContent className="text-base">
                    While demonstrated effectively for the Traveling Salesman Problem (TSP) using TSPLIB instances, SAS is designed as a general meta-algorithm applicable to a wide range of NP-hard problems where local heuristics can be defined.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><BarChart2 className="mr-2 h-6 w-6 text-primary"/>Observed Performance & Insights (TSP)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base">
                Experiments on TSPLIB instances (e.g., berlin52, eil76) have shown promising results:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>Optimal Solutions Found:</strong> SAS can find known optimal solutions for instances like `berlin52` (7542) and `eil76` (538) rapidly, often in a few seconds with a low `K` value (e.g., K=3).</li>
                <li><strong>Excellent Approximation Ratios:</strong> Even when not hitting the exact optimum in every run, average approximation ratios are consistently very good (e.g., ~1.0073 for eil76 with K=3 over 100 runs).</li>
                <li><strong>Impact of K:</strong>
                  <ul className="list-circle list-inside pl-4 mt-1 space-y-1">
                    <li>Low K (e.g., 1-2): Extremely fast execution per run. Good for quick, quality approximations. Lower probability of finding the exact optimum per single run, but many runs can be done quickly.</li>
                    <li>Higher K (e.g., 3): Better average solution quality and higher probability of finding the optimum per run, at the cost of longer execution time per run.</li>
                  </ul>
                </li>
                <li><strong>Stochastic Nature & Batch Analysis:</strong> Due to random elements (like `shuffle(order)`), multiple runs (batch analysis) are highly beneficial to understand average performance, consistency, and the probability of finding optimal solutions.</li>
                <li><strong>Convergence Guideline:</strong> Empirical evidence suggests that `K` values around `log(N)` (where N is problem size) can be a good starting point for finding high-quality solutions, though this can vary by instance.</li>
              </ul>
              <div className="mt-4">
                <Image 
                  src="https://placehold.co/600x300.png" 
                  alt="Graph showing performance insights" 
                  width={600} 
                  height={300} 
                  className="rounded-md shadow-md object-cover w-full"
                  data-ai-hint="performance graph insights"
                />
                 <p className="text-xs text-muted-foreground mt-1 text-center">Illustrative chart of SAS performance metrics</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Settings className="mr-2 h-6 w-6 text-primary"/>Key Parameters (TSP Solver)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>K (Alternatives):</strong> Max number of non-best heuristic choices allowed per step. Controls search depth and computational cost. Small values (e.g., 1-3) are often effective.</li>
                <li><strong>TSP Instance:</strong> The problem data (city coordinates). Can be selected from TSPLIB or custom input.</li>
                <li><strong>Number of Runs (Batch):</strong> For batch analysis, specifies how many times to run the solver to gather statistics.</li>
                {/* <li><strong>Max Cities Per Region:</strong> (For future parallel implementation) Defines subproblem size.</li> */}
              </ul>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><ListChecks className="mr-2 h-6 w-6 text-primary"/>Usage Guide (TSP Solver)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-base">
                To use the TSP Solver:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-base">
                <li>Navigate to the <Link href="/tsp-solver" className="text-primary hover:underline">TSP Solver</Link> page.</li>
                <li>Select a TSP Instance from the dropdown or paste custom data.</li>
                <li>Set the 'Max K' parameter.</li>
                <li>Click "Run SAS Solver" for a single run, or set "Number of Runs" and click "Run Batch Analysis" for statistical insights.</li>
                <li>Observe the solution visualization, path length, optimal comparison, and other metrics.</li>
              </ol>
              <div className="mt-4">
                <Image 
                  src="https://placehold.co/300x200.png" 
                  alt="TSP Solver interface" 
                  width={300} 
                  height={200} 
                  className="rounded-md shadow-md"
                  data-ai-hint="solver interface"
                />
                 <p className="text-xs text-muted-foreground mt-1 text-center">TSP Solver configuration panel</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
