import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Package, Plus, Download } from "lucide-react";
import { toast } from "sonner";

const MATERIAL_TYPES = [
  { value: "cement", label: "Cement" },
  { value: "sand", label: "Pijesak" },
  { value: "gravel", label: "Šljunak" },
  { value: "water", label: "Voda" },
  { value: "admixture", label: "Aditiv" },
  { value: "other", label: "Ostalo" },
] as const;

type MaterialType = (typeof MATERIAL_TYPES)[number]["value"];

export default function AggregateInputs() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filterBase, setFilterBase] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");

  const { data: inputs = [], isLoading, refetch } = trpc.aggregateInputs.list.useQuery();
  const { data: bases = [] } = trpc.concreteBases.list.useQuery();

  const createMutation = trpc.aggregateInputs.create.useMutation({
    onSuccess: () => {
      toast.success("Unos agregata uspješno dodat");
      setIsAddOpen(false);
      refetch();
    },
    onError: (e) => toast.error(`Greška: ${e.message}`),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      concreteBaseId: Number(fd.get("concreteBaseId")),
      date: new Date(fd.get("date") as string),
      materialType: fd.get("materialType") as MaterialType,
      materialName: fd.get("materialName") as string,
      quantity: Number(fd.get("quantity")),
      unit: fd.get("unit") as string,
      supplier: (fd.get("supplier") as string) || undefined,
      batchNumber: (fd.get("batchNumber") as string) || undefined,
      receivedBy: (fd.get("receivedBy") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
    });
  };

  // Filtered inputs
  const filtered = inputs.filter((inp) => {
    if (filterBase !== "all" && inp.concreteBaseId !== Number(filterBase)) return false;
    if (filterType !== "all" && inp.materialType !== filterType) return false;
    if (filterDate) {
      const d = new Date(inp.date).toISOString().slice(0, 10);
      if (d !== filterDate) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const header = "Datum,Baza,Tip,Naziv,Količina,Jedinica,Dobavljač,Lot,Primio\n";
    const rows = filtered.map((i) => {
      const base = bases.find((b) => b.id === i.concreteBaseId)?.name || "";
      return [
        new Date(i.date).toLocaleDateString("bs-BA"),
        base,
        i.materialType,
        i.materialName,
        i.quantity,
        i.unit,
        i.supplier || "",
        i.batchNumber || "",
        i.receivedBy || "",
      ]
        .map((v) => `"${v}"`)
        .join(",");
    });
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agregati-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Unos agregata
          </h1>
          <p className="text-muted-foreground mt-1">
            Evidencija prijema sirovina po betonskim bazama
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Izvezi CSV
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Dodaj unos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novi unos agregata</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="concreteBaseId">Betonska baza *</Label>
                    <Select name="concreteBaseId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberi bazu" />
                      </SelectTrigger>
                      <SelectContent>
                        {bases.map((b) => (
                          <SelectItem key={b.id} value={b.id.toString()}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Datum *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="materialType">Tip materijala *</Label>
                    <Select name="materialType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberi tip" />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="materialName">Naziv materijala *</Label>
                    <Input id="materialName" name="materialName" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Količina *</Label>
                    <Input id="quantity" name="quantity" type="number" step="0.01" required min={0} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Jedinica *</Label>
                    <Input id="unit" name="unit" placeholder="npr. kg, m³, t" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Dobavljač</Label>
                    <Input id="supplier" name="supplier" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batchNumber">Broj lota / serija</Label>
                    <Input id="batchNumber" name="batchNumber" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receivedBy">Primio</Label>
                    <Input id="receivedBy" name="receivedBy" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Napomena</Label>
                    <Input id="notes" name="notes" />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Odustani
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Dodavanje..." : "Dodaj unos"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1 flex-1 min-w-[160px]">
            <Label className="text-xs">Betonska baza</Label>
            <Select value={filterBase} onValueChange={setFilterBase}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve baze</SelectItem>
                {bases.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 flex-1 min-w-[160px]">
            <Label className="text-xs">Tip materijala</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi tipovi</SelectItem>
                {MATERIAL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 flex-1 min-w-[140px]">
            <Label className="text-xs">Datum</Label>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterBase("all");
              setFilterType("all");
              setFilterDate("");
            }}
          >
            Resetuj filtere
          </Button>
        </div>
      </Card>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{filtered.length}</strong> unosa
          </span>
          {MATERIAL_TYPES.map((t) => {
            const count = filtered.filter((i) => i.materialType === t.value).length;
            if (!count) return null;
            return (
              <span key={t.value}>
                <strong className="text-foreground">{count}</strong> × {t.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Table */}
      <Card className="border-l-4 border-l-primary">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Datum</TableHead>
              <TableHead>Baza</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Naziv</TableHead>
              <TableHead>Količina</TableHead>
              <TableHead>Dobavljač</TableHead>
              <TableHead>Lot</TableHead>
              <TableHead>Primio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Učitavanje...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nema unosa agregata koji odgovaraju filterima.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inp) => {
                const base = bases.find((b) => b.id === inp.concreteBaseId);
                const typeLabel =
                  MATERIAL_TYPES.find((t) => t.value === inp.materialType)?.label ||
                  inp.materialType;
                return (
                  <TableRow key={inp.id}>
                    <TableCell>{new Date(inp.date).toLocaleDateString("bs-BA")}</TableCell>
                    <TableCell>{base?.name || `#${inp.concreteBaseId}`}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400">
                        {typeLabel}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{inp.materialName}</TableCell>
                    <TableCell>
                      {inp.quantity} {inp.unit}
                    </TableCell>
                    <TableCell>{inp.supplier || "—"}</TableCell>
                    <TableCell>{inp.batchNumber || "—"}</TableCell>
                    <TableCell>{inp.receivedBy || "—"}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
