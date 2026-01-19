import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";

const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6", 
  accent: "#06b6d4",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  muted: "#64748b"
};

interface InvestmentsByTypeChartProps {
  data: Array<{
    type: string;
    value: number;
    count: number;
  }>;
}

export function InvestmentsByTypeChart({ data }: InvestmentsByTypeChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: Object.values(COLORS)[index % Object.values(COLORS).length]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          Investment Distribution by Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{}}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
                nameKey="type"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: any, name: any) => [
                  `${Number(value).toLocaleString()} kr`,
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {chartData.map((item, index) => (
            <div key={item.type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              ></div>
              <span className="text-muted-foreground">{item.type} ({item.count})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface PremiumsByProviderChartProps {
  data: Array<{
    provider: string;
    monthlyPremium: number;
    yearlyPremium: number;
    policyCount: number;
  }>;
}

export function PremiumsByProviderChart({ data }: PremiumsByProviderChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 bg-secondary rounded-full"></div>
          Premium Costs by Provider
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="provider" />
              <YAxis />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: any, name: any) => [
                  `${Number(value).toLocaleString()} kr`,
                  name === 'yearlyPremium' ? 'Yearly Premium' : 'Monthly Premium'
                ]}
              />
              <Bar dataKey="yearlyPremium" fill={COLORS.primary} name="Yearly Premium" />
              <Bar dataKey="monthlyPremium" fill={COLORS.secondary} name="Monthly Premium" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface UpcomingRenewalsChartProps {
  data: Array<{
    date: string;
    count: number;
    totalPremium: number;
  }>;
}

export function UpcomingRenewalsChart({ data }: UpcomingRenewalsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 bg-warning rounded-full"></div>
          Upcoming Renewals Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: any, name: any) => [
                  name === 'count' ? `${value} policies` : `${Number(value).toLocaleString()} kr`,
                  name === 'count' ? 'Policies Due' : 'Total Premium'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke={COLORS.warning} 
                strokeWidth={3}
                dot={{ fill: COLORS.warning, strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface InvestmentsByPlatformChartProps {
  data: Array<{
    platform: string;
    value: number;
    count: number;
  }>;
}

export function InvestmentsByPlatformChart({ data }: InvestmentsByPlatformChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full"></div>
          Investment Platforms
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
              <XAxis dataKey="platform" />
              <YAxis />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: any) => [`${Number(value).toLocaleString()} kr`, 'Value']}
              />
              <Bar dataKey="value" fill={COLORS.success} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {data.map((item) => (
            <div key={item.platform} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.platform}</span>
              <span className="font-medium">{item.count} investments</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}