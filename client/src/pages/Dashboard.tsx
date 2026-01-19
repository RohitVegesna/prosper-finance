import { useDashboardStats, useDashboardAnalytics } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Shield, AlertTriangle, TrendingUp, Loader2, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();

  if (statsLoading || analyticsLoading) {
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

        {/* Enhanced Analytics Section */}
        <div>
          <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Financial Analytics
          </h2>
          
          {/* Debug: Force production rebuild */}
          
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Investment Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Investment Distribution by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.investmentsByType && analytics.investmentsByType.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.investmentsByType.map((item, index) => (
                        <div key={`${item.type}-${index}`} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                            <span className="text-sm font-medium">{item.type}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">kr {item.value.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{item.count} investment{item.count !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <div className="text-sm">No investment type data</div>
                        <div className="text-xs mt-1">Add investments to see breakdown</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Investment Platforms */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Investment Platforms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.investmentsByPlatform && analytics.investmentsByPlatform.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.investmentsByPlatform.map((item, index) => (
                        <div key={`${item.platform}-${index}`} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium">{item.platform}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">kr {item.value.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{item.count} investment{item.count !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <div className="text-sm">No platform data available</div>
                        <div className="text-xs mt-1">Add investments to see platforms</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium Costs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Premium Costs by Provider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.premiumsByProvider && analytics.premiumsByProvider.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.premiumsByProvider.map((item, index) => {
                        // Handle production data format (no currency field) and development format (with currency)
                        const currency = item.currency || 'SEK';
                        const currencySymbol = currency === 'INR' ? '₹' : 
                                             currency === 'SEK' ? 'kr' : 
                                             currency === 'USD' ? '$' : 
                                             currency === 'EUR' ? '€' : 'kr'; // Default to kr
                        
                        // Format the yearly amount - handle both with/without currency
                        const yearlyAmount = `${currencySymbol}${item.yearlyPremium.toLocaleString()}`;
                        
                        return (
                          <div key={`${item.provider}-${index}`} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                              <span className="text-sm font-medium">{item.provider}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold">{yearlyAmount}/year</div>
                              <div className="text-xs text-muted-foreground">{item.policyCount} polic{item.policyCount !== 1 ? 'ies' : 'y'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <div className="text-sm">No premium data available</div>
                        <div className="text-xs mt-1">Add policies to see premium breakdown</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Renewals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Upcoming Renewals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.upcomingRenewals && analytics.upcomingRenewals.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.upcomingRenewals.filter(item => item.count > 0).map((item, index) => (
                        <div key={item.date} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="text-sm font-medium">{item.date}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{item.count} renewal{item.count !== 1 ? 's' : ''}</div>
                            <div className="text-xs text-muted-foreground">{item.totalPremium.toLocaleString()} kr</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      No upcoming renewals
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
