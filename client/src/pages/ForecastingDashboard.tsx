import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, TrendingDown, Package, ShoppingCart, Calendar, RefreshCw, Activity } from "lucide-react";
import { toast } from "sonner";

export default function ForecastingDashboard() {
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [scenarioMultiplier, setScenarioMultiplier] = useState<number>(1.0);

  const { data: forecasts, isLoading: forecastsLoading, refetch: refetchForecasts } = trpc.materials.getForecasts.useQuery();
  const { data: materials } = trpc.materials.list.useQuery();
  const { data: consumptionHistory } = trpc.materials.getConsumptionHistory.useQuery({
    materialId: selectedMaterial || undefined,
    days: 30,
  });

  const generateForecasts = trpc.materials.generateForecasts.useMutation({
    onSuccess: () => {
      toast.success("Forecasts updated successfully");
      refetchForecasts();
    },
  });

  const createPO = trpc.purchaseOrders.generatePurchaseOrder.useMutation({
    onSuccess: () => {
      toast.success("Purchase order created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create PO");
    }
  });

  // Group consumption by date for chart
  const consumptionChartData = consumptionHistory?.reduce((acc: any[], item) => {
    const date = new Date(item.date).toLocaleDateString();
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.quantity += item.quantityUsed;
    } else {
      acc.push({ date, quantity: item.quantityUsed });
    }
    return acc;
  }, []) || [];

  // Generate local projection chart data with What-If scenario multiplier
  const activeMaterial = materials?.find(m => m.id === selectedMaterial);
  const activeForecast = forecasts?.find(f => f.materialId === selectedMaterial);
  
  const projectedChartData = [];
  let simulatedStockoutDate = null;
  if (activeMaterial && activeForecast) {
    let stock = activeMaterial.quantity;
    const baseRate = activeForecast.dailyConsumptionRate || 0;
    const dailyRate = baseRate * scenarioMultiplier;
    
    for (let i = 0; i <= 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        projectedChartData.push({
            date: d.toLocaleDateString(),
            stock: Math.max(0, Math.round(stock)),
            reorderPoint: activeMaterial.reorderPoint || 0
        });
        
        if (stock > 0 && stock - dailyRate <= 0 && !simulatedStockoutDate) {
           simulatedStockoutDate = new Date(d);
        }
        stock -= dailyRate;
    }
  }

  // Critical materials (less than 7 days until stockout)
  const criticalMaterials = forecasts?.filter(f => (f.daysUntilStockout || 999) < 7) || [];

  // Warning materials (7-14 days until stockout)
  const warningMaterials = forecasts?.filter(f => {
    const days = f.daysUntilStockout || 999;
    return days >= 7 && days < 14;
  }) || [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventory Forecasting</h1>
            <p className="text-muted-foreground">AI-powered stock predictions and reorder recommendations</p>
          </div>
          <Button
            onClick={() => generateForecasts.mutate()}
            disabled={generateForecasts.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Update Forecasts
          </Button>
        </div>

        {/* Critical Alerts */}
        {criticalMaterials.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Stock Levels!</AlertTitle>
            <AlertDescription>
              {criticalMaterials.length} material(s) will run out within 7 days. Immediate action required.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Materials</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalMaterials.length}</div>
              <p className="text-xs text-muted-foreground">&lt; 7 days until stockout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warning Materials</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warningMaterials.length}</div>
              <p className="text-xs text-muted-foreground">7-14 days until stockout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{materials?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Being tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {forecasts && forecasts.length > 0
                  ? Math.round(forecasts.reduce((sum, f) => sum + (f.confidence || 0), 0) / forecasts.length)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Prediction accuracy</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="forecasts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="forecasts">Forecasts & Alerts</TabsTrigger>
            <TabsTrigger value="consumption">Data & Projections</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          </TabsList>

          <TabsContent value="forecasts" className="space-y-4">
            {/* Forecast Table */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Predictions</CardTitle>
                <CardDescription>AI-powered forecasts based on 30-day consumption patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {forecastsLoading ? (
                  <p>Loading forecasts...</p>
                ) : forecasts && forecasts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Material</th>
                          <th className="text-right p-3">Current Stock</th>
                          <th className="text-right p-3">Reorder Point</th>
                          <th className="text-right p-3">Daily Usage</th>
                          <th className="text-right p-3">Days Until Stockout</th>
                          <th className="text-right p-3">Recommended Order (EOQ)</th>
                           <th className="text-center p-3">Confidence</th>
                           <th className="text-center p-3">Status</th>
                           <th className="text-center p-3">Quick Action</th>
                         </tr>
                       </thead>
                      <tbody>
                        {forecasts.map((forecast) => {
                          const material = materials?.find(m => m.id === forecast.materialId);
                          const daysLeft = forecast.daysUntilStockout || 999;
                          const status = daysLeft < 7 ? 'critical' : daysLeft < 14 ? 'warning' : 'ok';

                          return (
                            <tr key={forecast.id} className="border-b hover:bg-muted/50">
                              <td className="text-right p-3 font-medium">{forecast.materialName}</td>
                              <td className="text-right p-3">{forecast.currentStock} {material?.unit}</td>
                              <td className="text-right p-3 text-orange-400 font-semibold">{material?.reorderPoint || 'N/A'} {material?.unit}</td>
                              <td className="text-right p-3">{forecast.dailyConsumptionRate} {material?.unit}/day</td>
                              <td className="text-right p-3">
                                <span className={
                                  status === 'critical' ? 'text-destructive font-bold' :
                                    status === 'warning' ? 'text-orange-500 font-semibold' :
                                      'text-green-600'
                                }>
                                  {daysLeft} days
                                </span>
                              </td>
                              <td className="text-right p-3 font-semibold">{forecast.recommendedOrderQty} {material?.unit}</td>
                              <td className="text-center p-3">
                                <Badge variant="outline">{forecast.confidence}%</Badge>
                              </td>
                              <td className="text-center p-3">
                                <Badge variant={
                                  status === 'critical' ? 'destructive' :
                                    status === 'warning' ? 'default' :
                                      'secondary'
                                }>
                                  {status === 'critical' ? '🔴 Critical' :
                                    status === 'warning' ? '🟡 Warning' :
                                      '🟢 OK'}
                                 </Badge>
                               </td>
                               <td className="text-center p-3">
                                 {(status === 'critical' || status === 'warning') && material?.supplierId && (
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     className="h-8 gap-1"
                                     disabled={createPO.isPending}
                                     onClick={() => createPO.mutate({
                                       supplierId: material.supplierId!,
                                       items: [{
                                         materialId: forecast.materialId,
                                         quantity: forecast.recommendedOrderQty || 100
                                       }],
                                       notes: "Auto-generated from Forecasting Dashboard"
                                     })}
                                   >
                                     <ShoppingCart className="h-3 w-3" />
                                     1-Click PO
                                   </Button>
                                 )}
                               </td>
                             </tr>
                           );
                         })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No forecast data available. Click "Update Forecasts" to generate predictions.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consumption" className="space-y-4">
            {/* Material Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Material</CardTitle>
                <CardDescription>View consumption trends for specific materials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {materials?.map(material => (
                    <Button
                      key={material.id}
                      variant={selectedMaterial === material.id ? "default" : "outline"}
                      onClick={() => { setSelectedMaterial(material.id); setScenarioMultiplier(1.0); }}
                      className="justify-start"
                    >
                      {material.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Consumption Chart */}
            {selectedMaterial && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Historical Consumption</CardTitle>
                    <CardDescription>
                      Past 30-day usage for {materials?.find(m => m.id === selectedMaterial)?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {consumptionChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={consumptionChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="quantity"
                            stroke="#f97316"
                            strokeWidth={2}
                            name="Quantity Used"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No historical consumption data available.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>30-Day Projection & What-If Scenario</CardTitle>
                    <CardDescription>
                      Simulate stock levels if material usage increases or decreases
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Expected Usage Multiplier: <span className="font-bold text-primary">{Math.round(scenarioMultiplier * 100)}%</span></Label>
                        {simulatedStockoutDate && (
                          <Badge variant="destructive" className="font-mono">
                            Depletes: {simulatedStockoutDate.toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <Slider 
                        defaultValue={[1]} 
                        max={3} 
                        min={0.1} 
                        step={0.1}
                        value={[scenarioMultiplier]}
                        onValueChange={(val) => setScenarioMultiplier(val[0])}
                      />
                      <p className="text-xs text-muted-foreground">
                        Base Daily Rate: {activeForecast?.dailyConsumptionRate} {activeMaterial?.unit}/day.
                        Simulated: {(activeForecast?.dailyConsumptionRate || 0) * scenarioMultiplier} {activeMaterial?.unit}/day.
                      </p>
                    </div>

                    {projectedChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={projectedChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" hide />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="stock"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Projected Stock"
                            dot={false}
                          />
                          <Line
                            type="step"
                            dataKey="reorderPoint"
                            stroke="#ef4444"
                            strokeDasharray="5 5"
                            name="Reorder Point"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No projection active.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Suppliers Management</CardTitle>
                  <CardDescription>Manage your material vendors and performance</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  Add Supplier
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Contact</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-right p-3">Lead Time (Days)</th>
                        <th className="text-center p-3">On-Time Rate</th>
                        <th className="text-center p-3">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">Lafarge Holcim</td>
                        <td className="p-3">John Smith</td>
                        <td className="p-3">sales@lafarge.com</td>
                        <td className="text-right p-3">3 days</td>
                        <td className="text-center p-3">98%</td>
                        <td className="text-center p-3">
                          <Badge className="bg-green-500">Gold</Badge>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">Baku Cement</td>
                        <td className="p-3">Ali Aliyev</td>
                        <td className="p-3">contact@baku-cement.az</td>
                        <td className="text-right p-3">5 days</td>
                        <td className="text-center p-3">92%</td>
                        <td className="text-center p-3">
                          <Badge className="bg-blue-500">Silver</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout >
  );
}
