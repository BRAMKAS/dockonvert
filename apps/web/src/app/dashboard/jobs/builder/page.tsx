"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Copy, Check, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/constants";

const OUTPUT_FORMATS = [
  { value: "markdown", label: "Markdown (.md)" },
  { value: "pdf", label: "PDF (.pdf)" },
  { value: "html", label: "HTML (.html)" },
  { value: "txt", label: "Plain Text (.txt)" },
  { value: "docx", label: "Word (.docx)" },
  { value: "json", label: "JSON (.json)" },
  { value: "xml", label: "XML (.xml)" },
  { value: "epub", label: "EPUB eBook (.epub)" },
  { value: "csv", label: "CSV (.csv) — tabular inputs only" },
];

export default function JobBuilderPage() {
  const router = useRouter();
  const [importType, setImportType] = useState<"url" | "upload">("url");
  const [importUrl, setImportUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState("markdown");
  const [enableOcr, setEnableOcr] = useState(true);
  const [tableMode, setTableMode] = useState("accurate");
  const [pageSize, setPageSize] = useState("A4");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("dk_token");
    if (!token) router.push("/login");
  }, [router]);

  function buildJobPayload() {
    const tasks: Record<string, Record<string, unknown>> = {};

    if (importType === "url") {
      tasks["import-file"] = { operation: "import/url", url: importUrl };
    } else {
      tasks["import-file"] = { operation: "import/upload" };
    }

    tasks["convert"] = {
      operation: "convert",
      input: "import-file",
      output_format: outputFormat,
      options: {
        ocr: enableOcr,
        table_mode: tableMode,
        ...(outputFormat === "pdf" ? { pdf_page_size: pageSize } : {}),
      },
    };

    tasks["export"] = { operation: "export/url", input: "convert" };

    return {
      tasks,
      ...(webhookUrl ? { webhook: { url: webhookUrl } } : {}),
      ...(tag ? { tag } : {}),
    };
  }

  function generateCurl() {
    const payload = buildJobPayload();
    if (importType === "upload") {
      return `curl -X POST ${API_URL}/v1/jobs/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@document.pdf" \\
  -F "output_format=${outputFormat}" \\
  -F 'options=${JSON.stringify(payload.tasks.convert.options)}' ${tag ? `\\
  -F "tag=${tag}"` : ""}${webhookUrl ? ` \\
  -F "webhook_url=${webhookUrl}"` : ""}`;
    }
    return `curl -X POST ${API_URL}/v1/jobs \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
  }

  function handleCopyCurl() {
    navigator.clipboard.writeText(generateCurl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit() {
    const token = localStorage.getItem("dk_token");
    if (!token) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (importType === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("output_format", outputFormat);
        formData.append("options", JSON.stringify(buildJobPayload().tasks.convert.options));
        if (tag) formData.append("tag", tag);
        if (webhookUrl) formData.append("webhook_url", webhookUrl);

        const res = await fetch(`${API_URL}/v1/jobs/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Job creation failed");
        setResult(data);
      } else {
        if (!importUrl) { setError("Enter a URL to import"); setLoading(false); return; }
        const payload = buildJobPayload();
        const res = await fetch(`${API_URL}/v1/jobs`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Job creation failed");
        setResult(data);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href="/dashboard/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Jobs
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">Job Builder</h1>
      <p className="mt-1 text-muted-foreground">Build and test conversion jobs visually</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Left: Configuration */}
        <div className="space-y-4">
          {/* Import */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Import Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button size="sm" variant={importType === "url" ? "default" : "outline"} onClick={() => setImportType("url")}>
                  From URL
                </Button>
                <Button size="sm" variant={importType === "upload" ? "default" : "outline"} onClick={() => setImportType("upload")}>
                  Upload File
                </Button>
              </div>
              {importType === "url" ? (
                <Input placeholder="https://example.com/document.pdf" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
              ) : (
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.docx,.doc,.pptx,.xlsx,.html,.htm,.txt,.csv,.md,.png,.jpg,.jpeg,.webp" />
              )}
            </CardContent>
          </Card>

          {/* Convert */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Conversion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Output Format</Label>
                <Select value={outputFormat} onValueChange={(v) => v && setOutputFormat(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OUTPUT_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ocr" checked={enableOcr} onCheckedChange={(v) => setEnableOcr(v === true)} />
                <Label htmlFor="ocr">Enable OCR (scanned documents)</Label>
              </div>
              <div>
                <Label>Table Extraction</Label>
                <Select value={tableMode} onValueChange={(v) => v && setTableMode(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accurate">Accurate (slower)</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {outputFormat === "pdf" && (
                <div>
                  <Label>Page Size</Label>
                  <Select value={pageSize} onValueChange={(v) => v && setPageSize(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Webhook URL (optional)</Label>
                <Input placeholder="https://your-server.com/webhook" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
              </div>
              <div>
                <Label>Tag (optional)</Label>
                <Input placeholder="batch-001" value={tag} onChange={(e) => setTag(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Job...</> : <><Play className="mr-2 h-4 w-4" /> Run Job</>}
          </Button>
        </div>

        {/* Right: Preview & Result */}
        <div className="space-y-4">
          {/* API Request Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">API Request</CardTitle>
                <Button size="sm" variant="ghost" onClick={handleCopyCurl}>
                  {copied ? <Check className="mr-1 h-3 w-3 text-green-500" /> : <Copy className="mr-1 h-3 w-3" />}
                  {copied ? "Copied" : "Copy cURL"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-zinc-950 p-3 text-xs text-zinc-100 overflow-x-auto">
                <pre className="font-mono whitespace-pre-wrap">{generateCurl()}</pre>
              </div>
            </CardContent>
          </Card>

          {/* JSON Payload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">JSON Payload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-zinc-950 p-3 text-xs text-zinc-100 overflow-x-auto">
                <pre className="font-mono whitespace-pre-wrap">{JSON.stringify(buildJobPayload(), null, 2)}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}
          {result && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Job Created</CardTitle>
                  <Badge variant="secondary">{(result as Record<string, string>).status}</Badge>
                </div>
                <CardDescription>ID: {(result as Record<string, string>).id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-zinc-950 p-3 text-xs text-zinc-100 overflow-x-auto">
                  <pre className="font-mono whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                </div>
                <Button
                  className="mt-3"
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/dashboard/jobs" />}
                >
                  View All Jobs
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
