"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import { TrendingUp } from "lucide-react"

interface SalesChartProps {
    data: { date: string; amount: number }[]
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Sales Over Time</CardTitle>
        <CardDescription>Revenue trends by date</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TrendingUp className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No sales data</EmptyTitle>
                <EmptyDescription>
                  Sync data from Shopify to see sales trends
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "8px", 
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))"
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}    
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
