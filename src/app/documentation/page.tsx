import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Cpu, Puzzle, Settings, ListChecks } from "lucide-react";
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
        <div className="md:col-span-2">
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Cpu className="mr-2 h-6 w-6 text-primary"/>What is SAS?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-4">
                The Systematic Alternatives Search (SAS) is a sophisticated meta-algorithm designed to tackle NP-hard optimization problems. It distinguishes itself by intelligently navigating vast solution spaces, combining principles of systematic search with adaptive, learning-based heuristics. SAS is not reliant on neural networks but employs its own mechanism for learning and refining search strategies.
              </p>
              <p className="text-lg">
                Its core strength lies in its ability to balance exploration of new solution areas with exploitation of promising regions, making it effective for problems where traditional heuristics might get stuck in local optima.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Puzzle className="mr-2 h-6 w-6 text-primary"/>Core Concepts</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-lg font-semibold">Systematic Search Backbone</AccordionTrigger>
                  <AccordionContent className="text-base">
                    SAS utilizes a structured approach to explore the solution space, ensuring comprehensive coverage over time. This might involve techniques like branch-and-bound or iterative deepening, adapted for meta-heuristic control.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-lg font-semibold">Learning Heuristics</AccordionTrigger>
                  <AccordionContent className="text-base">
                    A key feature of SAS is its ability to learn and adapt its heuristic choices during the search. It evaluates the performance of different local search operators or construction rules and prioritizes those that have proven effective for the current problem instance or phase of the search.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-lg font-semibold">Alternative Generation</AccordionTrigger>
                  <AccordionContent className="text-base">
                    SAS actively generates and evaluates alternative search paths or solution modifications. This allows it to escape local optima and discover diverse, high-quality solutions.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-lg font-semibold">Application to NP-Hard Problems</AccordionTrigger>
                  <AccordionContent className="text-base">
                    While demonstrated effectively for the Traveling Salesman Problem (TSP) using TSPLIB instances, SAS is designed as a general meta-algorithm applicable to a wide range of NP-hard problems, including the Knapsack problem, scheduling problems, and more.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-5">
                  <AccordionTrigger className="text-lg font-semibold">Reinforcement Learning Potential</AccordionTrigger>
                  <AccordionContent className="text-base">
                    The learning mechanism within SAS shares conceptual similarities with reinforcement learning (RL). Future research could explore formalizing this connection and leveraging RL techniques to further enhance SAS's adaptive capabilities.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Settings className="mr-2 h-6 w-6 text-primary"/>Key Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>Iteration Limit:</strong> Max number of search iterations.</li>
                <li><strong>Population Size (if applicable):</strong> Number of solutions maintained.</li>
                <li><strong>Learning Rate:</strong> Controls adaptation speed of heuristics.</li>
                <li><strong>Exploration Factor:</strong> Balances exploration vs. exploitation.</li>
                <li><strong>Problem-Specific Operators:</strong> Heuristics tailored to the problem (e.g., 2-opt for TSP).</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><ListChecks className="mr-2 h-6 w-6 text-primary"/>Usage Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-base">
                To use SAS:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-base">
                <li>Select the problem type (e.g., TSP).</li>
                <li>Provide the problem instance data.</li>
                <li>Configure SAS parameters or use defaults.</li>
                <li>Run the solver and analyze the results.</li>
              </ol>
              <div className="mt-4">
                <Image 
                  src="https://placehold.co/300x200.png" 
                  alt="Code snippet example" 
                  width={300} 
                  height={200} 
                  className="rounded-md shadow-md"
                  data-ai-hint="code snippet"
                />
                 <p className="text-xs text-muted-foreground mt-1 text-center">Illustrative setup for SAS</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
