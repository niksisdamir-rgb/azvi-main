import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WidgetConfig, useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { 
  X, Eye, EyeOff, RotateCcw, Save, Settings, GripVertical, 
  ChevronUp, ChevronDown, Trash2
} from "lucide-react";

interface DashboardCustomizerProps {
  onClose?: () => void;
}

export default function DashboardCustomizer({ onClose }: DashboardCustomizerProps) {
  const {
    widgets,
    layouts,
    updateWidget,
    toggleWidgetVisibility,
    reorderWidgets,
    resetToDefault,
    applyLayout,
    saveCurrentLayout,
    deleteLayout,
  } = useDashboardWidgets();

  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [newLayoutName, setNewLayoutName] = useState("");
  const [showSaveLayout, setShowSaveLayout] = useState(false);

  const handleDragStart = (id: string) => {
    setDraggedWidget(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedWidget || draggedWidget === targetId) return;

    const draggedIdx = widgets.findIndex((w) => w.id === draggedWidget);
    const targetIdx = widgets.findIndex((w) => w.id === targetId);

    const newWidgets = [...widgets];
    [newWidgets[draggedIdx], newWidgets[targetIdx]] = [
      newWidgets[targetIdx],
      newWidgets[draggedIdx],
    ];

    reorderWidgets(newWidgets);
    setDraggedWidget(null);
  };

  const moveWidget = (id: string, direction: "up" | "down") => {
    const idx = widgets.findIndex((w) => w.id === id);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === widgets.length - 1)
    ) {
      return;
    }

    const newWidgets = [...widgets];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newWidgets[idx], newWidgets[swapIdx]] = [
      newWidgets[swapIdx],
      newWidgets[idx],
    ];

    reorderWidgets(newWidgets);
  };

  const handleSaveLayout = () => {
    if (newLayoutName.trim()) {
      saveCurrentLayout(newLayoutName);
      setNewLayoutName("");
      setShowSaveLayout(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-3 sticky top-0 bg-card/95 border-b border-primary/20">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Prilagođavanje kontrolne table
          </CardTitle>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Preset Layouts */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Unapred postavljeni šabloni</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(layouts).map(([key, layout]) => (
                <Button
                  key={key}
                  variant="outline"
                  className="text-xs"
                  onClick={() => applyLayout(key)}
                >
                  {layout.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Save Current Layout */}
          {!showSaveLayout ? (
            <Button
              onClick={() => setShowSaveLayout(true)}
              variant="outline"
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Sačuvaj trenutni raspored
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Naziv šablona..."
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                className="bg-background/50 border-primary/20"
              />
              <Button onClick={handleSaveLayout} size="sm">
                Sačuvaj
              </Button>
              <Button
                onClick={() => setShowSaveLayout(false)}
                variant="outline"
                size="sm"
              >
                Otkaži
              </Button>
            </div>
          )}

          {/* Widget List */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Vidžeti</h3>
            <div className="space-y-2">
              {widgets.map((widget, idx) => (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={() => handleDragStart(widget.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(widget.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    draggedWidget === widget.id
                      ? "bg-primary/20 border-primary/40"
                      : "bg-background/50 border-primary/10 hover:border-primary/20"
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{widget.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Redosled: {widget.order + 1}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveWidget(widget.id, "up")}
                      disabled={idx === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveWidget(widget.id, "down")}
                      disabled={idx === widgets.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className="h-8 w-8 p-0"
                    >
                      {widget.visible ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>

                    <select
                      value={widget.width}
                      onChange={(e) =>
                        updateWidget(widget.id, {
                          width: e.target.value as WidgetConfig["width"],
                        })
                      }
                      className="text-xs px-2 py-1 rounded bg-background/50 border border-primary/20 text-foreground"
                    >
                      <option value="full">Puno</option>
                      <option value="half">Pola</option>
                      <option value="third">Trećina</option>
                      <option value="quarter">Četvrtina</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-primary/20">
            <Button
              onClick={resetToDefault}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetuj na podrazumevano
            </Button>
            {onClose && (
              <Button onClick={onClose} className="flex-1">
                Gotovo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
