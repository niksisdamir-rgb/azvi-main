import React from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function InventoryAnalytics() {
  const { data: costData, isLoading: isCostLoading } = trpc.inventoryAnalytics.getCostAnalysis.useQuery();
  const { data: turnoverData, isLoading: isTurnoverLoading } = trpc.inventoryAnalytics.getTurnoverRate.useQuery();
  const { data: abcData, isLoading: isAbcLoading } = trpc.inventoryAnalytics.getAbcAnalysis.useQuery();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  if (isCostLoading || isTurnoverLoading || isAbcLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Cost Data preparation
  const costSummary = [
    { name: 'Holding Costs', value: costData?.totalHoldingCost || 0 },
    { name: 'Order Costs', value: costData?.totalOrderCost || 0 }
  ];

  const topMaterialsCost = costData?.materialsCost?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* 1. Inventory Cost Analysis Dashboard */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Cost Analysis Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(costData?.totalInventoryValue || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Est. Holding Costs (Annual)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{formatCurrency(costData?.totalHoldingCost || 0)}</div>
              <p className="text-xs text-muted-foreground">Based on 20% holding rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Order Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{formatCurrency(costData?.totalOrderCost || 0)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Costs Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costSummary}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {costSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Materials by Holding Cost</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMaterialsCost} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(val) => `$${val}`} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="holdingCost" name="Holding Cost" fill="#FF8042" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Inventory Turnover Rate Visualization */}
      <div className="pt-6">
        <h2 className="text-2xl font-bold mb-4">Turnover Rate Visualization</h2>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Turnover Rate</p>
                <div className="text-3xl font-bold">{(turnoverData?.turnoverRate || 0).toFixed(2)}x</div>
                <p className="text-xs text-muted-foreground">Over last {turnoverData?.periodDays || 30} days</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Annualized Turnover</p>
                <div className="text-3xl font-bold text-green-500">{(turnoverData?.annualizedTurnover || 0).toFixed(2)}x</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Turnover Rates by Material (Top 10)</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnoverData?.materialTurnover || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="turnoverRate" name="Turnover Rate" fill="#00C49F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 3. ABC Analysis Chart */}
      <div className="pt-6">
        <h2 className="text-2xl font-bold mb-4">ABC Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle>Class A (High Value)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{abcData?.summary?.A.count || 0} items</div>
              <p className="text-sm text-muted-foreground">{formatCurrency(abcData?.summary?.A.value || 0)} total value</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle>Class B (Medium Value)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{abcData?.summary?.B.count || 0} items</div>
              <p className="text-sm text-muted-foreground">{formatCurrency(abcData?.summary?.B.value || 0)} total value</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle>Class C (Low Value)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{abcData?.summary?.C.count || 0} items</div>
              <p className="text-sm text-muted-foreground">{formatCurrency(abcData?.summary?.C.value || 0)} total value</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Material Classification List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Annual Value</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead className="text-center">Class</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abcData?.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.annualValue)}</TableCell>
                    <TableCell className="text-right">{item.percentageOfTotal.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.classification === 'A' ? 'destructive' : item.classification === 'B' ? 'secondary' : 'outline'}>
                        {item.classification}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
