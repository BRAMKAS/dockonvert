import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_VERSION } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Release Notes" };

const releases = [
  {
    version: "0.1.0",
    date: "2026-03-24",
    title: "Initial Release — Public Beta",
    changes: [
      "Document to Markdown conversion via Docling (PDF, DOCX, PPTX, XLSX, HTML, Images, CSV, TXT)",
      "Document to PDF conversion (DOCX, DOC, HTML, TXT, Markdown)",
      "User registration with email, Google, and GitHub OAuth",
      "API key generation and management",
      "Dashboard with conversion history and DataTable",
      "24-hour document retention with automatic purge",
      "Rate limiting (100 requests/hour free tier)",
      "API documentation with interactive examples",
      "Blog and changelog system",
      "Full Privacy Policy and Terms of Service",
      "Docker Compose for local development",
      "CI/CD with GitHub Actions and auto version bumping",
    ],
  },
];

export default function ReleasesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Release Notes</h1>
          <p className="mt-2 text-muted-foreground">What&apos;s new in DocKonvert</p>
        </div>
        <Badge variant="outline" className="text-sm">Current: v{APP_VERSION}</Badge>
      </div>

      <div className="mt-8 space-y-8">
        {releases.map((release) => (
          <Card key={release.version}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  v{release.version}
                </Badge>
                <span className="text-sm text-muted-foreground">{release.date}</span>
                {release.version === APP_VERSION && (
                  <Badge variant="secondary">Latest</Badge>
                )}
              </div>
              <CardTitle>{release.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {release.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 text-green-500">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
