import { useState } from "react";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, BrainCircuit, Zap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PredictiveQcPanel() {
  const { data: projectsData } = trpc.projects.list.useQuery();

  const [params, setParams] = useState({
    wcRatio: "",
    cement: "",
    aggregate: "",
    temperature: "",
    additives: "",
    projectId: "0",
    concreteType: "Default Mix",
  });
  
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  const predictMutation = trpc.qualityTests.predict.useMutation({
    onSuccess: (data: any) => {
      setPrediction(data.prediction);
      setIsCached(data.cached || false);
      // If we provided context, we consider it calibrated
      setIsCalibrated(!!(params.projectId !== "0" || params.concreteType));
      toast.success(data.cached ? "Prediction loaded from cache!" : "Prediction generated successfully!");
    },
    onError: (error) => {
      toast.error(`Prediction failed: ${error.message}`);
    }
  });

  const handlePredict = () => {
    predictMutation.mutate({
      parameters: {
        wcRatio: params.wcRatio ? parseFloat(params.wcRatio) : undefined,
        cement: params.cement ? parseFloat(params.cement) : undefined,
        aggregate: params.aggregate ? parseFloat(params.aggregate) : undefined,
        temperature: params.temperature ? parseFloat(params.temperature) : undefined,
        additives: params.additives ? parseFloat(params.additives) : undefined,
        projectId: params.projectId !== "0" ? parseInt(params.projectId) : undefined,
        concreteType: params.concreteType || undefined,
      }
    });
  };

  return (
    <GlassCard variant="card" className="w-full">
      <GlassCardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <GlassCardTitle>Predictive QC Agent</GlassCardTitle>
        </div>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-medium text-lg text-white">Concrete Mix Parameters</h3>
            <p className="text-sm text-white/70">
              Enter the parameters below to get an AI-powered prediction on slump and compressive strength.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="project">Project Context (for Calibration)</Label>
                <Select 
                  value={params.projectId} 
                  onValueChange={(val) => setParams(p => ({ ...p, projectId: val }))}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">General (No Project)</SelectItem>
                    {projectsData?.map(project => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="concreteType">Concrete Type</Label>
                <Input
                  id="concreteType"
                  placeholder="e.g. C25/30"
                  value={params.concreteType}
                  onChange={(e) => setParams({ ...params, concreteType: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wcRatio">W/C Ratio</Label>
                <Input
                  id="wcRatio"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 0.45"
                  value={params.wcRatio}
                  onChange={(e) => setParams({ ...params, wcRatio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cement">Cement (kg/m³)</Label>
                <Input
                  id="cement"
                  type="number"
                  placeholder="e.g. 350"
                  value={params.cement}
                  onChange={(e) => setParams({ ...params, cement: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aggregate">Aggregate (kg/m³)</Label>
                <Input
                  id="aggregate"
                  type="number"
                  placeholder="e.g. 1850"
                  value={params.aggregate}
                  onChange={(e) => setParams({ ...params, aggregate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temp (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  placeholder="e.g. 25"
                  value={params.temperature}
                  onChange={(e) => setParams({ ...params, temperature: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additives">Additives (%)</Label>
                <Input
                  id="additives"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 1.5"
                  value={params.additives}
                  onChange={(e) => setParams({ ...params, additives: e.target.value })}
                />
              </div>
            </div>
            
            <Button
              className="w-full mt-4"
              onClick={handlePredict}
              disabled={predictMutation.isPending}
            >
              {predictMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Prediction...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  Predict Results
                </>
              )}
            </Button>
          </div>

          <div className="bg-black/20 rounded-xl p-4 border border-white/10 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-lg text-white">AI Prediction</h3>
              <div className="flex gap-2">
                {isCalibrated && prediction && (
                  <div className="flex items-center text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Calibrated
                  </div>
                )}
                {isCached && (
                  <div className="flex items-center text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full border border-yellow-400/20">
                    <Zap className="w-3 h-3 mr-1" />
                    Cached
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {prediction ? (
                <div className="prose prose-invert prose-sm max-w-none text-white/80 space-y-2">
                  {prediction.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-white/40 text-sm">
                  <p className="text-center max-w-[250px]">
                    Fill in the parameters and click 'Predict Results' to see AI-generated quality predictions.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
