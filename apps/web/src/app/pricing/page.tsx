import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FREE_TIER } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Start converting documents for free. No credit card required.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-sm">
        <Card className="border-2 border-indigo-200 dark:border-indigo-800">
          <CardHeader className="text-center">
            <Badge className="mx-auto w-fit bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {FREE_TIER.name}
            </Badge>
            <CardTitle className="text-5xl">$0</CardTitle>
            <p className="text-muted-foreground">Free forever during beta</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {FREE_TIER.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <Button className="mt-8 w-full" size="lg" nativeButton={false} render={<Link href="/register" />}>
              Get Started Free
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-xl font-semibold">Need more?</h2>
        <p className="mt-2 text-muted-foreground">
          Pro and Enterprise tiers with higher rate limits, larger file sizes, and priority support
          are coming soon. <a href="mailto:hello@bramkas.com" className="text-indigo-600 underline">Contact us</a> for early access.
        </p>
      </div>
    </div>
  );
}
