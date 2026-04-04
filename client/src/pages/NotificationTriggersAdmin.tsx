import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { Bell, Plus, Trash2, Info } from "lucide-react";
import { toast } from "sonner";

const EVENT_TYPES = [
  { value: "stock_threshold", label: "Prag zaliha", description: "Okida kada materijal padne ispod minimuma" },
  { value: "overdue_task", label: "Kasni zadatak", description: "Okida kada zadatak prođe rok" },
  { value: "task_completion", label: "Završetak zadatka", description: "Okida kada je zadatak označen završenim" },
  { value: "delivery_delay", label: "Kašnjenje isporuke", description: "Okida kada isporuka kasni" },
] as const;

type EventType = (typeof EVENT_TYPES)[number]["value"];

export default function NotificationTriggersAdmin() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: triggers = [], refetch } = trpc.notificationTriggers.list.useQuery();
  const { data: templates = [] } = trpc.notificationTemplates.list.useQuery();

  const upsertMutation = trpc.notificationTriggers.upsert.useMutation({
    onSuccess: () => {
      toast.success("Okidač uspješno sačuvan");
      setIsAddOpen(false);
      setEditingId(null);
      refetch();
    },
    onError: (e) => toast.error(`Greška: ${e.message}`),
  });

  const deleteMutation = trpc.notificationTriggers.delete.useMutation({
    onSuccess: () => {
      toast.success("Okidač obrisan");
      refetch();
    },
    onError: (e) => toast.error(`Greška: ${e.message}`),
  });

  const toggleMutation = trpc.notificationTriggers.toggle.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(`Greška: ${e.message}`),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = editingId ?? undefined;
    upsertMutation.mutate({
      id,
      name: fd.get("name") as string,
      eventType: fd.get("eventType") as EventType,
      conditions: (fd.get("conditions") as string) || undefined,
      templateId: fd.get("templateId") ? Number(fd.get("templateId")) : undefined,
      enabled: true,
    });
  };

  const editTrigger = triggers.find((t: any) => t.id === editingId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Okidači obavijesti
          </h1>
          <p className="text-muted-foreground mt-1">
            Konfigurirajte automatske okidače za slanje obavijesti
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(v) => { setIsAddOpen(v); if (!v) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Novi okidač
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Uredi okidač" : "Novi okidač obavijesti"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naziv okidača *</Label>
                <Input id="name" name="name" required defaultValue={editTrigger?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventType">Tip događaja *</Label>
                <Select name="eventType" defaultValue={editTrigger?.eventType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberi tip" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateId">Šablon poruke</Label>
                <Select name="templateId" defaultValue={editTrigger?.templateId?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberi šablon (opciono)" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conditions">
                  Uslovi (JSON, opciono)
                  <span className="ml-1 text-xs text-muted-foreground">
                    npr. {`{"threshold": 10}`}
                  </span>
                </Label>
                <Textarea
                  id="conditions"
                  name="conditions"
                  className="font-mono text-xs"
                  placeholder='{"threshold": 10}'
                  defaultValue={editTrigger?.conditions}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setEditingId(null); }}>
                  Odustani
                </Button>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? "Čuvanje..." : "Sačuvaj"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event type info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {EVENT_TYPES.map((et) => {
          const count = triggers.filter((t: any) => t.eventType === et.value && t.enabled).length;
          return (
            <Card key={et.value} className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{et.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{et.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Naziv</TableHead>
              <TableHead>Tip događaja</TableHead>
              <TableHead>Šablon</TableHead>
              <TableHead>Uslovi</TableHead>
              <TableHead>Aktivan</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {triggers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nema konfiguriranih okidača. Dodajte prvi okidač.
                </TableCell>
              </TableRow>
            ) : (
              triggers.map((trigger: any) => {
                const eventMeta = EVENT_TYPES.find((e) => e.value === trigger.eventType);
                const templateName = templates.find((t: any) => t.id === trigger.templateId)?.name;
                return (
                  <TableRow key={trigger.id}>
                    <TableCell className="font-medium">{trigger.name}</TableCell>
                    <TableCell>{eventMeta?.label || trigger.eventType}</TableCell>
                    <TableCell>{templateName || "—"}</TableCell>
                    <TableCell>
                      {trigger.conditions ? (
                        <code className="text-xs bg-muted px-1 rounded">{trigger.conditions}</code>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={trigger.enabled}
                        onCheckedChange={(enabled) =>
                          toggleMutation.mutate({ id: trigger.id, enabled })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(trigger.id);
                          setIsAddOpen(true);
                        }}
                      >
                        Uredi
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Obrisati ovaj okidač?")) {
                            deleteMutation.mutate({ id: trigger.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
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
