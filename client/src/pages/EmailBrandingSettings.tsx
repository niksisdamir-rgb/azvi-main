import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, X, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function EmailBrandingSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: branding, refetch } = trpc.branding.get.useQuery();
  const updateBranding = trpc.branding.update.useMutation();
  const uploadLogo = trpc.branding.uploadLogo.useMutation();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#f97316");
  const [secondaryColor, setSecondaryColor] = useState("#ea580c");
  const [companyName, setCompanyName] = useState("AzVirt");
  const [footerText, setFooterText] = useState("");
  const [uploading, setUploading] = useState(false);

  // Initialize state when branding data loads
  useState(() => {
    if (branding) {
      setLogoUrl(branding.logoUrl || null);
      setPrimaryColor(branding.primaryColor || "#f97316");
      setSecondaryColor(branding.secondaryColor || "#ea580c");
      setCompanyName(branding.companyName || "AzVirt");
      setFooterText(branding.footerText || "");
    }
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PNG, JPG, and SVG files are allowed");
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be less than 2MB");
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        const result = await uploadLogo.mutateAsync({
          fileData: base64,
          fileName: file.name,
          mimeType: file.type,
        });

        setLogoUrl(result.url);
        toast.success("Logo uploaded successfully");
        refetch();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateBranding.mutateAsync({
        logoUrl: logoUrl || undefined,
        primaryColor,
        secondaryColor,
        companyName,
        footerText,
      });

      toast.success("Branding settings saved successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to save branding settings");
    }
  };

  const handleReset = () => {
    if (branding) {
      setLogoUrl(branding.logoUrl || null);
      setPrimaryColor(branding.primaryColor || "#f97316");
      setSecondaryColor(branding.secondaryColor || "#ea580c");
      setCompanyName(branding.companyName || "AzVirt");
      setFooterText(branding.footerText || "");
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
  };

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Email Branding Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your company branding for all email communications
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Settings Form */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Branding Settings</h2>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative">
                      <img
                        src={logoUrl}
                        alt="Company logo"
                        className="h-20 w-auto object-contain border rounded"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                      No logo
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, or SVG (max 2MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Color */}
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="AzVirt"
                />
              </div>

              {/* Footer Text */}
              <div className="space-y-2">
                <Label htmlFor="footerText">Email Footer Text</Label>
                <Textarea
                  id="footerText"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="© 2024 AzVirt. All rights reserved."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={updateBranding.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Live Preview */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Email Preview</h2>
            <div className="border rounded-lg overflow-hidden">
              <div
                className="p-6 text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-12 w-auto"
                      style={{ filter: "brightness(0) invert(1)" }}
                    />
                  )}
                  <h3 className="text-2xl font-bold">{companyName}</h3>
                </div>
              </div>
              <div className="p-6 bg-background">
                <h4 className="text-lg font-semibold mb-2">Daily Production Report</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  This is a preview of how your emails will look with your custom branding.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm">Total Concrete Produced</span>
                    <span className="font-semibold">120 m³</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm">Deliveries Completed</span>
                    <span className="font-semibold">8</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm">Quality Tests Passed</span>
                    <span className="font-semibold">15/15</span>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full"
                  style={{
                    backgroundColor: secondaryColor,
                    color: "white",
                  }}
                >
                  View Full Report
                </Button>
              </div>
              <div
                className="p-4 text-center text-sm"
                style={{
                  backgroundColor: `${primaryColor}10`,
                  color: primaryColor,
                }}
              >
                {footerText || "© 2024 AzVirt. All rights reserved."}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
