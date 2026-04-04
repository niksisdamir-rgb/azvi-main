import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Send, CheckCircle, XCircle, Clock, Package, Filter, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PurchaseOrders() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    quantity: "",
    supplier: "",
    supplierEmail: "",
    expectedDelivery: "",
    totalCost: "",
    notes: "",
  });
  const [activeTab, setActiveTab] = useState("all");
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [receivingOrderId, setReceivingOrderId] = useState<number | null>(null);
  const [receiveData, setReceiveData] = useState({
    actualDelivery: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: purchaseOrders, refetch } = trpc.purchaseOrders.getPurchaseOrderHistory.useQuery();
  const { data: materials } = trpc.materials.list.useQuery();
  const { data: forecasts } = trpc.materials.getForecasts.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();

  const createPO = trpc.purchaseOrders.generatePurchaseOrder.useMutation({
    onSuccess: () => {
      toast.success("Purchase order created successfully");
      setIsCreateOpen(false);
      refetch();
      resetForm();
    },
  });

  const updatePO = trpc.purchaseOrders.updatePurchaseOrderStatus.useMutation({
    onSuccess: () => {
      toast.success("Purchase order updated");
      refetch();
    },
  });

  const sendToSupplier = trpc.purchaseOrders.sendPurchaseOrderToSupplier.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Purchase order sent to supplier");
        refetch();
      } else {
        toast.error(data.message || "Failed to send email");
      }
    },
  });

  const receivePO = trpc.purchaseOrders.receivePurchaseOrder.useMutation({
    onSuccess: () => {
      toast.success("Purchase order received and inventory updated");
      refetch();
    },
  });

  const resetForm = () => {
    setSelectedMaterialId(null);
    setFormData({
      quantity: "",
      supplier: "",
      supplierEmail: "",
      expectedDelivery: "",
      totalCost: "",
      notes: "",
    });
  };

  const handleCreate = () => {
    if (!selectedMaterialId) {
      toast.error("Please select a material");
      return;
    }

    const material = materials?.find(m => m.id === selectedMaterialId);
    if (!material) return;
    
    // Find or prompt for a valid supplier - in a real implementation we'd use a supplier dropdown
    const supplierObj = suppliers?.find(s => s.name === formData.supplier) || suppliers?.[0];
    
    if (!supplierObj) {
      toast.error("Valid supplier required");
      return;
    }

    createPO.mutate({
      supplierId: supplierObj.id,
      items: [{
        materialId: selectedMaterialId,
        quantity: parseInt(formData.quantity)
      }],
      expectedDelivery: formData.expectedDelivery ? new Date(formData.expectedDelivery) : undefined,
      totalCost: formData.totalCost ? parseInt(formData.totalCost) : undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleReceive = () => {
    if (!receivingOrderId) return;
    receivePO.mutate({
      orderId: receivingOrderId,
      actualDelivery: new Date(receiveData.actualDelivery),
      notes: receiveData.notes || undefined,
    });
    setIsReceiveDialogOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'ordered': return <Send className="h-4 w-4 text-purple-500" />;
      case 'received': return <Package className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'received': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage material orders and supplier communications</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Purchase Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Purchase Order</DialogTitle>
                <DialogDescription>Generate a new purchase order for material restocking</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="material">Material *</Label>
                  <Select onValueChange={(value) => {
                    const materialId = parseInt(value);
                    setSelectedMaterialId(materialId);
                    const material = materials?.find(m => m.id === materialId);
                    const forecast = forecasts?.find(f => f.materialId === materialId);
                    if (material) {
                      setFormData(prev => ({
                        ...prev,
                        supplier: material.supplier || "",
                        supplierEmail: material.supplierEmail || "",
                        quantity: forecast?.recommendedOrderQty?.toString() || "",
                      }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials?.map(material => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name} ({material.quantity} {material.unit} in stock)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="totalCost">Total Cost (optional)</Label>
                    <Input
                      id="totalCost"
                      type="number"
                      value={formData.totalCost}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalCost: e.target.value }))}
                      placeholder="Enter cost"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Supplier name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supplierEmail">Supplier Email</Label>
                    <Input
                      id="supplierEmail"
                      type="email"
                      value={formData.supplierEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplierEmail: e.target.value }))}
                      placeholder="supplier@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                  <Input
                    id="expectedDelivery"
                    type="date"
                    value={formData.expectedDelivery}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or requirements"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createPO.isPending}>
                  Create Purchase Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="ordered">Ordered</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {/* Purchase Orders Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {activeTab === 'all' ? 'All' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Purchase Orders
                    </CardTitle>
                    <CardDescription>
                      {activeTab === 'all' 
                        ? 'Track and manage all material orders' 
                        : `View and manage ${activeTab} orders`}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="h-fit">
                    {purchaseOrders?.filter(po => activeTab === 'all' || po.status === activeTab).length || 0} Total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {purchaseOrders && purchaseOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">PO #</th>
                          <th className="text-left p-3">Material</th>
                          <th className="text-right p-3">Quantity</th>
                          <th className="text-left p-3">Supplier</th>
                          <th className="text-left p-3">Order Date</th>
                          <th className="text-left p-3">Expected Delivery</th>
                          <th className="text-center p-3">Status</th>
                          <th className="text-center p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrders
                          .filter(po => activeTab === 'all' || po.status === activeTab)
                          .map((po) => {
                          const supplier = suppliers?.find(s => s.id === po.supplierId);
                          const firstItem = po.items?.[0];
                          const material = materials?.find(m => m.id === firstItem?.materialId);
                          const totalQuantity = po.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
                          const materialName = po.items?.length > 1 ? 'Multiple Items' : material?.name || 'Unknown Item';

                          return (
                          <tr key={po.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 font-mono text-sm">#{po.id}</td>
                            <td className="p-3 font-medium">{materialName}</td>
                            <td className="text-right p-3">{totalQuantity}</td>
                            <td className="p-3">{supplier?.name || 'N/A'}</td>
                            <td className="p-3">{new Date(po.orderDate).toLocaleDateString()}</td>
                            <td className="p-3">
                              {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : 'TBD'}
                            </td>
                            <td className="text-center p-3">
                              <Badge variant={getStatusVariant(po.status)} className="flex items-center gap-1 w-fit mx-auto">
                                {getStatusIcon(po.status)}
                                {po.status}
                              </Badge>
                            </td>
                            <td className="text-center p-3">
                              <div className="flex gap-2 justify-center">
                                {po.status === 'pending' && isAdmin && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => updatePO.mutate({ orderId: po.id, status: 'approved' })}
                                    >
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => updatePO.mutate({ orderId: po.id, status: 'cancelled' })}
                                    >
                                      <XCircle className="mr-1 h-3 w-3" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {po.status === 'pending' && !isAdmin && (
                                   <Badge variant="outline" className="text-xs text-muted-foreground italic">
                                      Awaiting Approval
                                   </Badge>
                                )}
                                {po.status === 'approved' && supplier?.email && (
                                  <Button
                                    size="sm"
                                    onClick={() => sendToSupplier.mutate({ orderId: po.id })}
                                    disabled={sendToSupplier.isPending}
                                  >
                                    <Send className="mr-1 h-3 w-3" />
                                    Send to Supplier
                                  </Button>
                                )}
                                {po.status === 'ordered' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReceivingOrderId(po.id);
                                      setIsReceiveDialogOpen(true);
                                    }}
                                  >
                                    <Package className="mr-1 h-3 w-3" />
                                    Mark Received
                                  </Button>
                                )}
                                {po.status === 'cancelled' && isAdmin && (
                                   <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-muted-foreground"
                                      onClick={() => {
                                         if (confirm("Delete this rejected order?")) {
                                            // We don't have a delete procedure, maybe just leave it
                                            toast.info("Order deletion not implemented");
                                         }
                                      }}
                                   >
                                      <Trash2 className="h-4 w-4" />
                                   </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No purchase orders found for this category.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Receive Confirmation Dialog */}
        <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delivery Receipt</DialogTitle>
              <DialogDescription>
                Confirm that all materials for PO #{receivingOrderId} have been received. 
                This will automatically update the inventory stock levels.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="deliveryDate">Actual Delivery Date</Label>
                <Input 
                  id="deliveryDate" 
                  type="date" 
                  value={receiveData.actualDelivery}
                  onChange={e => setReceiveData({...receiveData, actualDelivery: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="receiveNotes">Receiving Notes / Discrepancies</Label>
                <Textarea 
                  id="receiveNotes" 
                  placeholder="e.g. Received exactly as ordered, or mention any damage..."
                  value={receiveData.notes}
                  onChange={e => setReceiveData({...receiveData, notes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleReceive} disabled={receivePO.isPending}>
                Confirm & Update Inventory
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
