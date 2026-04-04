import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/GlassCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FolderPlus, Folder } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function Projects() {
  const [createOpen, setCreateOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();

  const createMutation = trpc.projects.create.useMutation({
    onMutate: async (newProject) => {
      await utils.projects.list.cancel();
      const previousProjects = utils.projects.list.getData();

      utils.projects.list.setData(undefined, (old) => {
        if (!old) return [];
        return [
          {
            id: Math.random(),
            name: newProject.name,
            description: newProject.description || null,
            location: newProject.location || null,
            status: newProject.status || "planning",
            createdAt: new Date().toISOString(),
          } as any,
          ...old,
        ];
      });

      return { previousProjects };
    },
    onSuccess: () => {
      toast.success("Project created successfully");
      setCreateOpen(false);
    },
    onError: (error, variables, context) => {
      toast.error(`Failed to create project: ${error.message}`);
      if (context?.previousProjects) {
        utils.projects.list.setData(undefined, context.previousProjects);
      }
    },
    onSettled: () => {
      utils.projects.list.invalidate();
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createMutation.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      status: formData.get("status") as any,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "on_hold":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
            <p className="text-white/70">Manage construction projects</p>
          </div>
          <GlassDialog open={createOpen} onOpenChange={setCreateOpen}>
            <GlassDialogTrigger asChild>
              <Button size="lg">
                <FolderPlus className="mr-2 h-5 w-5" />
                New Project
              </Button>
            </GlassDialogTrigger>
            <GlassDialogContent className="sm:max-w-[425px]">
              <GlassDialogHeader>
                <GlassDialogTitle>Create New Project</GlassDialogTitle>
                <GlassDialogDescription>Add a new construction project</GlassDialogDescription>
              </GlassDialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="planning">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </GlassDialogContent>
          </GlassDialog>
        </div>

        <GlassCard variant="dark">
          <GlassCardHeader className="border-b border-white/5 bg-white/5">
            <GlassCardTitle>All Projects</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : projects && projects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card key={project.id} className="bg-white/5 hover:bg-white/10 border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Folder className="h-8 w-8 text-primary" />
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {project.status}
                        </span>
                      </div>
                      <CardTitle className="mt-4">{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {project.description || "No description"}
                      </p>
                      {project.location && (
                        <p className="text-xs text-muted-foreground">
                          📍 {project.location}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No projects found. Create your first project to get started.
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
