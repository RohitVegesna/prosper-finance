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
  TrendingDown,
  MoreVertical, 
  Loader2, 
  Edit2, 
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Minus
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

  // Calculate portfolio metrics by currency
  const portfolioMetrics = {
    SEK: {
      investments: investments?.filter(i => i.currency === 'SEK') || [],
      totalInitial: 0,
      totalCurrent: 0,
      totalGainLoss: 0,
      percentChange: 0
    },
    INR: {
      investments: investments?.filter(i => i.currency === 'INR') || [],
      totalInitial: 0,
      totalCurrent: 0,
      totalGainLoss: 0,
      percentChange: 0
    }
  };

  // Calculate metrics for each currency
  Object.keys(portfolioMetrics).forEach(currency => {
    const currencyInvestments = portfolioMetrics[currency as keyof typeof portfolioMetrics].investments;
    
    const totalInitial = currencyInvestments.reduce((acc, inv) => acc + Number(inv.initialAmount), 0);
    const totalCurrent = currencyInvestments.reduce((acc, inv) => acc + Number(inv.currentValue), 0);
    const totalGainLoss = totalCurrent - totalInitial;
    const percentChange = totalInitial > 0 ? (totalGainLoss / totalInitial) * 100 : 0;
    
    portfolioMetrics[currency as keyof typeof portfolioMetrics] = {
      ...portfolioMetrics[currency as keyof typeof portfolioMetrics],
      totalInitial,
      totalCurrent,
      totalGainLoss,
      percentChange
    };
  });

  // Filter investments by selected currency
  const filteredInvestments = selectedCurrency === 'all' 
    ? investments 
    : investments?.filter(i => i.currency === selectedCurrency);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Investment Portfolio</h1>
            <p className="text-muted-foreground mt-1">Track your investment performance and gains.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-lg shadow-primary/20 border-0" data-testid="button-add-investment">
            <Plus className="w-4 h-4" />
            Add Investment
          </Button>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* SEK Portfolio */}
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <p className="text-blue-200 font-medium mb-2 flex items-center gap-3">
                <span className="text-3xl">🇸🇪</span> 
                <div>
                  <div className="text-sm font-semibold">Sweden</div>
                  <div className="text-xs opacity-75">Investment Portfolio</div>
                </div>
              </p>
              <div className="space-y-3">
                <div>
                  <div className="text-3xl font-display font-bold">
                    {portfolioMetrics.SEK.totalCurrent.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                  </div>
                  <div className="text-sm text-blue-200 opacity-80">
                    Initial: {portfolioMetrics.SEK.totalInitial.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {portfolioMetrics.SEK.totalGainLoss >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-300" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-300" />
                  )}
                  <span className={`font-semibold ${portfolioMetrics.SEK.totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {portfolioMetrics.SEK.totalGainLoss >= 0 ? '+' : ''}{portfolioMetrics.SEK.totalGainLoss.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                  </span>
                  <span className={`text-sm ${portfolioMetrics.SEK.totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    ({portfolioMetrics.SEK.percentChange >= 0 ? '+' : ''}{portfolioMetrics.SEK.percentChange.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* INR Portfolio */}
          <div className="bg-gradient-to-br from-orange-900 via-orange-800 to-orange-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <p className="text-orange-200 font-medium mb-2 flex items-center gap-3">
                <span className="text-3xl">🇮🇳</span>
                <div>
                  <div className="text-sm font-semibold">India</div>
                  <div className="text-xs opacity-75">Investment Portfolio</div>
                </div>
              </p>
              <div className="space-y-3">
                <div>
                  <div className="text-3xl font-display font-bold">
                    ₹{portfolioMetrics.INR.totalCurrent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-orange-200 opacity-80">
                    Initial: ₹{portfolioMetrics.INR.totalInitial.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {portfolioMetrics.INR.totalGainLoss >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-300" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-300" />
                  )}
                  <span className={`font-semibold ${portfolioMetrics.INR.totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {portfolioMetrics.INR.totalGainLoss >= 0 ? '+' : ''}₹{Math.abs(portfolioMetrics.INR.totalGainLoss).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`text-sm ${portfolioMetrics.INR.totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    ({portfolioMetrics.INR.percentChange >= 0 ? '+' : ''}{portfolioMetrics.INR.percentChange.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Currency Filter */}
        <div className="flex items-center gap-4 bg-card p-4 rounded-xl shadow-soft border-0">
          <Label className="text-muted-foreground whitespace-nowrap">Filter by Currency:</Label>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-[200px]" data-testid="select-currency-filter">
              <SelectValue placeholder="All currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              <SelectItem value="SEK">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🇸🇪</span>
                  <div>
                    <div className="font-medium">Sweden</div>
                    <div className="text-xs text-muted-foreground">Swedish Krona</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="INR">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🇮🇳</span>
                  <div>
                    <div className="font-medium">India</div>
                    <div className="text-xs text-muted-foreground">Indian Rupee</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
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
            <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="border-0">
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
  
  const initialAmount = Number(investment.initialAmount);
  const currentValue = Number(investment.currentValue);
  const gainLoss = currentValue - initialAmount;
  const percentChange = initialAmount > 0 ? (gainLoss / initialAmount) * 100 : 0;
  const isGain = gainLoss >= 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/60 group relative overflow-hidden">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
              isGain ? 'bg-green-500' : gainLoss === 0 ? 'bg-gray-500' : 'bg-red-500'
            }`}>
              {isGain ? <TrendingUp className="w-5 h-5" /> : gainLoss === 0 ? <Minus className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold font-display">{investment.platform}</h3>
              <p className="text-sm text-muted-foreground">{investment.type}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 ml-auto">
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
              investment.country === 'SWEDEN' || investment.country === 'SE'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                : 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
            }`}>
              <span className="text-base mr-1">
                {(investment.country === 'SWEDEN' || investment.country === 'SE') ? '🇸🇪' : '🇮🇳'}
              </span>
              {(investment.country === 'SWEDEN' || investment.country === 'SE') ? 'Sweden' : 'India'}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this investment?")) {
                      deleteMutation.mutate(investment.id);
                    }
                  }}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Values */}
        <div className="space-y-3">
          {/* Current Value */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Value</p>
            <div className="text-2xl font-bold font-display">
              {investment.currency === 'INR' ? '₹' : ''}{currentValue.toLocaleString(investment.currency === 'INR' ? 'en-IN' : 'sv-SE', { minimumFractionDigits: 2 })} {investment.currency === 'SEK' ? 'kr' : ''}
            </div>
          </div>
          
          {/* Initial Investment */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Initial Investment</p>
            <div className="text-sm text-muted-foreground">
              {investment.currency === 'INR' ? '₹' : ''}{initialAmount.toLocaleString(investment.currency === 'INR' ? 'en-IN' : 'sv-SE', { minimumFractionDigits: 2 })} {investment.currency === 'SEK' ? 'kr' : ''}
            </div>
          </div>
          
          {/* Gain/Loss */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isGain ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : gainLoss === 0 ? (
                  <Minus className="w-4 h-4 text-gray-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span className={`font-semibold ${
                  isGain ? 'text-green-600' : gainLoss === 0 ? 'text-gray-600' : 'text-red-600'
                }`}>
                  {isGain ? '+' : ''}{investment.currency === 'INR' ? '₹' : ''}{Math.abs(gainLoss).toLocaleString(investment.currency === 'INR' ? 'en-IN' : 'sv-SE', { minimumFractionDigits: 2 })} {investment.currency === 'SEK' ? 'kr' : ''}
                </span>
              </div>
              <span className={`text-sm font-medium ${
                isGain ? 'text-green-600' : gainLoss === 0 ? 'text-gray-600' : 'text-red-600'
              }`}>
                ({isGain ? '+' : ''}{percentChange.toFixed(2)}%)
              </span>
            </div>
          </div>
          
          {/* Purchase Date & Last Updated */}
          <div className="flex justify-between text-xs text-muted-foreground">
            {investment.purchaseDate && (
              <span>Purchased: {new Date(investment.purchaseDate).toLocaleDateString()}</span>
            )}
            {investment.lastUpdated && (
              <span>Updated: {new Date(investment.lastUpdated).toLocaleDateString()}</span>
            )}
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
    defaultValues: investment ? {
      type: investment.type || "Stocks",
      platform: investment.platform || "",
      country: investment.country || "SWEDEN",
      currency: investment.currency || "SEK",
      initialAmount: investment.initialAmount?.toString() || "0",
      currentValue: investment.currentValue?.toString() || "0",
      shares: investment.shares?.toString() || "",
      purchaseDate: investment.purchaseDate || "",
      tenantId: investment.tenantId || "1",
    } : {
      type: "Stocks",
      platform: "",
      country: "SWEDEN",
      currency: "SEK",
      initialAmount: "0",
      currentValue: "0",
      shares: "",
      purchaseDate: "",
      tenantId: "1", // TODO: Get from auth context
    }
  });

  const onSubmit = (data: InvestmentFormValues) => {
    // Convert empty strings to proper values for numeric fields
    const processedData = {
      ...data,
      initialAmount: data.initialAmount || "0",
      currentValue: data.currentValue || "0",
      shares: data.shares && data.shares.toString().trim() !== "" ? data.shares : undefined,
      purchaseDate: data.purchaseDate && data.purchaseDate.toString().trim() !== "" ? data.purchaseDate : undefined
    };
    
    if (investment) {
      updateMutation.mutate({ id: investment.id, ...processedData }, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        }
      });
    } else {
      createMutation.mutate(processedData, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        }
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
            {investment ? "Edit Investment" : "Add New Investment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Platform & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform/Broker</Label>
              <Input id="platform" placeholder="e.g. Robinhood, Zerodha" {...form.register("platform")} />
              {form.formState.errors.platform && <p className="text-red-500 text-xs">{form.formState.errors.platform.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Investment Type</Label>
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
                  <SelectItem value="Crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Bonds">Bonds</SelectItem>
                  <SelectItem value="Commodities">Commodities</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Currency & Country */}
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
                  <SelectItem value="SEK">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🇸🇪</span>
                      <div>
                        <div className="font-medium">Sweden</div>
                        <div className="text-xs text-muted-foreground">Swedish Krona</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="INR">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🇮🇳</span>
                      <div>
                        <div className="font-medium">India</div>
                        <div className="text-xs text-muted-foreground">Indian Rupee</div>
                      </div>
                    </div>
                  </SelectItem>
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
                  <SelectItem value="SWEDEN">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🇸🇪</span>
                      <span>Sweden</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="INDIA">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🇮🇳</span>
                      <span>India</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Investment Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialAmount">Initial Investment</Label>
              <Input 
                id="initialAmount" 
                type="number" 
                step="0.01" 
                placeholder="Amount invested"
                {...form.register("initialAmount")} 
              />
              {form.formState.errors.initialAmount && <p className="text-red-500 text-xs">{form.formState.errors.initialAmount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value</Label>
              <Input 
                id="currentValue" 
                type="number" 
                step="0.01" 
                placeholder="Current worth"
                {...form.register("currentValue")} 
              />
              {form.formState.errors.currentValue && <p className="text-red-500 text-xs">{form.formState.errors.currentValue.message}</p>}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shares">Shares/Units (Optional)</Label>
              <Input 
                id="shares" 
                type="number" 
                step="0.01" 
                placeholder="Number of shares"
                {...form.register("shares")} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date (Optional)</Label>
              <Input 
                id="purchaseDate" 
                type="date" 
                {...form.register("purchaseDate")} 
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 border-0">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {investment ? "Update Investment" : "Add Investment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
