import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileCode, Save, RefreshCw, Eye, Code, Variable } from "lucide-react";
import { toast } from "sonner";

const TEMPLATE_TYPES = [
  {
    value: "daily_report",
    label: "Dnevni izvještaj",
    variables: [
      "{{date}}", "{{totalProduced}}", "{{totalDeliveries}}", "{{materialsUsed}}",
      "{{companyName}}", "{{logoUrl}}",
    ],
  },
  {
    value: "low_stock",
    label: "Upozorenje - niske zalihe",
    variables: [
      "{{materialName}}", "{{currentQty}}", "{{minStock}}", "{{unit}}",
      "{{date}}", "{{companyName}}", "{{logoUrl}}",
    ],
  },
  {
    value: "purchase_order",
    label: "Narudžbenica dobavljaču",
    variables: [
      "{{orderId}}", "{{materialName}}", "{{quantity}}", "{{unit}}", "{{supplier}}",
      "{{expectedDelivery}}", "{{date}}", "{{companyName}}", "{{logoUrl}}",
    ],
  },
  {
    value: "generic",
    label: "Generička obavijest",
    variables: ["{{title}}", "{{body}}", "{{date}}", "{{companyName}}", "{{logoUrl}}"],
  },
];

const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  daily_report: {
    subject: "Dnevni izvještaj proizvodnje - {{date}}",
    body: `<h2>Dnevni izvještaj - {{date}}</h2>
<p>Ukupno betona: <strong>{{totalProduced}} m³</strong></p>
<p>Isporuke: <strong>{{totalDeliveries}}</strong></p>
<p>Utrošeni materijali: {{materialsUsed}}</p>
<hr/>
<p style="color:#888;font-size:12px;">{{companyName}}</p>`,
  },
  low_stock: {
    subject: "⚠️ Niske zalihe: {{materialName}}",
    body: `<h2>⚠️ Upozorenje: Niske zalihe</h2>
<p>Materijal <strong>{{materialName}}</strong> je ispod minimuma.</p>
<p>Trenutna količina: <strong>{{currentQty}} {{unit}}</strong></p>
<p>Minimalna zaliha: <strong>{{minStock}} {{unit}}</strong></p>
<p>Datum: {{date}}</p>
<hr/>
<p style="color:#888;font-size:12px;">{{companyName}}</p>`,
  },
  purchase_order: {
    subject: "Narudžbenica #{{orderId}} - {{materialName}}",
    body: `<h2>Narudžbenica #{{orderId}}</h2>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
  <tr><th>Materijal</th><th>Količina</th><th>Dobavljač</th><th>Očekivana isporuka</th></tr>
  <tr><td>{{materialName}}</td><td>{{quantity}} {{unit}}</td><td>{{supplier}}</td><td>{{expectedDelivery}}</td></tr>
</table>
<p>Datum: {{date}}</p>
<hr/>
<p style="color:#888;font-size:12px;">{{companyName}}</p>`,
  },
  generic: {
    subject: "{{title}}",
    body: `<h2>{{title}}</h2>
<p>{{body}}</p>
<p>Datum: {{date}}</p>
<hr/>
<p style="color:#888;font-size:12px;">{{companyName}}</p>`,
  },
};

