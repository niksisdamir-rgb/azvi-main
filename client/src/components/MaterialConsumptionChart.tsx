import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, Package } from "lucide-react";

export default function MaterialConsumptionChart() {
  const { data, isLoading } = trpc.dashboard.materialConsumption.useQuery();

  if (isLoading) {
    return (
      <Card className="border-orange-500/20 bg-black/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-500" />
            Material Inventory
          </CardTitle>
          <CardDescription>Current stock levels</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-orange-500/20 bg-black/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-500" />
            Material Inventory
          </CardTitle>
          <CardDescription>Current stock levels</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-gray-400">No material data available</p>
        </CardContent>
      </Card>
    );
  }

  // Color materials based on stock level
  const getBarColor = (quantity: number, minStock: number) => {
    if (quantity <= minStock) return '#ef4444'; // Red for low stock
    if (quantity <= minStock * 1.5) return '#f59e0b'; // Amber for medium stock
    return '#10b981'; // Green for good stock
  };

  return (
    <Card className="border-orange-500/20 bg-black/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-500" />
          Material Inventory
        </CardTitle>
        <CardDescription>Top 6 materials by stock quantity</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              type="number"
              stroke="#888"
              tick={{ fill: '#888' }}
            />
            <YAxis 
              type="category"
              dataKey="name" 
              stroke="#888"
              tick={{ fill: '#888' }}
              width={120}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #ff6c0e',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number, name: string, props: any) => {
                const unit = props.payload.unit || '';
                const minStock = props.payload.minStock || 0;
                return [
                  `${value} ${unit}`,
                  name === 'quantity' ? `Stock (Min: ${minStock} ${unit})` : name
                ];
              }}
            />
            <Bar 
              dataKey="quantity" 
              name="Current Stock"
              radius={[0, 8, 8, 0]}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.quantity, entry.minStock)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-400">Good Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span className="text-gray-400">Medium Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-gray-400">Low Stock</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
