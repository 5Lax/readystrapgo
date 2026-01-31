import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StrapSpecs, Hardware } from "@/lib/types";

interface Quote {
  id: string;
  strap_specs: StrapSpecs;
  hardware: Hardware;
  quantity: number;
  estimated_price: number;
  status: string;
  created_at: string;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "submitted":
        return <Badge variant="default">Submitted</Badge>;
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user.email}</p>
          </div>
          <Button asChild>
            <Link href="/builder">New Quote</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Quotes</CardDescription>
              <CardTitle className="text-3xl">{quotes?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl">
                {quotes?.filter((q) => q.status === "draft").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Value</CardDescription>
              <CardTitle className="text-3xl">
                $
                {quotes
                  ?.reduce(
                    (sum, q) => sum + Number(q.estimated_price),
                    0
                  )
                  .toFixed(2) || "0.00"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Quotes</CardTitle>
            <CardDescription>
              View and manage your custom strap quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quotes && quotes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Specs</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(quotes as Quote[]).map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">
                        {formatDate(quote.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="capitalize">
                            {quote.strap_specs.material}
                          </span>{" "}
                          - {quote.strap_specs.length}" x {quote.strap_specs.width}"
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {quote.strap_specs.color}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {quote.quantity}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(quote.estimated_price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(quote.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  You haven&apos;t created any quotes yet.
                </p>
                <Button asChild>
                  <Link href="/builder">Create Your First Quote</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
