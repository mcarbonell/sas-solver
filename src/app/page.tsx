import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, BrainCircuit, Waypoints } from "lucide-react";
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
          Explore the Systematic Alternatives Search (SAS) meta-algorithm, run experiments, and analyze performance for NP-hard problems.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 mb-12 items-center">
        <div>
          <h2 className="text-3xl font-semibold mb-4">What is SAS?</h2>
          <p className="text-muted-foreground mb-6 text-lg">
            Systematic Alternatives Search (SAS) is a novel meta-algorithm designed for tackling complex NP-hard optimization problems. It combines systematic exploration with learned heuristics to efficiently find high-quality solutions.
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
            alt="Abstract representation of SAS algorithm"
            width={600}
            height={400}
            className="rounded-lg shadow-xl object-cover"
            data-ai-hint="abstract algorithm"
          />
        </div>
      </div>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-center mb-8">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Waypoints className="h-10 w-10 text-primary mb-2" />
              <CardTitle>TSP Solver</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visualize SAS solving Traveling Salesman Problem instances. Input your data and see the algorithm in action.
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
                Leverage AI to analyze benchmark data and estimate performance functions for the SAS algorithm.
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
                Dive deep into the SAS algorithm, its parameters, and applications through interactive documentation.
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
