import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, Construction } from "lucide-react";
import Image from "next/image";

export default function KnapsackSolverPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-12">
        <div className="flex items-center mb-4">
          <Archive className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-4xl font-bold tracking-tight">
            Knapsack Problem Solver
          </h1>
        </div>
        <p className="text-xl text-muted-foreground">
          This section is currently under development.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Construction className="mr-2 h-6 w-6 text-amber-500" />
            Feature Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Image 
            src="https://placehold.co/400x300.png" 
            alt="Under construction" 
            width={400} 
            height={300} 
            className="mx-auto rounded-lg mb-6 shadow-md"
            data-ai-hint="construction tools"
          />
          <p className="text-lg text-muted-foreground mb-2">
            We are working hard to extend the SAS Solver Suite to include a Knapsack problem solver.
          </p>
          <p className="text-lg text-muted-foreground">
            Stay tuned for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
