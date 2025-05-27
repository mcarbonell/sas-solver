
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, BrainCircuit, Waypoints, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-4">
          Welcome to SAS Solver Suite
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Explore the Systematic Alternatives Search (SAS) meta-algorithm, run experiments, and analyze its impressive performance on NP-hard problems.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 mb-12 items-center">
        <div>
          <h2 className="text-3xl font-semibold mb-4">What is SAS?</h2>
          <p className="text-muted-foreground mb-3 text-lg">
            Systematic Alternatives Search (SAS) is an innovative meta-algorithm designed for tackling complex NP-hard optimization problems. It intelligently combines systematic exploration of deviation from local heuristics with adaptive, learning-based mechanisms.
          </p>
          <p className="text-muted-foreground mb-6 text-lg">
            SAS has demonstrated remarkable efficiency, finding optimal solutions for challenging TSP instances like 'berlin52' and 'eil76' in seconds, with excellent average approximation ratios.
          </p>
          <Button asChild size="lg">
            <Link href="/documentation">
              Learn More <BookOpen className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div>
          <Image
            src="https://placehold.co/600x400.png"
            alt="Abstract representation of the SAS algorithm's search path"
            width={600}
            height={400}
            className="rounded-lg shadow-xl object-cover"
            data-ai-hint="abstract algorithm network"
          />
        </div>
      </div>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-center mb-8">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Waypoints className="h-10 w-10 text-primary mb-2" />
              <CardTitle>TSP Solver & Analyzer</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visualize SAS solving TSP instances. Input data, configure parameters like 'K', run batch analyses, and compare results against known optima.
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/tsp-solver">Try TSP Solver <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BrainCircuit className="h-10 w-10 text-primary mb-2" />
              <CardTitle>AI Performance Estimation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Leverage generative AI to analyze benchmark data and estimate performance functions for algorithms like SAS.
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/ai-estimation">Estimate Performance <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Comprehensive Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Dive deep into the SAS algorithm, its core concepts, parameters, usage guide, and insights from observed performance.
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/documentation">Read Docs <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
      
      <footer className="text-center text-muted-foreground mt-16">
        <p>&copy; {new Date().getFullYear()} SAS Solver Suite. Built with Next.js and Firebase.</p>
      </footer>
    </div>
  );
}
