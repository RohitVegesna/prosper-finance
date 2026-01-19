import { useDashboardStats } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Shield, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const cards = [
    {
      id: "total-policies",
      title: "Total Policies",
      value: stats?.totalPolicies || 0,
      icon: Shield,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      description: "Insurance policies"
    },
    {
      id: "needs-attention",
      title: "Needs Attention",
      value: (stats?.needsRenewal || 0) + (stats?.expiringSoon || 0),
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      description: "Expiring within 60 days"
    },
    {
      id: "investments",
      title: "Investments",
      value: stats?.totalInvestments || 0,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
      description: "Tracked assets"
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your financial protection and growth.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="shadow-soft hover-elevate transition-all duration-300 border-0 bg-card" data-testid={`dashboard-stat-${card.id}`}>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Investment Portfolio by Currency */}
        <div>
          <h2 className="text-xl font-display font-bold mb-4">Portfolio Overview</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-6 text-white shadow-xl" data-testid="dashboard-portfolio-sek">
                <p className="text-blue-300 font-medium mb-2">SEK Portfolio</p>
                <div className="text-3xl font-display font-bold">
                  {(stats?.investmentsByCurrency?.SEK || 0).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="bg-gradient-to-r from-orange-900 to-orange-800 rounded-2xl p-6 text-white shadow-xl" data-testid="dashboard-portfolio-inr">
                <p className="text-orange-300 font-medium mb-2">INR Portfolio</p>
                <div className="text-3xl font-display font-bold">
                  ₹{(stats?.investmentsByCurrency?.INR || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
