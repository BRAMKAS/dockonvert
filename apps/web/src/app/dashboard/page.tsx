"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Key, Activity, Upload } from "lucide-react";
import { DocumentsTable } from "@/components/dashboard/documents-table";
import { ApiKeySection } from "@/components/dashboard/api-key-section";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { useAuthStore } from "@/lib/auth-store";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    // Wait a tick for loadFromStorage to hydrate
    const timeout = setTimeout(() => {
      const token = localStorage.getItem("dk_token");
      if (!token) router.push("/login");
    }, 100);
    return () => clearTimeout(timeout);
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>
        <div className="flex gap-2">
          <Button size="lg" nativeButton={false} render={<Link href="/dashboard/convert" />}>
            <Upload className="mr-2 h-4 w-4" /> Convert
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/dashboard/jobs" />}>
            Jobs
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/dashboard/jobs/builder" />}>
            Job Builder
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Conversions Today", value: "0", icon: FileText },
          { label: "API Requests (1h)", value: "0 / 100", icon: Activity },
          { label: "Active API Keys", value: "1", icon: Key },
          { label: "Documents Stored", value: "0", icon: FileText },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="api-keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys">
          <ApiKeySection />
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Conversion History</CardTitle>
              <CardDescription>
                Documents are automatically purged after 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <UsageChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}
