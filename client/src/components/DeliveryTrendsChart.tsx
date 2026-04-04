import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Loader2, TrendingUp } from "lucide-react";

export default function DeliveryTrendsChart() {
  const { data, isLoading } = trpc.dashboard.deliveryTrends.useQuery();

  if (isLoading) {
    return (
      <Card className="border-orange-500/20 bg-black/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Delivery Trends
          </CardTitle>
          <CardDescription>Monthly delivery volume and count</CardDescription>
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
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Delivery Trends
          </CardTitle>
          <CardDescription>Monthly delivery volume and count</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-gray-400">No delivery data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-500/20 bg-black/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          Delivery Trends
        </CardTitle>
        <CardDescription>Last 6 months delivery statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="month" 
              stroke="#888"
              tick={{ fill: '#888' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="#888"
              tick={{ fill: '#888' }}
              label={{ value: 'Deliveries', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#888"
              tick={{ fill: '#888' }}
              label={{ value: 'Volume (m³)', angle: 90, position: 'insideRight', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #ff6c0e',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend 
              wrapperStyle={{ color: '#888' }}
            />
            <Bar 
              yAxisId="left"
              dataKey="deliveries" 
              fill="#ff6c0e" 
              name="Deliveries"
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              yAxisId="right"
              dataKey="volume" 
              fill="#c1c5c8" 
              name="Volume (m³)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
