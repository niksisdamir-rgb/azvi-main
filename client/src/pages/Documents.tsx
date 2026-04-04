import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/GlassCard";
import { GlassDialog, GlassDialogContent, GlassDialogHeader, GlassDialogTitle, GlassDialogDescription, GlassDialogTrigger } from "@/components/ui/GlassDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { trpc } from "@/lib/trpc";
import { Upload, FileText, Search, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function Documents() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: documents, isLoading, refetch } = trpc.documents.list.useQuery({
    search: searchTerm || undefined,
    category: categoryFilter && categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const uploadMutation = trpc.documents.upload.useMutation({
    onMutate: async (newDoc) => {
      const queryKey = {
        search: searchTerm || undefined,
        category: categoryFilter && categoryFilter !== "all" ? categoryFilter : undefined,
      };
      await utils.documents.list.cancel(queryKey);
      const previousDocs = utils.documents.list.getData(queryKey);

      utils.documents.list.setData(queryKey, (old) => {
        if (!old) return [];
        return [
          {
            id: Math.random(),
            name: newDoc.name,
            description: newDoc.description || null,
            category: newDoc.category,
            fileUrl: "",
            fileSize: newDoc.fileSize,
            createdAt: new Date().toISOString(),
          } as any,
          ...old,
        ];
      });

      return { previousDocs, queryKey };
    },
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      setUploadOpen(false);
    },
    onError: (error, newDoc, context) => {
      toast.error(`Upload failed: ${error.message}`);
      if (context?.previousDocs) {
        utils.documents.list.setData(context.queryKey, context.previousDocs);
      }
    },
    onSettled: (data, error, variables, context) => {
      if (context?.queryKey) {
        utils.documents.list.invalidate(context.queryKey);
      }
    },
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result?.toString().split(",")[1];
      if (!base64) {
        toast.error("Failed to read file");
        return;
      }

      uploadMutation.mutate({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        fileData: base64,
        mimeType: file.type,
        fileSize: file.size,
        category: formData.get("category") as any,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Documents</h1>
            <p className="text-white/70">Manage your construction documents</p>
          </div>
          <GlassDialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <GlassDialogTrigger asChild>
              <Button size="lg">
                <Upload className="mr-2 h-5 w-5" />
                Upload Document
              </Button>
            </GlassDialogTrigger>
            <GlassDialogContent>
              <GlassDialogHeader>
                <GlassDialogTitle>Upload New Document</GlassDialogTitle>
                <GlassDialogDescription>
                  Add a new document to the system
                </GlassDialogDescription>
              </GlassDialogHeader>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="name">Document Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="blueprint">Blueprint</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    ref={fileInputRef}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </form>
            </GlassDialogContent>
          </GlassDialog>
        </div>

        <GlassCard variant="card">
          <GlassCardHeader>
            <GlassCardTitle>Search &amp; Filter</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="blueprint">Blueprint</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </GlassCardContent>
        </GlassCard>

        <GlassCard variant="card">
          <GlassCardHeader>
            <GlassCardTitle>Document List</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : documents && documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {doc.description || "No description"}
                        </p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Category: {doc.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Size: {(doc.fileSize! / 1024).toFixed(2)} KB
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No documents found. Upload your first document to get started.
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
