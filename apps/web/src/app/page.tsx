import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Zap, Shield, Code2, ArrowRight, FileOutput, FileCode,
} from "lucide-react";
import {
  SUPPORTED_MARKDOWN_FORMATS, SUPPORTED_PDF_FORMATS, FREE_TIER,
} from "@/lib/constants";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/20 dark:via-background dark:to-purple-950/20" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              Now in Public Beta — Free to use
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Convert any document to{" "}
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Markdown
              </span>{" "}
              or{" "}
              <span className="bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
                PDF
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Powerful document conversion API powered by Docling. PDF, DOCX, PPTX, images and more
              — all converted with high fidelity via a simple REST API.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
                  Get Free API Key <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/docs" />}>
                View API Docs
              </Button>
            </div>
          </div>

          {/* Code preview */}
          <div className="mx-auto mt-16 max-w-2xl">
            <div className="rounded-xl border bg-zinc-950 p-4 text-sm text-zinc-100 shadow-2xl">
              <div className="flex items-center gap-2 pb-3 text-xs text-zinc-500">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2">Convert to Markdown</span>
              </div>
              <pre className="overflow-x-auto font-mono">
{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || "https://api.dockonvert.com"}/v1/convert/markdown \\
  -H "X-API-Key: dk_your_api_key" \\
  -F "file=@document.pdf"`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need for document conversion</h2>
          <p className="mt-3 text-muted-foreground">Simple API, powerful results</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FileCode, title: "To Markdown", desc: "Convert PDF, DOCX, PPTX, images and more to clean Markdown" },
            { icon: FileOutput, title: "To PDF", desc: "Convert DOCX, HTML, TXT, and Markdown to formatted PDF" },
            { icon: Zap, title: "Fast & Reliable", desc: "High-fidelity conversion powered by IBM's Docling engine" },
            { icon: Shield, title: "Secure", desc: "Documents auto-purged after 24 hours. Your data stays yours" },
          ].map((f) => (
            <Card key={f.title} className="border-0 bg-muted/40">
              <CardHeader>
                <f.icon className="h-8 w-8 text-indigo-500" />
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Supported Formats */}
      <section className="border-t bg-muted/20 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold">→ Markdown Conversion</h3>
              <p className="mt-2 text-muted-foreground">Powered by Docling with full table, image, and code extraction</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SUPPORTED_MARKDOWN_FORMATS.map((f) => (
                  <Badge key={f} variant="outline">{f}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold">→ PDF Conversion</h3>
              <p className="mt-2 text-muted-foreground">Clean, formatted PDF output with preserved styling</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SUPPORTED_PDF_FORMATS.map((f) => (
                  <Badge key={f} variant="outline">{f}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-3xl font-bold tracking-tight">Simple, free pricing</h2>
          <p className="mt-3 text-muted-foreground">Start converting documents today — no credit card required</p>
          <Card className="mt-8 border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <Badge className="mx-auto w-fit bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                {FREE_TIER.name}
              </Badge>
              <CardTitle className="text-4xl">$0</CardTitle>
              <p className="text-sm text-muted-foreground">Free forever during beta</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {FREE_TIER.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full" nativeButton={false} render={<Link href="/register" />}>
                Get Started Free
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="border-t bg-muted/30 py-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 text-lg font-semibold">Your documents are safe</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Documents are retained for 24 hours solely for download purposes, then automatically and
            permanently purged from our systems. We do not permanently store, analyze, or share your
            documents. All processing is stateless and ephemeral.
          </p>
        </div>
      </section>
    </>
  );
}
