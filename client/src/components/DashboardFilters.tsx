import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, X } from "lucide-react";

interface DashboardFiltersProps {
  onFilterChange?: (filters: any) => void;
  onClose?: () => void;
}

export default function DashboardFilters({ onFilterChange, onClose }: DashboardFiltersProps) {
  const [filters, setFilters] = useState({
    projectId: "",
    status: "all",
    dateFrom: "",
    dateTo: "",
    searchQuery: "",
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleReset = () => {
    const emptyFilters = {
      projectId: "",
      status: "all",
      dateFrom: "",
      dateTo: "",
      searchQuery: "",
    };
    setFilters(emptyFilters);
    onFilterChange?.(emptyFilters);
  };

  return (
    <Card className="bg-card/90 backdrop-blur border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Napredni filteri</CardTitle>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Pretraga</label>
          <Input
            placeholder="Pretraži po nazivu, ID-u..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
            className="bg-background/50 border-primary/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-background/50 border border-primary/20 text-sm"
            >
              <option value="all">Svi</option>
              <option value="active">Aktivni</option>
              <option value="pending">Na čekanju</option>
              <option value="completed">Završeni</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Projekat</label>
            <select
              value={filters.projectId}
              onChange={(e) => handleFilterChange("projectId", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-background/50 border border-primary/20 text-sm"
            >
              <option value="">Svi projekti</option>
              <option value="1">Projekat A</option>
              <option value="2">Projekat B</option>
              <option value="3">Projekat C</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Od
            </label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              className="bg-background/50 border-primary/20"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Do
            </label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              className="bg-background/50 border-primary/20"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            Resetuj
          </Button>
          <Button onClick={onClose} className="flex-1">
            Primeni
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
