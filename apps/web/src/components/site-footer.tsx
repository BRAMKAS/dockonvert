import Link from "next/link";
import { Logo } from "./logo";
import { APP_NAME, APP_VERSION, COMPANY_NAME, COMPANY_URL } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-6" />
              <span className="font-semibold">{APP_NAME}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Convert any document to Markdown or PDF via API.
              <br />A product by{" "}
              <a href={COMPANY_URL} className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                {COMPANY_NAME}
              </a>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">v{APP_VERSION}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/docs" className="hover:text-foreground">API Documentation</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/releases" className="hover:text-foreground">Release Notes</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href={COMPANY_URL} className="hover:text-foreground" target="_blank" rel="noopener noreferrer">BRAMKAS INC</a></li>
              <li><a href="https://talentsuite.bramkas.com" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">TalentSuite</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Documents are retained for 24 hours for download purposes only, then automatically purged.
            We do not permanently store your documents.
          </p>
        </div>
      </div>
    </footer>
  );
}
