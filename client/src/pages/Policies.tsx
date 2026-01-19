import { useState } from "react";
import { Layout } from "@/components/Layout";
import { usePolicies, useCreatePolicy, useUpdatePolicy, useDeletePolicy } from "@/hooks/use-policies";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  FileText, 
  AlertCircle,
  Calendar,
  Loader2,
  Trash2,
  Edit2,
  CheckCircle,
  Shield,
  Clock,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, differenceInDays } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPolicySchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Use the API input schema which already excludes tenantId
const formSchema = api.policies.create.input;

type PolicyFormValues = z.infer<typeof formSchema>;

export default function Policies() {
  const [search, setSearch] = useState("");
  const [policyTypeFilter, setPolicyTypeFilter] = useState("all");
  const [beneficiaryTypeFilter, setBeneficiaryTypeFilter] = useState("all");
  const { data: allPolicies, isLoading } = usePolicies();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);

  // Client-side filtering
  const policies = allPolicies?.filter(policy => {
    // Text search filter
    const matchesSearch = !search || (
      policy.policyName?.toLowerCase().includes(search.toLowerCase()) ||
      policy.policyNumber?.toLowerCase().includes(search.toLowerCase()) ||
      policy.provider?.toLowerCase().includes(search.toLowerCase()) ||
      policy.nominee?.toLowerCase().includes(search.toLowerCase()) ||
      policy.paidTo?.toLowerCase().includes(search.toLowerCase()) ||
      policy.country?.toLowerCase().includes(search.toLowerCase())
    );

    // Policy type filter
    const matchesPolicyType = policyTypeFilter === "all" || policy.policyType === policyTypeFilter;
    
    // Beneficiary type filter
    const matchesBeneficiaryType = beneficiaryTypeFilter === "all" || policy.beneficiaryType === beneficiaryTypeFilter;

    return matchesSearch && matchesPolicyType && matchesBeneficiaryType;
  });

  // Calculate stats from policies
  const stats = {
    total: policies?.length || 0,
    // Active: policies that are not matured (no maturity date OR maturity date is in the future)
    active: policies?.filter(p => !p.maturityDate || differenceInDays(parseISO(p.maturityDate), new Date()) >= 0).length || 0,
    renewals: policies?.filter(p => p.nextRenewalDate && differenceInDays(parseISO(p.nextRenewalDate), new Date()) <= 30 && differenceInDays(parseISO(p.nextRenewalDate), new Date()) > 0).length || 0,
    matured: policies?.filter(p => p.maturityDate && differenceInDays(parseISO(p.maturityDate), new Date()) < 0).length || 0,
  };

  const overviewCards = [
    {
      title: "Total Policies",
      value: stats.total,
      icon: Shield,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Active",
      value: stats.active,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Renewals Due",
      value: stats.renewals,
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Matured",
      value: stats.matured,
      icon: AlertTriangle,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Insurance Policies</h1>
            <p className="text-muted-foreground mt-1">Manage and track your insurance coverage.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-lg shadow-primary/20 border-0" data-testid="button-add-policy">
            <Plus className="w-4 h-4" />
            Add Policy
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {overviewCards.map((card) => (
            <Card key={card.title} className="shadow-soft border-0 bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display tracking-tight">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-card p-4 rounded-xl shadow-soft border-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search policies..." 
              className="pl-9 bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={policyTypeFilter} onValueChange={setPolicyTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Policy Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Life">Life</SelectItem>
                <SelectItem value="Vehicle">Vehicle</SelectItem>
                <SelectItem value="Property">Property</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
              </SelectContent>
            </Select>

            <Select value={beneficiaryTypeFilter} onValueChange={setBeneficiaryTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Beneficiary" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Beneficiaries</SelectItem>
                <SelectItem value="SINGLE">Single</SelectItem>
                <SelectItem value="FAMILY">Family</SelectItem>
                <SelectItem value="PARENTS">Parents</SelectItem>
                <SelectItem value="SPOUSE">Spouse</SelectItem>
                <SelectItem value="CHILDREN">Children</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            {(search || policyTypeFilter !== "all" || beneficiaryTypeFilter !== "all") && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSearch("");
                  setPolicyTypeFilter("all");
                  setBeneficiaryTypeFilter("all");
                }}
                className="px-3"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : policies?.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No policies yet</h3>
            <p className="text-muted-foreground mb-6">Start by adding your first insurance policy.</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="border-0">
              Add Policy
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-soft border-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">Policy Details</TableHead>
                  <TableHead className="font-semibold">Type & Provider</TableHead>
                  <TableHead className="font-semibold">Premium</TableHead>
                  <TableHead className="font-semibold">Dates</TableHead>
                  <TableHead className="font-semibold">Beneficiary</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies?.map((policy) => (
                  <PolicyTableRow 
                    key={policy.id} 
                    policy={policy} 
                    onEdit={() => setEditingPolicy(policy)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <PolicyDialog 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen} 
        />
        
        {editingPolicy && (
          <PolicyDialog 
            open={!!editingPolicy} 
            onOpenChange={(open) => !open && setEditingPolicy(null)}
            policy={editingPolicy}
          />
        )}
      </div>
    </Layout>
  );
}

function PolicyTableRow({ policy, onEdit }: { policy: any, onEdit: () => void }) {
  const deleteMutation = useDeletePolicy();
  const daysToMaturity = policy.maturityDate ? differenceInDays(parseISO(policy.maturityDate), new Date()) : null;
  
  let statusColor = "bg-green-500/10 text-green-700 border-green-200";
  let statusText = "Active";

  if (daysToMaturity !== null) {
    if (daysToMaturity < 0) {
      statusColor = "bg-red-500/10 text-red-700 border-red-200";
      statusText = "Matured";
    } else if (daysToMaturity <= 30) {
      statusColor = "bg-red-500/10 text-red-700 border-red-200";
      statusText = `Maturing in ${daysToMaturity} days`;
    } else if (daysToMaturity <= 60) {
      statusColor = "bg-orange-500/10 text-orange-700 border-orange-200";
      statusText = `Maturing in ${daysToMaturity} days`;
    }
  }

  return (
    <TableRow className="group hover:bg-muted/30 transition-colors">
      {/* Policy Details */}
      <TableCell className="py-4">
        <div className="space-y-1">
          <div className="font-semibold text-sm">{policy.policyName}</div>
          {policy.policyNumber && (
            <div className="text-xs text-muted-foreground">#{policy.policyNumber}</div>
          )}
          {policy.documentUrl && (
            <a 
              href={policy.documentUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-primary hover:underline"
            >
              <FileText className="w-3 h-3 mr-1" />
              Document
            </a>
          )}
        </div>
      </TableCell>

      {/* Type & Provider */}
      <TableCell className="py-4">
        <div className="space-y-1">
          <Badge variant="outline" className="text-xs">{policy.policyType}</Badge>
          <div className="text-sm text-muted-foreground">{policy.provider}</div>
        </div>
      </TableCell>

      {/* Premium */}
      <TableCell className="py-4">
        {policy.premium ? (
          <div className="space-y-1">
            <div className="font-semibold text-sm">
              {policy.premiumCurrency === 'INR' ? '₹' : ''}{Number(policy.premium).toLocaleString()}{policy.premiumCurrency === 'SEK' ? ' kr' : ''}
            </div>
            {policy.premiumFrequency && (
              <div className="text-xs text-muted-foreground">/{policy.premiumFrequency}</div>
            )}
            <div className="text-xs text-muted-foreground">{policy.country}</div>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-muted-foreground text-sm">—</span>
            <div className="text-xs text-muted-foreground">{policy.country}</div>
          </div>
        )}
      </TableCell>

      {/* Dates */}
      <TableCell className="py-4">
        <div className="space-y-1 text-xs">
          {policy.startDate && (
            <div><span className="text-muted-foreground">Start:</span> {format(parseISO(policy.startDate), "MMM d, yyyy")}</div>
          )}
          {policy.nextRenewalDate && (
            <div><span className="text-muted-foreground">Renewal:</span> {format(parseISO(policy.nextRenewalDate), "MMM d, yyyy")}</div>
          )}
          {policy.maturityDate && (
            <div><span className="text-muted-foreground">Maturity:</span> {format(parseISO(policy.maturityDate), "MMM d, yyyy")}</div>
          )}
        </div>
      </TableCell>

      {/* Beneficiary */}
      <TableCell className="py-4">
        <div className="space-y-1">
          {policy.paidTo && (
            <div className="text-sm">Paid to: {policy.paidTo}</div>
          )}
          {policy.nominee && (
            <div className="text-sm">Nominee: {policy.nominee}</div>
          )}
          <div className="flex items-center gap-2">
            {policy.beneficiaryType && (
              <Badge variant="secondary" className="text-xs">
                {policy.beneficiaryType}
              </Badge>
            )}
          </div>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell className="py-4">
        <Badge variant="outline" className={`${statusColor} text-xs`}>
          {daysToMaturity !== null && daysToMaturity <= 60 && <AlertCircle className="w-3 h-3 mr-1" />}
          {statusText}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                if (confirm("Are you sure you want to delete this policy?")) {
                  deleteMutation.mutate(policy.id);
                }
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function PolicyDialog({ open, onOpenChange, policy }: { open: boolean, onOpenChange: (open: boolean) => void, policy?: any }) {
  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();
  const { toast } = useToast();
  
  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit", // Only validate when form is submitted
    defaultValues: policy ? {
      provider: policy.provider || "",
      policyName: policy.policyName || "",
      policyNumber: policy.policyNumber || "",
      policyType: policy.policyType || "Health",
      country: policy.country || "SE",
      startDate: policy.startDate || format(new Date(), "yyyy-MM-dd"),
      maturityDate: policy.maturityDate || "",
      nextRenewalDate: policy.nextRenewalDate || "",
      lastPremiumDate: policy.lastPremiumDate || "",
      premium: policy.premium || "",
      premiumCurrency: policy.premiumCurrency || "SEK",
      premiumFrequency: policy.premiumFrequency || "yearly",
      nominee: policy.nominee || "",
      beneficiaryType: policy.beneficiaryType || "SINGLE",
      paidTo: policy.paidTo || "",
      notes: policy.notes || "",
    } : {
      provider: "",
      policyName: "",
      policyNumber: "",
      policyType: "Health",
      country: "SE",
      startDate: format(new Date(), "yyyy-MM-dd"),
      maturityDate: "",
      nextRenewalDate: "",
      lastPremiumDate: "",
      premium: "",
      premiumCurrency: "SEK",
      premiumFrequency: "yearly",
      nominee: "",
      beneficiaryType: "SINGLE",
      paidTo: "",
      notes: "",
      // Note: tenantId is not included - it's handled server-side
    }
  });

  // Handle document upload
  const [documentPath, setDocumentPath] = useState<string | null>(policy?.documentUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onSubmit = (data: PolicyFormValues) => {
    console.log("Raw form data:", data);
    
    // Clean up empty date fields before processing
    const cleanedData = {
      ...data,
      maturityDate: data.maturityDate?.trim() === '' ? undefined : data.maturityDate,
      nextRenewalDate: data.nextRenewalDate?.trim() === '' ? undefined : data.nextRenewalDate,
      lastPremiumDate: data.lastPremiumDate?.trim() === '' ? undefined : data.lastPremiumDate,
      policyNumber: data.policyNumber?.trim() === '' ? undefined : data.policyNumber,
      premium: data.premium?.trim() === '' ? undefined : data.premium,
      nominee: data.nominee?.trim() === '' ? undefined : data.nominee,
      paidTo: data.paidTo?.trim() === '' ? undefined : data.paidTo,
      notes: data.notes?.trim() === '' ? undefined : data.notes,
    };
    
    console.log("Cleaned form data:", cleanedData);
    console.log("Selected file:", selectedFile);
    
    if (selectedFile) {
      console.log("Creating FormData with file");
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(cleanedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value.toString());
        }
      });
      
      // Add file
      formData.append('document', selectedFile);
      
      if (policy) {
        updateMutation.mutate({ id: policy.id, formData }, {
          onSuccess: () => {
            form.reset();
            setSelectedFile(null);
            setDocumentPath(null);
            onOpenChange(false);
          },
          onError: (error) => {
            console.error("Update error:", error);
          }
        });
      } else {
        createMutation.mutate(formData, {
          onSuccess: () => {
            form.reset();
            setSelectedFile(null);
            setDocumentPath(null);
            onOpenChange(false);
          },
          onError: (error) => {
            console.error("Create error:", error);
          }
        });
      }
    } else {
      console.log("Creating JSON data without file");
      // No file, send as JSON - use cleaned data
      const submissionData: CreatePolicyRequest = {
        provider: cleanedData.provider,
        policyName: cleanedData.policyName,
        policyNumber: cleanedData.policyNumber,
        policyType: cleanedData.policyType,
        country: cleanedData.country,
        startDate: cleanedData.startDate,
        maturityDate: cleanedData.maturityDate,
        nextRenewalDate: cleanedData.nextRenewalDate,
        lastPremiumDate: cleanedData.lastPremiumDate,
        premium: cleanedData.premium,
        premiumCurrency: cleanedData.premiumCurrency || "SEK",
        premiumFrequency: cleanedData.premiumFrequency || "yearly",
        nominee: cleanedData.nominee,
        beneficiaryType: cleanedData.beneficiaryType || "SINGLE",
        paidTo: cleanedData.paidTo,
        notes: cleanedData.notes,
        documentUrl: policy?.documentUrl, // Keep existing document URL for updates
      };

      // Remove undefined values to avoid validation issues
      const finalData = Object.entries(submissionData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key as keyof CreatePolicyRequest] = value;
        }
        return acc;
      }, {} as Partial<CreatePolicyRequest>);
      
      console.log("Final data to submit:", finalData);
      
      if (policy) {
        updateMutation.mutate({ id: policy.id, ...finalData }, {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
          onError: (error) => {
            console.error("Update error:", error);
          }
        });
      } else {
        createMutation.mutate(finalData as CreatePolicyRequest, {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
          onError: (error) => {
            console.error("Create error:", error);
          }
        });
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{policy ? "Edit Policy" : "Add New Policy"}</DialogTitle>
        </DialogHeader>

        <form 
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log("Form validation errors:", errors);
            const errorMessages = Object.entries(errors)
              .map(([field, error]) => `${field}: ${error?.message}`)
              .join(', ');
            toast({
              title: "Validation Error", 
              description: errorMessages || "Please check the form fields and try again.",
              variant: "destructive"
            });
          })}
          className="space-y-4 py-4"
        >
          <div className="space-y-2">
            <Label htmlFor="policyName">Policy Name</Label>
            <Input id="policyName" placeholder="e.g. Family Health Plan" {...form.register("policyName")} />
            {form.formState.errors.policyName && (
              <p className="text-red-500 text-xs">{form.formState.errors.policyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="policyNumber">Policy Number</Label>
            <Input id="policyNumber" placeholder="e.g. POL-123456789" {...form.register("policyNumber")} />
            {form.formState.errors.policyNumber && (
              <p className="text-red-500 text-xs">{form.formState.errors.policyNumber.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input id="provider" placeholder="e.g. Allianz" {...form.register("provider")} />
              {form.formState.errors.provider && (
                <p className="text-red-500 text-xs">{form.formState.errors.provider.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="policyType">Type</Label>
              <Select 
                onValueChange={(val) => form.setValue("policyType", val)} 
                defaultValue={form.getValues("policyType")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Life">Life</SelectItem>
                  <SelectItem value="Vehicle">Vehicle</SelectItem>
                  <SelectItem value="Property">Property</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Premium Information */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="premium">Premium Amount</Label>
              <Input id="premium" type="number" placeholder="10000" {...form.register("premium")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="premiumCurrency">Currency</Label>
              <Select 
                onValueChange={(val) => form.setValue("premiumCurrency", val)} 
                defaultValue={form.getValues("premiumCurrency") || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEK">SEK (kr)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="premiumFrequency">Frequency</Label>
              <Select 
                onValueChange={(val) => form.setValue("premiumFrequency", val)} 
                defaultValue={form.getValues("premiumFrequency") || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="half-yearly">Half-yearly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Beneficiary Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nominee">Nominee</Label>
              <Input id="nominee" placeholder="e.g. John Doe" {...form.register("nominee")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiaryType">Beneficiary Type</Label>
              <Select 
                onValueChange={(val) => form.setValue("beneficiaryType", val)} 
                defaultValue={form.getValues("beneficiaryType") || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select beneficiary type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="FAMILY">Family</SelectItem>
                  <SelectItem value="PARENTS">Parents</SelectItem>
                  <SelectItem value="SPOUSE">Spouse</SelectItem>
                  <SelectItem value="CHILDREN">Children</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidTo">Paid To</Label>
            <Input id="paidTo" placeholder="e.g. Policy holder, Nominee, Bank account details" {...form.register("paidTo")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input type="date" id="startDate" {...form.register("startDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maturityDate">Maturity Date <span className="text-gray-500 font-normal">(optional)</span></Label>
              <Input type="date" id="maturityDate" {...form.register("maturityDate")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextRenewalDate">Next Renewal Date</Label>
              <Input 
                type="date" 
                id="nextRenewalDate" 
                {...form.register("nextRenewalDate")}
                placeholder=""
              />
              {form.formState.errors.nextRenewalDate && (
                <p className="text-red-500 text-xs">{form.formState.errors.nextRenewalDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastPremiumDate">Last Premium Date</Label>
              <Input 
                type="date" 
                id="lastPremiumDate" 
                {...form.register("lastPremiumDate")}
                placeholder=""
              />
              {form.formState.errors.lastPremiumDate && (
                <p className="text-red-500 text-xs">{form.formState.errors.lastPremiumDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select 
              onValueChange={(val) => form.setValue("country", val)}
              defaultValue={form.getValues("country")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SE">Sweden</SelectItem>
                <SelectItem value="IN">India</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Document Upload</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>
                    <span className="text-sm text-gray-500"> or drag and drop</span>
                  </label>
                  <input
                    id="document-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        setDocumentPath(file.name);
                        toast({ title: "Document selected", description: file.name });
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
                {documentPath && (
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 py-2 px-3 rounded-md">
                    <FileText className="w-4 h-4" />
                    <span>Selected: {documentPath}</span>
                  </div>
                )}
              </div>
            </div>
            {policy?.documentUrl && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>Current document attached</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" placeholder="Optional notes" {...form.register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={isPending} 
              className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 border-0"
              onClick={() => {
                // Debug: Log form state when button is clicked
                console.log("Form state:", form.formState);
                console.log("Form values:", form.getValues());
                console.log("Form errors:", form.formState.errors);
              }}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {policy ? "Update Policy" : "Create Policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
