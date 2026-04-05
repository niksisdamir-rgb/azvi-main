import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Building2, Mail, Phone, Clock, TrendingUp, Edit, Trash2, Save, Send, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { SupplierScorecard } from "@/components/SupplierScorecard";
import { MaterialBundlingSuggestions } from "@/components/MaterialBundlingSuggestions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    leadTimeDays: 7,
  });

  const [selectedAnalyticsSupplier, setSelectedAnalyticsSupplier] = useState<number | null>(null);

  const [emailTemplate, setEmailTemplate] = useState(`Subject: Purchase Order #{{po_id}} - AzVirt DMS

Dear {{supplier_name}},

Please find attached Purchase Order #{{po_id}} for {{material_name}}.

Quantity: {{quantity}} {{unit}}
Expected Delivery: {{expected_delivery}}

Notes: {{notes}}

Best regards,
AzVirt Logistics Team`);

  const { data: suppliers, refetch } = trpc.suppliers.list.useQuery();

  // Set initial selected supplier for analytics
  if (!selectedAnalyticsSupplier && suppliers && suppliers.length > 0) {
    setSelectedAnalyticsSupplier(suppliers[0].id);
  }

  const createSupplier = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("Supplier added successfully");
      setIsDialogOpen(false);
      refetch();
      resetForm();
    },
  });

  const updateSupplier = trpc.suppliers.update.useMutation({
    onSuccess: () => {
      toast.success("Supplier updated successfully");
      setIsDialogOpen(false);
      refetch();
      resetForm();
    },
  });

  const deleteSupplier = trpc.suppliers.delete.useMutation({
    onSuccess: () => {
      toast.success("Supplier deleted successfully");
      refetch();
    },
  });

  const resetForm = () => {
    setEditingSupplier(null);
    setFormData({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      leadTimeDays: 7,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier.mutate({
        id: editingSupplier.id,
        data: formData
      });
    } else {
      createSupplier.mutate(formData);
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      leadTimeDays: supplier.leadTimeDays || 7,
    });
    setIsDialogOpen(true);
  };

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Supplier Management</h1>
            <p className="text-muted-foreground">Manage material vendors, lead times, and communications</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingSupplier ? 'Edit' : 'Add'} Supplier</DialogTitle>
                  <DialogDescription>Enter supplier details for procurement tracking</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Supplier Name *</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      required
                      autoComplete="organization"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact">Contact Person</Label>
                    <Input 
                      id="contact" 
                      value={formData.contactPerson} 
                      onChange={e => setFormData({...formData, contactPerson: e.target.value})} 
                      autoComplete="name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        autoComplete="email"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="leadTime">Average Lead Time (Days)</Label>
                    <Input 
                      id="leadTime" 
                      type="number" 
                      value={formData.leadTimeDays} 
                      onChange={e => setFormData({...formData, leadTimeDays: parseInt(e.target.value)})} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createSupplier.isPending || updateSupplier.isPending}>
                    {editingSupplier ? 'Update' : 'Create'} Supplier
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Supplier Directory
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics & Performance
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Communication Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex items-center gap-2 bg-white p-2 rounded-md border shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground ml-2" />
              <Input 
                placeholder="Search suppliers by name, contact, or email..." 
                className="border-0 shadow-none focus-visible:ring-0" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers?.map((supplier) => (
                <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                        <CardDescription>{supplier.contactPerson || "No contact person"}</CardDescription>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {supplier.leadTimeDays}d lead
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-1 text-sm">
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {supplier.phone}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex justify-between items-center border-t mt-2">
                      <div className="flex items-center gap-2">
                         <div className="text-xs font-medium text-muted-foreground">Performance</div>
                         <Badge variant={supplier.onTimeDeliveryRate >= 90 ? "default" : "secondary"} className="text-[10px] h-5">
                            {supplier.onTimeDeliveryRate}% OTDR
                         </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(supplier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this supplier?")) {
                              deleteSupplier.mutate({ id: supplier.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredSuppliers?.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                  <p className="text-muted-foreground font-medium">No suppliers found.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Select Supplier</CardTitle>
                    <CardDescription>View performance metrics for a specific supplier</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select 
                      value={selectedAnalyticsSupplier?.toString()} 
                      onValueChange={(v) => setSelectedAnalyticsSupplier(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers?.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <MaterialBundlingSuggestions supplierId={selectedAnalyticsSupplier || undefined} />
              </div>

              <div className="w-full md:w-2/3">
                {selectedAnalyticsSupplier && (
                  <SupplierScorecard supplierId={selectedAnalyticsSupplier} />
                )}
                {!selectedAnalyticsSupplier && (
                   <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-muted-foreground italic">
                      Please select a supplier to view their scorecard.
                   </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Global Material Bundling Insights</CardTitle>
                  <CardDescription>Frequently ordered material combinations across all suppliers</CardDescription>
                </CardHeader>
                <CardContent>
                   <MaterialBundlingSuggestions />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>PO Email Template</CardTitle>
                    <CardDescription>Customize the message sent to suppliers when a PO is dispatched</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => toast.success("Template saved successfully")}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label>Editor</Label>
                    <Textarea 
                      value={emailTemplate}
                      onChange={e => setEmailTemplate(e.target.value)}
                      className="min-h-[400px] font-mono text-sm leading-relaxed"
                    />
                    <div className="p-4 bg-muted rounded-md space-y-2">
                       <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Placeholders</p>
                       <div className="grid grid-cols-2 gap-2 text-xs">
                          <code>{"{{po_id}}"}</code>
                          <code>{"{{supplier_name}}"}</code>
                          <code>{"{{material_name}}"}</code>
                          <code>{"{{quantity}}"}</code>
                          <code>{"{{unit}}"}</code>
                          <code>{"{{expected_delivery}}"}</code>
                       </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                       <Send className="h-3 w-3" /> Preview
                    </Label>
                    <div className="border rounded-md p-6 bg-white shadow-sm min-h-[400px] whitespace-pre-wrap text-sm text-slate-800">
                       {emailTemplate
                          .replace(/{{po_id}}/g, "1024")
                          .replace(/{{supplier_name}}/g, "Baku Cement Ltd")
                          .replace(/{{material_name}}/g, "Portland Cement (Grade 42.5)")
                          .replace(/{{quantity}}/g, "500")
                          .replace(/{{unit}}/g, "bags")
                          .replace(/{{expected_delivery}}/g, "2026-03-05")
                          .replace(/{{notes}}/g, "Please call 30 mins before arrival at Site A.")
                       }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
