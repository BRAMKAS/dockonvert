"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, FileOutput, Download, Loader2, X, ArrowLeft } from "lucide-react";
import { API_URL } from "@/lib/constants";
import Link from "next/link";

const OUTPUT_FORMATS = [
  { value: "markdown", label: "Markdown", icon: FileText, desc: "From: All document, text, image, and data formats" },
  { value: "pdf", label: "PDF", icon: FileOutput, desc: "From: All document, text, image, and data formats" },
  { value: "html", label: "HTML", icon: FileText, desc: "From: All document, text, image, and data formats" },
  { value: "txt", label: "Plain Text", icon: FileText, desc: "From: All document, text, image, and data formats" },
  { value: "docx", label: "Word (DOCX)", icon: FileOutput, desc: "From: All document, text, image, and data formats" },
  { value: "json", label: "JSON", icon: FileText, desc: "From: All formats — structured sections output" },
  { value: "xml", label: "XML", icon: FileText, desc: "From: All formats — structured document output" },
  { value: "epub", label: "EPUB (eBook)", icon: FileOutput, desc: "From: All formats — generates readable eBook" },
  { value: "csv", label: "CSV", icon: FileText, desc: "From: XLSX, XLS, ODS, TSV only (tabular data)" },
];

export default function ConvertPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string>("markdown");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("dk_token");
    if (!token) { router.push("/login"); return; }
    setApiKey(token); // Use JWT token for UI conversions
  }, [router]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
    setError(null);
    setResultUrl(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
    setError(null);
    setResultUrl(null);
  }

  async function handleConvert() {
    if (!file || !apiKey) {
      setError(apiKey ? "Please select a file" : "Not authenticated. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);
    setResultUrl(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/v1/convert/${format}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Conversion failed" }));
        setError(data.detail || `Error ${res.status}`);
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const ext = format === "markdown" ? ".md" : ".pdf";

      // Try to get filename from Content-Disposition header
      const disposition = res.headers.get("Content-Disposition");
      let outputName = file.name.replace(/\.[^.]+$/, "") + ext;
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) outputName = match[1];
      }

      setResultUrl(url);
      setResultName(outputName);
    } catch {
      setError("Network error — is the API running?");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = resultName;
    a.click();
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">Convert Document</h1>
      <p className="mt-1 text-muted-foreground">Upload a file and choose your output format</p>

      {/* File Upload */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>1. Upload File</CardTitle>
          <CardDescription>Drag and drop or click to select (max 10MB)</CardDescription>
        </CardHeader>
        <CardContent>
          {file ? (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-indigo-500" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResultUrl(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload file"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Drop your file here or click to browse</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, PPTX, XLSX, HTML, TXT, CSV, Images</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.docx,.doc,.pptx,.xlsx,.xls,.odt,.ods,.odp,.rtf,.epub,.html,.htm,.txt,.csv,.tsv,.md,.xml,.json,.yaml,.yml,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.tif,.svg"
          />
        </CardContent>
      </Card>

      {/* Format Selection */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>2. Choose Output Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {OUTPUT_FORMATS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setFormat(f.value); setResultUrl(null); }}
                className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                  format === f.value
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                    : "border-transparent bg-muted/40 hover:border-muted-foreground/20"
                }`}
              >
                <f.icon className={`mt-0.5 h-5 w-5 ${format === f.value ? "text-indigo-500" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium">{f.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">From: {f.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Convert Button */}
      <div className="mt-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {resultUrl ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-green-200 bg-green-50/50 p-6 dark:border-green-800 dark:bg-green-950/20">
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Conversion complete
            </Badge>
            <p className="text-sm text-muted-foreground">{resultName}</p>
            <div className="flex gap-3">
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> Download {format.toUpperCase()}
              </Button>
              <Button variant="outline" onClick={() => { setFile(null); setResultUrl(null); }}>
                Convert another
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handleConvert}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Converting...
              </>
            ) : (
              <>Convert to {format.toUpperCase()}</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
