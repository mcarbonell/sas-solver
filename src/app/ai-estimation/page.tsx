import { BrainCircuit } from "lucide-react";
import { EstimationForm } from "./estimation-form";

export default function AiEstimationPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-12">
        <div className="flex items-center mb-4">
          <BrainCircuit className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-4xl font-bold tracking-tight">
            AI-Powered Performance Estimation
          </h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Use generative AI to analyze algorithm benchmarking data and estimate performance functions.
        </p>
      </header>

      <EstimationForm />
    </div>
  );
}
