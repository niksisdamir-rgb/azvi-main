import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  Package, 
  Truck, 
  FlaskConical, 
  FileText, 
  TrendingUp, 
  LineChart,
  Sparkles,
  Copy,
  Check,
  Upload
} from 'lucide-react';
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@shared/promptTemplates';

interface PromptTemplatesProps {
  onSelectTemplate: (prompt: string) => void;
}

const CATEGORY_ICONS: Record<TemplateCategory, any> = {
  inventory: Package,
  deliveries: Truck,
  quality: FlaskConical,
  reports: FileText,
  analysis: TrendingUp,
  forecasting: LineChart,
  bulk_import: Upload,
};

export function PromptTemplates({ onSelectTemplate }: PromptTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('inventory');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: allTemplates = [] } = trpc.ai.getTemplates.useQuery();
  const { data: categoryTemplates = [] } = trpc.ai.getTemplatesByCategory.useQuery({ 
    category: selectedCategory 
  });

  // Filter templates based on search
  const displayTemplates = searchQuery 
    ? allTemplates.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : categoryTemplates;

  const handleUseTemplate = (prompt: string) => {
    onSelectTemplate(prompt);
  };

  const handleCopyPrompt = async (id: string, prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Šabloni upita</h3>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pretraži šablone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as TemplateCategory)}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {Object.entries(TEMPLATE_CATEGORIES).map(([key, { label }]) => {
            const Icon = CATEGORY_ICONS[key as TemplateCategory];
            return (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(TEMPLATE_CATEGORIES).map((category) => (
          <TabsContent key={category} value={category} className="space-y-3 mt-4">
            {displayTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nema pronađenih šablona</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {displayTemplates.map((template) => (
                  <Card key={template.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base">{template.title}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Template Prompt Preview */}
                      <div className="bg-muted/50 rounded-md p-3 text-sm font-mono">
                        {template.prompt}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUseTemplate(template.prompt)}
                          className="flex-1"
                          size="sm"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Koristi šablon
                        </Button>
                        <Button
                          onClick={() => handleCopyPrompt(template.id, template.prompt)}
                          variant="outline"
                          size="sm"
                        >
                          {copiedId === template.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
