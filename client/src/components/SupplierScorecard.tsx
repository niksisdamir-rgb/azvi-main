import React from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from "recharts";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";

interface SupplierScorecardProps {
  supplierId: number;
}

export const SupplierScorecard: React.FC<SupplierScorecardProps> = ({ supplierId }) => {
  const { data: scorecard, isLoading } = trpc.supplierAnalytics.getScorecard.useQuery({ supplierId });

  if (isLoading) {
    return <Skeleton className="w-full h-[300px]" />;
  }

  if (!scorecard) return null;

  const data = [
    { subject: "On-Time Delivery", A: scorecard.onTimeDeliveryRate, fullMark: 100 },
    { subject: "Quality Score", A: scorecard.qualityScore, fullMark: 100 },
    { subject: "Fulfillment Accuracy", A: scorecard.fulfillmentAccuracy, fullMark: 100 },
  ];

  const overallScore = Math.round(
    (scorecard.onTimeDeliveryRate + scorecard.qualityScore + scorecard.fulfillmentAccuracy) / 3
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Supplier Performance Scorecard</CardTitle>
        <Badge variant={overallScore >= 80 ? "default" : overallScore >= 60 ? "secondary" : "destructive"}>
          Overall: {overallScore}%
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Supplier"
                dataKey="A"
                stroke="#2563eb"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="font-semibold">{scorecard.onTimeDeliveryRate}%</div>
            <div className="text-muted-foreground">On-Time</div>
          </div>
          <div>
            <div className="font-semibold">{scorecard.qualityScore}%</div>
            <div className="text-muted-foreground">Quality</div>
          </div>
          <div>
            <div className="font-semibold">{scorecard.fulfillmentAccuracy}%</div>
            <div className="text-muted-foreground">Fulfillment</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
