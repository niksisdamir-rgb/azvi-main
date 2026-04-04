import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/GlassCard";
import { GlassDialog, GlassDialogContent, GlassDialogHeader, GlassDialogTitle, GlassDialogDescription, GlassDialogTrigger } from "@/components/ui/GlassDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { trpc } from "@/lib/trpc";
import { FlaskConical, Plus, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { MobileQCForm } from "@/components/MobileQCForm";
import { QCTrendsDashboard } from "@/components/QCTrendsDashboard";
import { ComplianceCertificate } from "@/components/ComplianceCertificate";
import { PredictiveQcPanel } from "@/components/PredictiveQcPanel";

export default function QualityControl() {
  const [createOpen, setCreateOpen] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const { data: tests, isLoading, refetch } = trpc.qualityTests.list.useQuery();

  const createMutation = trpc.qualityTests.create.useMutation({
    onSuccess: () => {
      toast.success("Quality test recorded successfully");
      setCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to record test: ${error.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createMutation.mutate({
      testName: formData.get("testName") as string,
      testType: formData.get("testType") as any,
      result: formData.get("result") as string,
      unit: formData.get("unit") as string,
      status: formData.get("status") as any,
      testedBy: formData.get("testedBy") as string,
      notes: formData.get("notes") as string,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "fail":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Quality Control</h1>
            <p className="text-white/70">Manage quality tests and results</p>
          </div>
          <div className="flex gap-2">
            <GlassDialog open={mobileFormOpen} onOpenChange={setMobileFormOpen}>
              <GlassDialogTrigger asChild>
                <Button size="lg" variant="outline" className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500">
                  <Smartphone className="mr-2 h-5 w-5" />
                  Mobile QC
                </Button>
              </GlassDialogTrigger>
              <GlassDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <GlassDialogHeader>
                  <GlassDialogTitle>Mobile Quality Control Form</GlassDialogTitle>
                  <GlassDialogDescription>Complete quality test with photos and signatures</GlassDialogDescription>
                </GlassDialogHeader>
                <MobileQCForm onSuccess={() => { setMobileFormOpen(false); refetch(); }} />
              </GlassDialogContent>
            </GlassDialog>
            <GlassDialog open={createOpen} onOpenChange={setCreateOpen}>
              <GlassDialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Record Test
                </Button>
              </GlassDialogTrigger>
            <GlassDialogContent>
              <GlassDialogHeader>
                <GlassDialogTitle>Record Quality Test</GlassDialogTitle>
                <GlassDialogDescription>Add a new quality test result</GlassDialogDescription>
              </GlassDialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="testName">Test Name</Label>
                  <Input id="testName" name="testName" required />
                </div>
                <div>
                  <Label htmlFor="testType">Test Type</Label>
                  <Select name="testType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slump">Slump Test</SelectItem>
                      <SelectItem value="strength">Strength Test</SelectItem>
                      <SelectItem value="air_content">Air Content</SelectItem>
                      <SelectItem value="temperature">Temperature</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="result">Result</Label>
                    <Input id="result" name="result" required />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" name="unit" placeholder="MPa, mm, °C" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="pending">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="testedBy">Tested By</Label>
                  <Input id="testedBy" name="testedBy" />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Recording..." : "Record Test"}
                </Button>
              </form>
            </GlassDialogContent>
          </GlassDialog>
          </div>
        </div>

        {/* Predictive QC Panel */}
        <PredictiveQcPanel />

        {/* QC Trends Dashboard */}
        <QCTrendsDashboard />

        <GlassCard variant="card">
          <GlassCardHeader>
            <GlassCardTitle>Test Results</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : tests && tests.length > 0 ? (
              <div className="space-y-2">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <FlaskConical className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{test.testName}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              test.status
                            )}`}
                          >
                            {test.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Type: {test.testType} | Result: {test.result} {test.unit}
                        </p>
                        <div className="flex gap-4 mt-1">
                          {test.testedBy && (
                            <span className="text-xs text-muted-foreground">
                              Tested by: {test.testedBy}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(test.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {test.notes && (
                          <p className="text-xs text-muted-foreground mt-2">{test.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-auto">
                      <ComplianceCertificate test={test} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No test results found. Record your first test to get started.
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
