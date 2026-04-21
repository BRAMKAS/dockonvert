import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Blog" };

const posts = [
  {
    slug: "introducing-dockonvert",
    title: "Introducing DocKonvert — Document Conversion API by BRAMKAS",
    excerpt: "We're launching DocKonvert, a powerful API for converting documents to Markdown and PDF. Built on IBM's Docling engine with support for PDF, DOCX, PPTX, images, and more.",
    category: "announcement",
    date: "2026-03-24",
    author: "BRAMKAS Team",
  },
  {
    slug: "why-markdown",
    title: "Why Markdown? The Case for Universal Document Format",
    excerpt: "Markdown is becoming the lingua franca of technical documentation. Here's why converting your documents to Markdown unlocks powerful workflows.",
    category: "guide",
    date: "2026-03-24",
    author: "BRAMKAS Team",
  },
  {
    slug: "docling-under-the-hood",
    title: "Docling Under the Hood — How We Convert Documents",
    excerpt: "A deep dive into IBM's Docling engine and how DocKonvert leverages it for high-fidelity document conversion with table extraction, OCR, and more.",
    category: "changelog",
    date: "2026-03-24",
    author: "BRAMKAS Team",
  },
];

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
      <p className="mt-2 text-muted-foreground">Updates, guides, and changelog</p>

      <div className="mt-8 space-y-6">
        {posts.map((post) => (
          <Card key={post.slug} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{post.category}</Badge>
                <span className="text-xs text-muted-foreground">{post.date}</span>
              </div>
              <CardTitle className="text-xl">
                <Link href={`/blog/${post.slug}`} className="hover:text-indigo-600">
                  {post.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{post.excerpt}</p>
              <p className="mt-2 text-xs text-muted-foreground">By {post.author}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
