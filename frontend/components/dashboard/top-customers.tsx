import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import { Users } from "lucide-react"

interface Customer {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    totalSpent: number;
    ordersCount: number;
}

interface TopCustomersProps {
    customers: Customer[];
}

export function TopCustomers({ customers }: TopCustomersProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Top Customers</CardTitle>
        <CardDescription>Top 5 customers by total spend</CardDescription>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No customers found</EmptyTitle>
              <EmptyDescription>
                Sync data from Shopify to see customer information
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="font-medium">
                      {customer.firstName || ""} {customer.lastName || ""}
                      {!customer.firstName && !customer.lastName && "Unknown"}
                    </div>
                    <div className="text-sm text-muted-foreground">{customer.email}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {customer.ordersCount}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${customer.totalSpent.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
