import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { signOut } from "next-auth/react"
import { RefreshCw, LogOut } from "lucide-react"

interface HeaderProps {
    tenantName?: string;
    onSync?: () => void;
    isSyncing?: boolean;
}

export function DashboardHeader({ tenantName = "Xeno Store", onSync, isSyncing }: HeaderProps) {
  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of metrics for <span className="font-semibold text-foreground">{tenantName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={onSync} 
            disabled={isSyncing}
            size="default"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Data"}
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <ThemeToggle />
          <Separator orientation="vertical" className="h-6" />
          <Button 
            variant="outline" 
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            size="default"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      <Separator />
    </div>
  )
}
