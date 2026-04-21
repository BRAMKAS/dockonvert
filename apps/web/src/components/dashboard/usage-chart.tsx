"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function UsageChart() {
  // Placeholder — replace with a real chart library (recharts, etc.)
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    requests: Math.floor(Math.random() * 30),
  }));

  const max = Math.max(...hours.map((h) => h.requests), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Usage (Last 24 Hours)</CardTitle>
        <CardDescription>Requests per hour · Rate limit: 100/hr</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-end gap-1">
          {hours.map((h) => (
            <div key={h.hour} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-indigo-500 transition-colors group-hover:bg-indigo-400"
                style={{ height: `${(h.requests / max) * 100}%`, minHeight: 2 }}
              />
              <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-zinc-900 px-2 py-1 text-xs text-white group-hover:block">
                {h.requests} req
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>0:00</span>
          <span>12:00</span>
          <span>Now</span>
        </div>
      </CardContent>
    </Card>
  );
}
