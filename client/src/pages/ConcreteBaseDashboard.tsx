import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Factory, Plus, Cog, Clock, Package, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import MaintenanceReport from "@/components/MaintenanceReport";

function statusColor(status: string) {
  if (status === "operational") return "bg-green-500/20 text-green-700 dark:text-green-400";
  if (status === "maintenance") return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
  return "bg-gray-500/20 text-gray-500";
}

export default function ConcreteBaseDashboard() {
  const [isAddBaseOpen, setIsAddBaseOpen] = useState(false);
  const [selectedBaseId, setSelectedBaseId] = useState<number | null>(null);
  const [isLogHoursDialogOpen, setIsLogHoursDialogOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedMachineForReport, setSelectedMachineForReport] = useState<any>(null);

  const { data: bases = [], isLoading: basesLoading, refetch: refetchBases } =
    trpc.concreteBases.list.useQuery();
  const { data: machines = [], refetch: refetchMachines } = trpc.machines.list.useQuery();
  const { data: machineHours = [], refetch: refetchHours } = trpc.machines.workHours.list.useQuery();
  const { data: aggregateInputs = [] } = trpc.aggregateInputs.list.useQuery();
  
  const { data: maintenanceRecords } = trpc.machines.maintenance.list.useQuery(
    { machineId: selectedMachineForReport?.id },
    { enabled: !!selectedMachineForReport && reportOpen }
  );

  const createBaseMutation = trpc.concreteBases.create.useMutation({
    onSuccess: () => {
      toast.success("Baza uspješno dodana");
      setIsAddBaseOpen(false);
      refetchBases();
    },
    onError: (e) => toast.error(`Greška: ${e.message}`),
  });

  const createWorkHourMutation = trpc.machines.workHours.create.useMutation({
    onSuccess: () => {
      toast.success("Radni sati uspješno evidentirani");
      setIsLogHoursDialogOpen(false);
      refetchHours();
      refetchMachines();
    },
    onError: (error) => {
      toast.error(`Greška: ${error.message}`);
    },
  });

  // Derived stats
  const operationalBases = bases.filter((b) => b.status === "operational").length;
  const totalMachines = machines.length;
  const operationalMachines = machines.filter((m) => m.status === "operational").length;

  const today = new Date().toDateString();
  const todayInputs = aggregateInputs.filter((a) => {
    try {
      return new Date(a.date).toDateString() === today;
    } catch {
      return false;
    }
  });
  const todayInputQty = todayInputs.reduce((sum, a) => sum + a.quantity, 0);

  const totalMachineHrs = machineHours.reduce((sum, h) => sum + (h.hoursWorked || 0), 0);

  const handleBaseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createBaseMutation.mutate({
      name: fd.get("name") as string,
      location: fd.get("location") as string,
      capacity: Number(fd.get("capacity")),
      status: (fd.get("status") as any) || "operational",
      managerName: (fd.get("managerName") as string) || undefined,
      phoneNumber: (fd.get("phoneNumber") as string) || undefined,
    });
  };

  const handleHoursSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMachineId) return;

    const formData = new FormData(e.currentTarget);
    const dateInput = formData.get("date") as string;
    const hours = Number(formData.get("hoursWorked"));

    createWorkHourMutation.mutate({
      machineId: selectedMachineId,
      date: new Date(dateInput),
      startTime: new Date(dateInput),
      hoursWorked: hours,
      operatorName: formData.get("operatorName") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Factory className="h-8 w-8 text-primary" />
            Upravljanje betonskim bazama
          </h1>
          <p className="text-muted-foreground mt-1">
            Pregled kapaciteta, mašina i unosa agregata
          </p>
        </div>
        <Dialog open={isAddBaseOpen} onOpenChange={setIsAddBaseOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Dodaj bazu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova betonska baza</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBaseSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Naziv *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lokacija *</Label>
                  <Input id="location" name="location" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Kapacitet (m³/h) *</Label>
                  <Input id="capacity" name="capacity" type="number" required min={0} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="operational">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operativna</SelectItem>
                      <SelectItem value="maintenance">Održavanje</SelectItem>
                      <SelectItem value="inactive">Neaktivna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="managerName">Menadžer</Label>
                  <Input id="managerName" name="managerName" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Telefon</Label>
                  <Input id="phoneNumber" name="phoneNumber" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddBaseOpen(false)}>
                  Odustani
                </Button>
                <Button type="submit" disabled={createBaseMutation.isPending}>
                  {createBaseMutation.isPending ? "Dodavanje..." : "Dodaj bazu"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Operativne baze</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{operationalBases}</p>
            <p className="text-xs text-muted-foreground">od {bases.length} ukupno</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Cog className="h-3 w-3" /> Mašine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{operationalMachines}</p>
            <p className="text-xs text-muted-foreground">od {totalMachines} ukupno</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" /> Unosi danas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todayInputs.length}</p>
            <p className="text-xs text-muted-foreground">{todayInputQty.toFixed(1)} ukupno jedinica</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Sati mašina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMachineHrs.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">ukupno evidentirano</p>
          </CardContent>
        </Card>
      </div>

      {/* Bases List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {basesLoading ? (
          <p className="text-muted-foreground">Učitavanje...</p>
        ) : bases.length === 0 ? (
          <Card className="col-span-2 p-8 text-center">
            <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nema betonskih baza. Dodajte prvu bazu.</p>
          </Card>
        ) : (
          bases.map((base) => {
            const baseMachines = machines.filter((m) => m.concreteBaseId === base.id);
            const baseInputs = aggregateInputs.filter((a) => a.concreteBaseId === base.id);
            const inactiveMachines = baseMachines.filter(
              (m) => m.status !== "operational"
            ).length;

            return (
              <Card
                key={base.id}
                className={`border cursor-pointer transition-all hover:shadow-lg ${
                  selectedBaseId === base.id ? "border-primary ring-1 ring-primary" : ""
                }`}
                onClick={() =>
                  setSelectedBaseId(selectedBaseId === base.id ? null : base.id)
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{base.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{base.location}</p>
                    </div>
                    <Badge className={statusColor(base.status)}>{base.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Capacity bar */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Kapacitet</span>
                      <span>{base.capacity} m³/h</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${Math.min(100, (base.capacity / 100) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="font-semibold">{baseMachines.length}</p>
                      <p className="text-xs text-muted-foreground">Mašine</p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="font-semibold text-red-500">{inactiveMachines}</p>
                      <p className="text-xs text-muted-foreground">Neoperativne</p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="font-semibold">{baseInputs.length}</p>
                      <p className="text-xs text-muted-foreground">Unosi</p>
                    </div>
                  </div>

                  {base.managerName && (
                    <p className="text-xs text-muted-foreground">
                      Menadžer: <span className="font-medium text-foreground">{base.managerName}</span>
                      {base.phoneNumber ? ` · ${base.phoneNumber}` : ""}
                    </p>
                  )}

                  {inactiveMachines > 0 && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <AlertTriangle className="h-3 w-3" />
                      {inactiveMachines} mašina{inactiveMachines > 1 ? "e" : "a"} van pogona
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Machine list & hours for selected base */}
      {selectedBaseId && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="h-5 w-5 text-primary" />
                Mašine na bazi — {bases.find((b) => b.id === selectedBaseId)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mašina #</TableHead>
                    <TableHead>Naziv</TableHead>
                    <TableHead>Sati</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines
                    .filter((m) => m.concreteBaseId === selectedBaseId)
                    .map((machine) => (
                      <TableRow key={machine.id}>
                        <TableCell>{machine.machineNumber}</TableCell>
                        <TableCell>{machine.name}</TableCell>
                        <TableCell>{machine.totalWorkingHours || 0} h</TableCell>
                        <TableCell>
                          <Badge className={statusColor(machine.status)}>{machine.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMachineForReport(machine);
                              setReportOpen(true);
                            }}
                            title="Pregled izvještaja"
                          >
                            <FileText className="h-4 w-4 text-orange-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMachineId(machine.id);
                              setIsLogHoursDialogOpen(true);
                            }}
                            title="Evidentiraj sate"
                          >
                            <Clock className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                History — Evidentirani sati
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Mašina</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Sati</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machineHours
                    .filter((h) => {
                      const m = machines.find((m) => m.id === h.machineId);
                      return m?.concreteBaseId === selectedBaseId;
                    })
                    .slice(0, 20)
                    .map((h) => {
                      const machine = machines.find((m) => m.id === h.machineId);
                      return (
                        <TableRow key={h.id}>
                          <TableCell>{new Date(h.date).toLocaleDateString("bs-BA")}</TableCell>
                          <TableCell>{machine?.name || `#${h.machineId}`}</TableCell>
                          <TableCell>{h.operatorName || "—"}</TableCell>
                          <TableCell>{h.hoursWorked?.toFixed(1) || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  {machineHours.filter((h) => {
                    const m = machines.find((m) => m.id === h.machineId);
                    return m?.concreteBaseId === selectedBaseId;
                  }).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Nema evidentiranih sati za ovu bazu.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Log Hours Dialog */}
      <Dialog open={isLogHoursDialogOpen} onOpenChange={setIsLogHoursDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Evidencija radnih sati</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleHoursSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum *</Label>
              <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hoursWorked">Sati *</Label>
              <Input id="hoursWorked" name="hoursWorked" type="number" step="0.1" required min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operatorName">Ime operatera</Label>
              <Input id="operatorName" name="operatorName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Napomena</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsLogHoursDialogOpen(false)}>
                Odustani
              </Button>
              <Button type="submit" disabled={createWorkHourMutation.isPending}>
                {createWorkHourMutation.isPending ? "Slanje..." : "Sačuvaj"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {selectedMachineForReport && (
        <MaintenanceReport
          machine={selectedMachineForReport}
          records={maintenanceRecords || []}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}
    </div>
  );
}
