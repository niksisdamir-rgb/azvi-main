import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Trash2, Edit, Users } from "lucide-react";
import { toast } from "sonner";

export default function Employees() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  
  const { data: employees, isLoading, refetch } = trpc.employees.list.useQuery(
    departmentFilter !== "all" ? { department: departmentFilter } : undefined
  );

  const createMutation = trpc.employees.create.useMutation({
    onSuccess: () => {
      toast.success("Employee added successfully");
      setIsAddDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add employee: ${error.message}`);
    },
  });

  const deleteMutation = trpc.employees.delete.useMutation({
    onSuccess: () => {
      toast.success("Employee removed successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to remove employee: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      employeeNumber: formData.get("employeeNumber") as string,
      position: formData.get("position") as string,
      department: formData.get("department") as any,
      phoneNumber: formData.get("phoneNumber") as string || undefined,
      email: formData.get("email") as string || undefined,
      hourlyRate: formData.get("hourlyRate") ? Number(formData.get("hourlyRate")) : undefined,
      status: "active",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Workforce Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage employees and track workforce
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" name="firstName" required autoComplete="given-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" name="lastName" required autoComplete="family-name" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeNumber">Employee Number *</Label>
                  <Input id="employeeNumber" name="employeeNumber" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input id="position" name="position" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select name="department" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="quality">Quality Control</SelectItem>
                    <SelectItem value="administration">Administration</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (€)</Label>
                <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Employee"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 border-l-4 border-l-primary">
        <div className="flex items-center gap-4">
          <Label>Filter by Department:</Label>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="construction">Construction</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="quality">Quality Control</SelectItem>
              <SelectItem value="administration">Administration</SelectItem>
              <SelectItem value="logistics">Logistics</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="border-l-4 border-l-primary">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Employee #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Hourly Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : !employees || employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No employees found. Add your first employee to get started.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.employeeNumber}</TableCell>
                  <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell className="capitalize">{employee.department}</TableCell>
                  <TableCell>
                    {employee.phoneNumber && <div>{employee.phoneNumber}</div>}
                    {employee.email && <div className="text-sm text-muted-foreground">{employee.email}</div>}
                  </TableCell>
                  <TableCell>
                    {employee.hourlyRate ? `€${employee.hourlyRate}` : "-"}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      employee.status === "active" ? "bg-green-500/20 text-green-700" :
                      employee.status === "on_leave" ? "bg-yellow-500/20 text-yellow-700" :
                      "bg-gray-500/20 text-gray-700"
                    }`}>
                      {employee.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to remove this employee?")) {
                          deleteMutation.mutate({ id: employee.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
