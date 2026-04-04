import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Plus, Trash2, Mail, MessageSquare, Bell } from "lucide-react";
import { toast } from "sonner";

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="h-3 w-3" />,
  sms: <MessageSquare className="h-3 w-3" />,
  in_app: <Bell className="h-3 w-3" />,
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  in_app: "In-app",
};

export default function NotificationTemplatesAdmin() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["email"]);

  const { data: templates = [], refetch } = trpc.notificationTemplates.list.useQuery();

  const upsertMutation = trpc.notificationTemplates.upsert.useMutation({
    onSuccess: () => {
      toast.success("Šablon uspješno sačuvan");
      setIsAddOpen(false);
      setEditingId(null);
      setSelectedChannels(["email"]);
      refetch();
    },
    onError: (e) => toast.error(`Greška: ${e.message}`),
  });

  const deleteMutation = trpc.notificationTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Šablon obrisan");
      refetch();
    },
    onError: (e) => toast.error(`Greška: ${e.message}`),
  });

  const editTemplate = templates.find((t: any) => t.id === editingId);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = editingId ?? undefined;
    upsertMutation.mutate({
      id,
      name: fd.get("name") as string,
      subject: fd.get("subject") as string,
      body: fd.get("body") as string,
      channels: selectedChannels as any,
    });
  };

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const openEdit = (template: any) => {
    setEditingId(template.id);
    setSelectedChannels(template.channels || ["email"]);
    setIsAddOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Šabloni obavijesti
          </h1>
          <p className="text-muted-foreground mt-1">
            Upravljajte šablonima za email, SMS i in-app obavijesti
          </p>
        </div>
        <Dialog
          open={isAddOpen}
          onOpenChange={(v) => {
            setIsAddOpen(v);
            if (!v) {
              setEditingId(null);
              setSelectedChannels(["email"]);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Novi šablon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Uredi šablon" : "Novi šablon obavijesti"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naziv šablona *</Label>
                <Input id="name" name="name" required defaultValue={editTemplate?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Predmet (za email) *</Label>
                <Input id="subject" name="subject" required defaultValue={editTemplate?.subject} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Tijelo poruke *</Label>
                <Textarea
                  id="body"
                  name="body"
                  required
                  className="min-h-[160px] resize-y"
                  placeholder="Unesite tekst poruke. Možete koristiti {{varijable}}."
                  defaultValue={editTemplate?.body}
                />
              </div>
              <div className="space-y-2">
                <Label>Kanali dostave</Label>
                <div className="flex gap-3">
                  {["email", "sms", "in_app"].map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                        selectedChannels.includes(ch)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {CHANNEL_ICONS[ch]}
                      {CHANNEL_LABELS[ch]}
                    </button>
                  ))}
                </div>
                {selectedChannels.length === 0 && (
                  <p className="text-xs text-destructive">Odaberite bar jedan kanal.</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingId(null);
                    setSelectedChannels(["email"]);
                  }}
                >
                  Odustani
                </Button>
                <Button
                  type="submit"
                  disabled={upsertMutation.isPending || selectedChannels.length === 0}
                >
                  {upsertMutation.isPending ? "Čuvanje..." : "Sačuvaj"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-l-4 border-l-primary">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Naziv</TableHead>
              <TableHead>Predmet</TableHead>
              <TableHead>Kanali</TableHead>
              <TableHead>Ažurirano</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nema šablona. Dodajte prvi šablon obavijesti.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm truncate max-w-[200px]">{t.subject}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(t.channels || []).map((ch: string) => (
                        <Badge
                          key={ch}
                          variant="outline"
                          className="flex items-center gap-1 text-xs px-2 py-0.5"
                        >
                          {CHANNEL_ICONS[ch]}
                          {CHANNEL_LABELS[ch]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("bs-BA") : "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                      Uredi
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Obrisati ovaj šablon?")) {
                          deleteMutation.mutate({ id: t.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