export default function EmailTemplateEditor() {
  const [selectedType, setSelectedType] = useState("daily_report");
  const [subject, setSubject] = useState(DEFAULT_TEMPLATES["daily_report"].subject);
  const [body, setBody] = useState(DEFAULT_TEMPLATES["daily_report"].body);
  const [previewTab, setPreviewTab] = useState<"editor" | "preview">("editor");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: templates = [], refetch: refetchTemplates } =
    trpc.emailTemplates.getEmailTemplates.useQuery();
  const { data: branding } = trpc.branding.get.useQuery();

  const upsertMutation = trpc.emailTemplates.upsertEmailTemplate.useMutation({
    onSuccess: () => {
      toast.success("Šablon uspješno sačuvan");
      refetchTemplates();
    },
    onError: (e) => toast.error(`Greška: ${e.message}`),
  });

  const currentTypeMeta = TEMPLATE_TYPES.find((t) => t.value === selectedType)!;

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    // Try to load existing saved template, otherwise load default
    const saved = templates.find((t: any) => t.type === type);
    if (saved) {
      setSubject(saved.subject || "");
      setBody(saved.htmlTemplate || "");
    } else {
      setSubject(DEFAULT_TEMPLATES[type]?.subject || "");
      setBody(DEFAULT_TEMPLATES[type]?.body || "");
    }
  };

  const handleSave = () => {
    upsertMutation.mutate({
      type: selectedType as any,
      name: currentTypeMeta.label,
      subject,
      htmlTemplate: body,
      variables: currentTypeMeta.variables,
    });
  };

  const handleReset = () => {
    setSubject(DEFAULT_TEMPLATES[selectedType]?.subject || "");
    setBody(DEFAULT_TEMPLATES[selectedType]?.body || "");
    toast.info("Resetovano na zadani šablon");
  };

  const insertVariable = (variable: string) => {
    setBody((prev) => prev + variable);
  };

  // Render preview with sample branding
  const renderPreview = () => {
    const primaryColor = branding?.primaryColor || "#FF6C0E";
    const company = branding?.companyName || "AzVirt";
    const logoUrl = branding?.logoUrl || "";

    const previewHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f9f9f9; }
  .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
  .email-header { background: ${primaryColor}; padding: 20px; text-align: center; }
  .email-header img { height: 40px; }
  .email-body { padding: 24px; }
  h2 { color: ${primaryColor}; }
</style>
</head>
<body>
<div class="email-container">
  <div class="email-header">
    ${logoUrl ? `<img src="${logoUrl}" alt="${company}" />` : `<span style="color:white;font-size:24px;font-weight:bold">${company}</span>`}
  </div>
  <div class="email-body">
    <p><strong>Predmet:</strong> ${subject}</p>
    <hr/>
    ${body}
    ${branding?.footerText ? `<p style="color:#888;font-size:12px;margin-top:24px">${branding.footerText}</p>` : ""}
  </div>
</div>
</body>
</html>`;
    return previewHtml;
  };

  const savedTemplate = templates.find((t: any) => t.type === selectedType);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileCode className="h-8 w-8 text-primary" />
            Email šabloni
          </h1>
          <p className="text-muted-foreground mt-1">
            Uredite izgled i sadržaj email poruka koje sistem šalje
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Resetuj
          </Button>
          <Button
            onClick={handleSave}
            disabled={upsertMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {upsertMutation.isPending ? "Čuvanje..." : "Sačuvaj šablon"}
          </Button>
        </div>
      </div>

      {/* Type selector */}
      <div className="flex items-center gap-4">
        <Label className="text-sm whitespace-nowrap">Tip šablona:</Label>
        <Select value={selectedType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {savedTemplate ? (
          <Badge className="bg-green-500/20 text-green-700">Sačuvan</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">Zadani</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Editor Panel */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4" /> Editor šablona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Predmet emaila</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Unesite predmet..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">HTML tijelo (šablon)</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="font-mono text-sm min-h-[300px] resize-y"
                  placeholder="Unesite HTML sadržaj..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side panel: variables + preview */}
        <div className="space-y-4">
          {/* Variable reference */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Variable className="h-4 w-4" /> Dostupne varijable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Kliknite za dodavanje u editor
              </p>
              <div className="flex flex-wrap gap-2">
                {currentTypeMeta.variables.map((v) => (
                  <button
                    key={v}
                    onClick={() => insertVariable(v)}
                    className="px-2 py-1 rounded text-xs font-mono bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20 transition-colors border border-orange-500/20"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" /> Pregled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as any)}>
                <TabsList className="w-full mb-3">
                  <TabsTrigger value="editor" className="flex-1">Predmet</TabsTrigger>
                  <TabsTrigger value="preview" className="flex-1">HTML pregled</TabsTrigger>
                </TabsList>
                <TabsContent value="editor">
                  <div className="rounded border px-3 py-2 text-sm bg-muted/50 font-medium">
                    {subject || <span className="text-muted-foreground italic">Bez predmeta</span>}
                  </div>
                </TabsContent>
                <TabsContent value="preview">
                  <div className="rounded border overflow-hidden" style={{ height: 400 }}>
                    <iframe
                      ref={iframeRef}
                      srcDoc={renderPreview()}
                      className="w-full h-full border-0"
                      title="Email pregled"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
