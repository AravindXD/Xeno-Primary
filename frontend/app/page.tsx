"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { DashboardHeader } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { TopCustomers } from "@/components/dashboard/top-customers"
import { Users, ShoppingBag, DollarSign, Package, TrendingUp, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

// Types matching backend response
interface DashboardData {
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    totalProducts?: number;
    averageOrderValue?: number;
    salesTrend: { date: string; amount: number }[];
    topCustomers: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        totalSpent: number;
        ordersCount: number;
    }[];
    ordersByStatus?: Record<string, number>;
    recentOrders?: Array<{
        id: string;
        orderNumber: number;
        totalPrice: number;
        currency: string;
        financialStatus: string | null;
        createdAt: string;
    }>;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Hardcoded tenant ID for now - in real app, this comes from auth/context
  const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "DEMO_TENANT_ID"; 

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = `/dashboard/stats?tenantId=${TENANT_ID}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const res = await api.get(url);
      setData(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data. Make sure the backend is running and you have synced data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
        setIsSyncing(true);
        const response = await api.post('/ingest/sync', { tenantId: TENANT_ID });
        toast.success("Sync completed successfully", {
          description: `Synced ${response.data.stats?.customers || 0} customers, ${response.data.stats?.products || 0} products, and ${response.data.stats?.orders || 0} orders`
        });
        // Refresh data after sync
        await fetchData();
    } catch (err: any) {
        toast.error("Sync failed", {
          description: err.response?.data?.error || "Failed to sync data from Shopify"
        });
        console.error(err);
    } finally {
        setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  if (status === "loading" || (loading && !data)) {
    return (
      <main className="flex min-h-screen flex-col p-8 bg-background">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  return (
    <main className="flex min-h-screen flex-col p-6 md:p-8 bg-background">
      <DashboardHeader 
        tenantName="Demo Store" 
        onSync={handleSync}
        isSyncing={isSyncing}
      />
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 space-y-6">
        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range Filter
            </CardTitle>
            <CardDescription>
              Filter dashboard data by date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={fetchData} variant="default">
                  Apply
                </Button>
                {(startDate || endDate) && (
                  <Button 
                    onClick={() => { 
                      setStartDate(""); 
                      setEndDate(""); 
                      fetchData(); 
                    }} 
                    variant="outline"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard 
            title="Total Revenue" 
            value={`$${data?.totalRevenue.toFixed(2) || '0.00'}`} 
            icon={DollarSign}
            description="Lifetime sales"
          />
          <StatsCard 
            title="Total Orders" 
            value={data?.totalOrders || 0} 
            icon={ShoppingBag}
            description="Orders processed"
          />
          <StatsCard 
            title="Total Customers" 
            value={data?.totalCustomers || 0} 
            icon={Users}
            description="Active profiles"
          />
          <StatsCard 
            title="Total Products" 
            value={data?.totalProducts || 0} 
            icon={Package}
            description="Products catalog"
          />
          <StatsCard 
            title="Avg Order Value" 
            value={`$${data?.averageOrderValue?.toFixed(2) || '0.00'}`} 
            icon={TrendingUp}
            description="Average per order"
          />
        </div>

        {/* Charts & Tables Row */}
        <div className="grid gap-6 lg:grid-cols-7">
          <SalesChart data={data?.salesTrend || []} />
          <TopCustomers customers={data?.topCustomers || []} />
        </div>
      </div>
    </main>
  );
}
