import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/GlassCard";
import { GlassDialog, GlassDialogContent, GlassDialogHeader, GlassDialogTitle, GlassDialogDescription, GlassDialogTrigger } from "@/components/ui/GlassDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryAnalytics from "@/components/InventoryAnalytics";
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
import { Package, Plus, AlertTriangle, Bell } from "lucide-react";
import { toast } from "sonner";

export default function Materials() {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: materials, isLoading, refetch } = trpc.materials.list.useQuery();

  const createMutation = trpc.materials.create.useMutation({
    onSuccess: () => {
      toast.success("Materijal uspješno dodan");
      setCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Neuspjelo dodavanje materijala: ${error.message}`);
    },
  });

  const checkStockMutation = trpc.materials.sendLowStockAlert.useMutation({
    onSuccess: (data) => {
      if ((data.materialsCount ?? 0) > 0) {
        toast.success(data.message);
      } else {
        toast.info(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Neuspjela provjera zaliha: ${error.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createMutation.mutate({
      name: formData.get("name") as string,
      category: formData.get("category") as any,
      unit: formData.get("unit") as string,
      quantity: parseInt(formData.get("quantity") as string) || 0,
      minStock: parseInt(formData.get("minStock") as string) || 0,
      criticalThreshold: parseInt(formData.get("criticalThreshold") as string) || 0,
      supplier: formData.get("supplier") as string,
      unitPrice: parseInt(formData.get("unitPrice") as string) || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Materijali</h1>
            <p className="text-white/70">Upravljajte zalihama i nivoima zaliha</p>
          </div>
          <div className="flex gap-3">
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => checkStockMutation.mutate()}
              disabled={checkStockMutation.isPending}
            >
              <Bell className="mr-2 h-5 w-5" />
              {checkStockMutation.isPending ? "Provjeravam..." : "Provjeri zalihe odmah"}
            </Button>
            <GlassDialog open={createOpen} onOpenChange={setCreateOpen}>
              <GlassDialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Dodaj materijal
                </Button>
              </GlassDialogTrigger>
              <GlassDialogContent className="sm:max-w-[425px]">
                <GlassDialogHeader>
                  <GlassDialogTitle>Dodaj novi materijal</GlassDialogTitle>
                  <GlassDialogDescription>Dodajte novi materijal u inventar</GlassDialogDescription>
                </GlassDialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Naziv materijala</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategorija</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberite kategoriju" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cement">Cement</SelectItem>
                        <SelectItem value="aggregate">Agregat</SelectItem>
                        <SelectItem value="admixture">Dodatak</SelectItem>
                        <SelectItem value="water">Voda</SelectItem>
                        <SelectItem value="other">Ostalo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Količina</Label>
                      <Input id="quantity" name="quantity" type="number" defaultValue="0" />
                    </div>
                    <div>
                      <Label htmlFor="unit">Jedinica</Label>
                      <Input id="unit" name="unit" placeholder="kg, m³, L" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="minStock">Minimalni nivo zaliha</Label>
                    <Input id="minStock" name="minStock" type="number" defaultValue="0" />
                  </div>
                  <div>
                    <Label htmlFor="criticalThreshold">Kritični prag (nivo SMS upozorenja)</Label>
                    <Input id="criticalThreshold" name="criticalThreshold" type="number" defaultValue="0" />
                    <p className="text-xs text-muted-foreground mt-1">SMS upozorenja će biti poslana kada zalihe padnu ispod ovog nivoa</p>
                  </div>
                  <div>
                    <Label htmlFor="supplier">Dobavljač</Label>
                    <Input id="supplier" name="supplier" />
                  </div>
                  <div>
                    <Label htmlFor="unitPrice">Jedinična cijena</Label>
                    <Input id="unitPrice" name="unitPrice" type="number" />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Dodajem..." : "Dodaj materijal"}
                  </Button>
                </form>
              </GlassDialogContent>
            </GlassDialog>
          </div>
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="inventory">Inventar</TabsTrigger>
            <TabsTrigger value="analytics">Analitika</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="mt-6">
            <GlassCard variant="dark">
              <GlassCardHeader className="border-b border-white/5 bg-white/5">
                <GlassCardTitle>Inventar</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Učitavanje...</div>
                ) : materials && materials.length > 0 ? (
                  <div className="space-y-2">
                    {materials.map((material) => {
                      const isLowStock = material.quantity <= material.minStock;
                      return (
                        <div
                          key={material.id}
                          className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 hover:-translate-y-1 ${
                            isLowStock
                              ? "bg-yellow-500/10 border border-yellow-500/30 hover:shadow-[0_8px_30px_rgba(234,179,8,0.12)]"
                              : "bg-white/5 hover:bg-white/10 border border-white/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <Package className={`h-8 w-8 ${isLowStock ? "text-yellow-500" : "text-primary"}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{material.name}</h3>
                                {isLowStock && (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Kategorija: {material.category}
                              </p>
                              <div className="flex gap-4 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Zaliha: {material.quantity} {material.unit}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Min: {material.minStock} {material.unit}
                                </span>
                                {material.criticalThreshold > 0 && (
                                  <span className="text-xs text-red-400">
                                    Kritično: {material.criticalThreshold} {material.unit}
                                  </span>
                                )}
                                {material.supplier && (
                                  <span className="text-xs text-muted-foreground">
                                    Dobavljač: {material.supplier}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {material.unitPrice && (
                              <p className="font-medium">${material.unitPrice}/{material.unit}</p>
                            )}
                            {isLowStock && (
                              <p className="text-xs text-yellow-500 mt-1">Niske zalihe</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nisu pronađeni materijali. Dodajte svoj prvi materijal za početak.
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <InventoryAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
