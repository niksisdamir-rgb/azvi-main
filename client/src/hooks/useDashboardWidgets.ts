import { useState, useEffect } from "react";

export interface WidgetConfig {
  id: string;
  title: string;
  visible: boolean;
  width: "full" | "half" | "third" | "quarter";
  order: number;
}

export interface DashboardLayout {
  name: string;
  widgets: WidgetConfig[];
  createdAt: number;
  isDefault?: boolean;
}

const STORAGE_KEY = "azvirt_dashboard_layout";
const LAYOUTS_STORAGE_KEY = "azvirt_dashboard_layouts";

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "projects", title: "Aktivni projekti", visible: true, width: "quarter", order: 0 },
  { id: "documents", title: "Dokumenti", visible: true, width: "quarter", order: 1 },
  { id: "deliveries", title: "Današnje isporuke", visible: true, width: "quarter", order: 2 },
  { id: "materials", title: "Artikli sa niskim zalihama", visible: true, width: "quarter", order: 3 },
  { id: "stats-materials", title: "Ukupno materijala", visible: true, width: "third", order: 4 },
  { id: "stats-tests", title: "Testovi na čekanju", visible: true, width: "third", order: 5 },
  { id: "stats-deliveries", title: "Ukupno isporuka", visible: true, width: "third", order: 6 },
  { id: "quick-actions", title: "Brze akcije", visible: true, width: "half", order: 7 },
  { id: "system-overview", title: "Pregled sistema", visible: true, width: "half", order: 8 },
  { id: "delivery-trends", title: "Trendovi isporuke", visible: true, width: "half", order: 9 },
  { id: "material-consumption", title: "Potrošnja materijala", visible: true, width: "half", order: 10 },
];

const PRESET_LAYOUTS: Record<string, DashboardLayout> = {
  manager: {
    name: "Manager",
    isDefault: true,
    createdAt: Date.now(),
    widgets: [
      { id: "projects", title: "Aktivni projekti", visible: true, width: "quarter", order: 0 },
      { id: "documents", title: "Dokumenti", visible: true, width: "quarter", order: 1 },
      { id: "deliveries", title: "Današnje isporuke", visible: true, width: "quarter", order: 2 },
      { id: "materials", title: "Artikli sa niskim zalihama", visible: true, width: "quarter", order: 3 },
      { id: "delivery-trends", title: "Trendovi isporuke", visible: true, width: "half", order: 4 },
      { id: "material-consumption", title: "Potrošnja materijala", visible: true, width: "half", order: 5 },
      { id: "quick-actions", title: "Brze akcije", visible: false, width: "half", order: 6 },
    ],
  },
  supervisor: {
    name: "Supervisor",
    isDefault: false,
    createdAt: Date.now(),
    widgets: [
      { id: "deliveries", title: "Dagens isporuke", visible: true, width: "half", order: 0 },
      { id: "materials", title: "Artikli sa niskim zalihama", visible: true, width: "half", order: 1 },
      { id: "stats-tests", title: "Testovi na čekanju", visible: true, width: "third", order: 2 },
      { id: "quick-actions", title: "Brze akcije", visible: true, width: "third", order: 3 },
      { id: "system-overview", title: "Pregled sistema", visible: true, width: "third", order: 4 },
      { id: "delivery-trends", title: "Trendovi isporuke", visible: true, width: "half", order: 5 },
    ],
  },
  worker: {
    name: "Worker",
    isDefault: false,
    createdAt: Date.now(),
    widgets: [
      { id: "quick-actions", title: "Brze akcije", visible: true, width: "full", order: 0 },
      { id: "deliveries", title: "Dagens isporuke", visible: true, width: "half", order: 1 },
      { id: "materials", title: "Artikli sa niskim zalihama", visible: true, width: "half", order: 2 },
      { id: "stats-tests", title: "Testovi na čekanju", visible: true, width: "half", order: 3 },
    ],
  },
};

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [isLoading, setIsLoading] = useState(true);
  const [layouts, setLayouts] = useState<Record<string, DashboardLayout>>(PRESET_LAYOUTS);

  // Load widgets from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
      
      if (saved) {
        setWidgets(JSON.parse(saved));
      }
      if (savedLayouts) {
        setLayouts(JSON.parse(savedLayouts));
      }
    } catch (error) {
      console.error("Failed to load dashboard configuration:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
      } catch (error) {
        console.error("Failed to save dashboard configuration:", error);
      }
    }
  }, [widgets, isLoading]);

  const updateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  };

  const toggleWidgetVisibility = (id: string) => {
    updateWidget(id, { visible: !widgets.find((w) => w.id === id)?.visible });
  };

  const reorderWidgets = (newWidgets: WidgetConfig[]) => {
    const reordered = newWidgets.map((w, idx) => ({ ...w, order: idx }));
    setWidgets(reordered);
  };

  const resetToDefault = () => {
    setWidgets(DEFAULT_WIDGETS);
  };

  const applyLayout = (layoutKey: string) => {
    const layout = layouts[layoutKey];
    if (layout) {
      setWidgets(layout.widgets);
    }
  };

  const saveCurrentLayout = (name: string) => {
    const newLayout: DashboardLayout = {
      name,
      widgets,
      createdAt: Date.now(),
    };
    const newLayouts = { ...layouts, [name.toLowerCase()]: newLayout };
    setLayouts(newLayouts);
    try {
      localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(newLayouts));
    } catch (error) {
      console.error("Failed to save layout:", error);
    }
  };

  const deleteLayout = (layoutKey: string) => {
    const newLayouts = { ...layouts };
    delete newLayouts[layoutKey];
    setLayouts(newLayouts);
    try {
      localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(newLayouts));
    } catch (error) {
      console.error("Failed to delete layout:", error);
    }
  };

  const getVisibleWidgets = () => {
    return widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order);
  };

  return {
    widgets,
    visibleWidgets: getVisibleWidgets(),
    isLoading,
    layouts,
    updateWidget,
    toggleWidgetVisibility,
    reorderWidgets,
    resetToDefault,
    applyLayout,
    saveCurrentLayout,
    deleteLayout,
  };
}
