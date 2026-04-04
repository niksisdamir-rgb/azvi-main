import React from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { PackageOpen, TrendingUp } from "lucide-react";

interface MaterialBundlingSuggestionsProps {
  supplierId?: number;
}

export const MaterialBundlingSuggestions: React.FC<MaterialBundlingSuggestionsProps> = ({ supplierId }) => {
  const { data: suggestions, isLoading } = trpc.supplierAnalytics.getMaterialBundling.useQuery({ 
    supplierId 
  });

  if (isLoading) {
    return <Skeleton className="w-full h-[300px]" />;
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Bundling Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground italic text-sm">
          No bundling data available for this supplier.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          Frequently Ordered Together
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-2">
                <PackageOpen className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">{suggestion.pair}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {suggestion.count} orders
              </Badge>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] text-muted-foreground uppercase tracking-wider text-center font-bold">
          Optimization Suggestion: Bundle these for better pricing or delivery.
        </p>
      </CardContent>
    </Card>
  );
};
