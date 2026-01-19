import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useInvestments, useCreateInvestment, useUpdateInvestment, useDeleteInvestment } from "@/hooks/use-investments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  TrendingUp, 
  MoreVertical, 
  Loader2, 
  Edit2, 
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvestmentSchema } from "@shared/schema";
import { z } from "zod";

type InvestmentFormValues = z.infer<typeof insertInvestmentSchema>;

export default function Investments() {
  const { data: investments, isLoading } = useInvestments();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("all");

  // Calculate totals by currency
  const totals = {
    SEK: investments?.filter(i => i.currency === 'SEK').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0,
    INR: investments?.filter(i => i.currency === 'INR').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0,
  };

  // Filter investments by selected currency
  const filteredInvestments = selectedCurrency === 'all' 
    ? investments 
    : investments?.filter(i => i.currency === selectedCurrency);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Investments</h1>
            <p className="text-muted-foreground mt-1">Track your portfolio performance.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-lg shadow-primary/20" data-testid="button-add-investment">
            <Plus className="w-4 h-4" />
            Add Investment
          </Button>
        </div>

        {/* Currency Filter */}
        <div className="flex items-center gap-4 bg-card p-4 rounded-xl shadow-soft border-0">
          <Label className="text-muted-foreground whitespace-nowrap">View by Currency:</Label>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-[180px]" data-testid="select-currency-filter">
              <SelectValue placeholder="All currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              <SelectItem value="SEK">SEK (Swedish Krona)</SelectItem>
              <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Portfolio Summary - Show by Currency */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-6 text-white shadow-xl">
            <p className="text-blue-300 font-medium mb-2">SEK Portfolio</p>
            <div className="text-3xl font-display font-bold">
              {totals.SEK.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-900 to-orange-800 rounded-2xl p-6 text-white shadow-xl">
            <p className="text-orange-300 font-medium mb-2">INR Portfolio</p>
            <div className="text-3xl font-display font-bold">
              ₹{totals.INR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : investments?.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No investments yet</h3>
            <p className="text-muted-foreground mb-6">Start tracking your assets today.</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline">
              Add Investment
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvestments?.map((investment) => (
              <InvestmentCard 
                key={investment.id} 
                investment={investment} 
                onEdit={() => setEditingInvestment(investment)}
              />
            ))}
          </div>
        )}

        <InvestmentDialog 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen} 
        />
        
        {editingInvestment && (
          <InvestmentDialog 
            open={!!editingInvestment} 
            onOpenChange={(open) => !open && setEditingInvestment(null)}
            investment={editingInvestment}
          />
        )}
      </div>
    </Layout>
  );
}

function InvestmentCard({ investment, onEdit }: { investment: any, onEdit: () => void }) {
  const deleteMutation = useDeleteInvestment();

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/60 group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-display">{investment.platform}</h3>
              <p className="text-xs text-muted-foreground">{investment.type}</p>
            </div>
          </div>
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
                  if (confirm("Are you sure you want to delete this investment?")) {
                    deleteMutation.mutate(investment.id);
                  }
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-1">Current Value</p>
          <div className="text-2xl font-bold font-display text-primary">
            {investment.currency === 'INR' ? '₹' : ''}{Number(investment.amount).toLocaleString(investment.currency === 'INR' ? 'en-IN' : 'sv-SE', { minimumFractionDigits: 2 })} {investment.currency === 'SEK' ? 'kr' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InvestmentDialog({ open, onOpenChange, investment }: { open: boolean, onOpenChange: (open: boolean) => void, investment?: any }) {
  const createMutation = useCreateInvestment();
  const updateMutation = useUpdateInvestment();
  
  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(insertInvestmentSchema),
    defaultValues: investment || {
      type: "Stocks",
      platform: "",
      country: "SE",
      currency: "SEK",
      amount: "0",
      tenantId: "1", // TODO: Get from auth context
    }
  });

  const onSubmit = (data: InvestmentFormValues) => {
    // Ensure amount is string for numeric field in DB, zod schema handles it
    if (investment) {
      updateMutation.mutate({ id: investment.id, ...data }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{investment ? "Edit Investment" : "Add Investment"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform/Broker</Label>
            <Input id="platform" placeholder="e.g. Robinhood, Vanguard" {...form.register("platform")} />
            {form.formState.errors.platform && <p className="text-red-500 text-xs">{form.formState.errors.platform.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select 
              onValueChange={(val) => form.setValue("type", val)} 
              defaultValue={form.getValues("type")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Stocks">Stocks</SelectItem>
                <SelectItem value="Mutual Funds">Mutual Funds</SelectItem>
                <SelectItem value="ETFs">ETFs</SelectItem>
                <SelectItem value="Crypto">Crypto</SelectItem>
                <SelectItem value="Real Estate">Real Estate</SelectItem>
                <SelectItem value="Bonds">Bonds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                onValueChange={(val) => form.setValue("currency", val)}
                defaultValue={form.getValues("currency")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEK">SEK (Swedish Krona)</SelectItem>
                  <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                </SelectContent>
              </Select>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input 
              id="amount" 
              type="number" 
              step="0.01" 
              placeholder="Enter amount"
              {...form.register("amount")} 
            />
            {form.formState.errors.amount && <p className="text-red-500 text-xs">{form.formState.errors.amount.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {investment ? "Update Investment" : "Add Investment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
