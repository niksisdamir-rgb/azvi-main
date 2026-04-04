import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/GlassCard";
import { GlassDialog, GlassDialogContent, GlassDialogHeader, GlassDialogTitle, GlassDialogDescription, GlassDialogTrigger } from "@/components/ui/GlassDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { trpc } from "@/lib/trpc";
import { Truck, Plus, Printer } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { DeliveryNote } from "@/components/DeliveryNote";
import { LiveDeliveryMap } from "@/components/LiveDeliveryMap";
import { DeliveryAnalyticsDashboard } from "@/components/DeliveryAnalyticsDashboard";

export default function Deliveries() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: deliveries, isLoading, refetch } = trpc.deliveries.list.useQuery();

  const createMutation = trpc.deliveries.create.useMutation({
    onMutate: async (newDelivery) => {
      await utils.deliveries.list.cancel();
      const previousDeliveries = utils.deliveries.list.getData();

      utils.deliveries.list.setData(undefined, (old) => {
        if (!old) return [];
        return [
          {
            id: Math.random(),
            projectName: newDelivery.projectName,
            concreteType: newDelivery.concreteType,
            volume: newDelivery.volume,
            scheduledTime: newDelivery.scheduledTime.toISOString(),
            driverName: newDelivery.driverName || null,
            vehicleNumber: newDelivery.vehicleNumber || null,
            notes: newDelivery.notes || null,
            status: "scheduled",
            createdAt: new Date().toISOString(),
          } as any,
          ...old,
        ];
      });

      return { previousDeliveries };
    },
    onSuccess: () => {
      toast.success("Delivery scheduled successfully");
      setCreateOpen(false);
    },
    onError: (error, variables, context) => {
      toast.error(`Failed to schedule delivery: ${error.message}`);
      if (context?.previousDeliveries) {
        utils.deliveries.list.setData(undefined, context.previousDeliveries);
      }
    },
    onSettled: () => {
      utils.deliveries.list.invalidate();
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createMutation.mutate({
      projectName: formData.get("projectName") as string,
      concreteType: formData.get("concreteType") as string,
      volume: parseInt(formData.get("volume") as string),
      scheduledTime: new Date(formData.get("scheduledTime") as string),
      driverName: formData.get("driverName") as string,
      vehicleNumber: formData.get("vehicleNumber") as string,
      notes: formData.get("notes") as string,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in_transit":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "cancelled":
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
            <h1 className="text-3xl font-bold text-white">Manager Dashboard</h1>
            <p className="text-white/70">Upravljanje isporukama, analitika i praćenje uživo</p>
          </div>
          <GlassDialog open={createOpen} onOpenChange={setCreateOpen}>
            <GlassDialogTrigger asChild>
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="mr-2 h-5 w-5" />
                Nova Isporuka
              </Button>
            </GlassDialogTrigger>
            <GlassDialogContent>
              <GlassDialogHeader>
                <GlassDialogTitle>Zakaži novu isporuku</GlassDialogTitle>
                <GlassDialogDescription>Schedule a concrete delivery</GlassDialogDescription>
              </GlassDialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="projectName">Projekat / Project Name</Label>
                  <Input id="projectName" name="projectName" required />
                </div>
                <div>
                  <Label htmlFor="concreteType">Tip Betona / Concrete Type</Label>
                  <Input id="concreteType" name="concreteType" placeholder="npr. C30/37" required />
                </div>
                <div>
                  <Label htmlFor="volume">Količina (m³)</Label>
                  <Input id="volume" name="volume" type="number" required />
                </div>
                <div>
                  <Label htmlFor="scheduledTime">Zakazano Vrijeme</Label>
                  <Input id="scheduledTime" name="scheduledTime" type="datetime-local" required />
                </div>
                <div>
                  <Label htmlFor="driverName">Vozač / Driver Name</Label>
                  <Input id="driverName" name="driverName" />
                </div>
                <div>
                  <Label htmlFor="vehicleNumber">Vozilo / Vehicle Number</Label>
                  <Input id="vehicleNumber" name="vehicleNumber" />
                </div>
                <div>
                  <Label htmlFor="notes">Napomena / Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>
                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Spašavanje..." : "Zakaži Isporuku"}
                </Button>
              </form>
            </GlassDialogContent>
          </GlassDialog>
        </div>

        {/* Analytics Top Row */}
        <DeliveryAnalyticsDashboard />

        {/* Live Tracking Map with Tabs and Timelines underneath */}
        <LiveDeliveryMap />

        {/* Full Delivery List (Historical) */}
        <GlassCard variant="card" className="border-border">
          <GlassCardHeader>
            <GlassCardTitle>Sve isporuke / All Deliveries</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">Učitavanje...</div>
            ) : deliveries && deliveries.length > 0 ? (
              <div className="space-y-2">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <Truck className="h-6 w-6 text-orange-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">#{delivery.id} - {delivery.projectName}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              delivery.status
                            )}`}
                          >
                            {delivery.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-orange-400 mt-1">
                          {delivery.volume}m³ {delivery.concreteType}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                          <span className="text-xs text-muted-foreground">
                            Zakazano: {new Date(delivery.scheduledTime).toLocaleString()}
                          </span>
                          {delivery.driverName && (
                            <span className="text-xs text-muted-foreground">
                              Vozač: {delivery.driverName}
                            </span>
                          )}
                          {delivery.vehicleNumber && (
                            <span className="text-xs text-muted-foreground">
                              Vozilo: {delivery.vehicleNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setSelectedDelivery(delivery.id)}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Note
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Delivery Note Print View */}
                {selectedDelivery && deliveries && (
                  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                      <div className="bg-zinc-100 border-b p-4 flex justify-between items-center shrink-0">
                        <h2 className="text-xl font-bold text-black">Delivery Note Preview (Otpremnica)</h2>
                        <Button
                          variant="ghost"
                          className="text-black hover:bg-zinc-200"
                          onClick={() => setSelectedDelivery(null)}
                        >
                          Zatvori
                        </Button>
                      </div>
                      <div className="flex-1 overflow-auto p-4 bg-zinc-50">
                        <DeliveryNote
                          delivery={deliveries.find(d => d.id === selectedDelivery)!}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nema kreiranih isporuka / No deliveries found.
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
