"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, RefreshCw, Download, Trash2, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/constants";

type Job = {
  id: string;
  status: string;
  tag: string | null;
  tasks: { name: string; operation: string; status: string; result?: Record<string, unknown>; error?: string }[];
  created_at: string;
  updated_at: string | null;
  download_url: string | null;
};

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("dk_token");
    if (!token) { router.push("/login"); return; }
    fetchJobs(token);
  }, [router]);

  async function fetchJobs(token?: string) {
    const t = token || localStorage.getItem("dk_token");
    if (!t) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/jobs?limit=100`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(jobId: string) {
    const token = localStorage.getItem("dk_token");
    if (!token) return;
    await fetch(`${API_URL}/v1/jobs/${jobId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }

  function statusColor(status: string) {
    if (status === "completed") return "default";
    if (status === "failed") return "destructive";
    if (status === "processing") return "secondary";
    return "outline";
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const filtered = jobs.filter(
    (j) => !filter || j.id.includes(filter) || j.tag?.includes(filter) || j.status.includes(filter)
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="mt-1 text-muted-foreground">Async conversion jobs with task pipelines</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchJobs()}>
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/dashboard/jobs/builder" />}>
            Job Builder
          </Button>
        </div>
      </div>

      <Input
        placeholder="Filter by ID, tag, or status..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 max-w-sm"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No jobs yet. Use the Job Builder or API to create conversion jobs.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <Card key={job.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={statusColor(job.status)}>{job.status}</Badge>
                    <code className="text-xs text-muted-foreground">{job.id.slice(0, 12)}...</code>
                    {job.tag && <Badge variant="outline">{job.tag}</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(job.created_at)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {job.tasks.map((t) => (
                    <div key={t.name} className="flex items-center gap-1.5 rounded border px-2 py-1 text-xs">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-muted-foreground">({t.operation})</span>
                      <Badge variant={statusColor(t.status)} className="text-[10px] px-1 py-0">{t.status}</Badge>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {job.download_url && job.status === "completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const token = localStorage.getItem("dk_token");
                        window.open(`${API_URL}${job.download_url}?token=${token}`, "_blank");
                      }}
                    >
                      <Download className="mr-1 h-3 w-3" /> Download
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(job.id)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
